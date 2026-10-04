// Progressive streaming engine: resolves a Deezer track, opens the decrypted
// stream, and either
//  - persists it, disk-first: decrypted bytes → TrackSpool (temp file under
//    os.tmpdir()) → tagged in memory → one R2 PUT under the C9 key
//    tracks/{trackId}/{bitrate}{ext} → StoredTrack row. The HTTP response
//    (and any same-instance follower) is a tail reader of the spool, so the
//    listener's pace never stalls the upload and the server never keeps the
//    unread remainder of a track in memory; or
//  - streams it live only (preview / head prefetch / byte ranges / plays that
//    another instance is persisting) at the listener's pace, without touching
//    storage.
// Goal: Spotify-like "play-while-downloading" — the user hears audio as soon
// as the first decrypted bytes arrive, and the next play comes from R2.

import { PassThrough } from "stream";
import { utils, type Deezer } from "@/lib/deezer";
import { openDecryptedStream, inferContentTypeFromBitrate, probeTrack } from "./decryption";
import { DeezerStreamError, TruncatedStreamError, UpstreamHttpError } from "./stream-errors";
import { TrackUnavailableError } from "./errors";
import { tagTrackBuffer } from "./utils/downloadUtils";
import { getPreferredBitrate } from "./utils/getPreferredBitrate";
import Track, { formatsName } from "./types/Track";
import type { Settings } from "./types/Settings";
import type { StorageProvider } from "./storage/StorageProvider";
import { gwTrackCache, gwTrackKey } from "./cache/deezer-track-cache";
import { fetchCoverImage } from "./cache/metadata-cache";
import { STORAGE_TYPE, trackExtension, trackObjectKey } from "./storage/objects";
import { capByLicence, licenceFromDeezerUser } from "./storage/cached-copy";
import { pumpTee, pumpToSpool, toWebStream, TrackSpool } from "./tee-pump";

const { mapGwTrackToDeezer } = utils;

/** How long a persist waits for metadata once the audio is complete, before uploading untagged. */
export const ENRICHMENT_WAIT_MS = 20_000;

export interface ProgressiveResult {
	body: ReadableStream<Uint8Array>;
	contentType: string;
	/** Bytes in this response body; 0 when unknown. */
	contentLength: number;
	/** Decoded size of the whole track; null when unknown. */
	totalLength: number | null;
	/** Offset of the body's first byte in the track (ranges). */
	start: number;
	/** Offset of the body's last byte (inclusive); null when unknown. */
	end: number | null;
	/** The Deezer CDN honours Range for this file. */
	rangeSupported: boolean;
	/**
	 * Settles once the persist pipeline (tag → R2 upload → DB row) is done.
	 * Never rejects. Callers must hand it to `after()` — on Vercel the
	 * function is frozen as soon as the response ends otherwise.
	 */
	persisted: Promise<void>;
}

/** What a persisting holder publishes for same-instance followers (C4). */
export interface SharedSpool {
	spool: TrackSpool;
	contentType: string;
	totalLength: number | null;
	rangeSupported: boolean;
}

export interface ProgressiveOptions {
	dz: Deezer;
	trackId: string;
	/** Server maxBitrate (M). */
	bitrate: number;
	settings: Settings;
	storageProvider: StorageProvider;
	userId: string;
	/**
	 * Same-instance dedup lock of a persisting play: `publish` hands the spool
	 * to followers once it exists; `release` runs when the persist settles.
	 */
	lock?: { release: () => void; publish?: (shared: SharedSpool | null) => void };
	/** Cross-instance PersistLease: released when the persist settles. */
	lease?: { release: () => Promise<void> | void };
	/**
	 * Persist the decrypted bytes to R2 / DB as they flow. Set false for
	 * hover-prefetch streams that should not pollute storage — and for plays
	 * another holder is persisting. Default true.
	 */
	persist?: boolean;
	/**
	 * Cap the response body at this many decrypted bytes (live-only). Once
	 * the cap is reached the response ends cleanly and the upstream Deezer
	 * connection is closed.
	 */
	maxBytes?: number;
	/** Live-only decoded byte range [start, end] (C2). Never persisted. */
	range?: { start: number; end?: number };
	/** Closes the CDN request when the client goes away (live-only streams). */
	signal?: AbortSignal;
	/** Test hook for ENRICHMENT_WAIT_MS. */
	enrichmentWaitMs?: number;
}

type GwTrack = Awaited<ReturnType<Deezer["gw"]["get_track_with_fallback"]>>;

/**
 * gw track (cached per Deezer user: the answer carries their TRACK_TOKEN) →
 * Track with a resolved bitrate and download URL. Throws TrackUnavailableError
 * when nothing can be streamed, or getPreferredBitrate's errors.
 */
export async function resolveStreamTrack(dz: Deezer, trackId: string, bitrate: number, settings: Settings) {
	const key = gwTrackKey(dz.currentUser?.id, trackId);
	let gwTrack = gwTrackCache.get(key) as GwTrack | null;
	if (!gwTrack) {
		gwTrack = await dz.gw.get_track_with_fallback(trackId);
		gwTrackCache.set(key, gwTrack);
	}
	const apiTrack = mapGwTrackToDeezer(gwTrack);

	const track = new Track();
	track.parseEssentialData(apiTrack);
	if (track.local) {
		throw new TrackUnavailableError("Local tracks are not supported in progressive streaming");
	}

	const resolvedBitrate = await getPreferredBitrate(
		dz,
		track,
		bitrate,
		settings.fallbackBitrate,
		settings.feelingLucky,
		"",
		null
	);
	track.bitrate = resolvedBitrate as typeof track.bitrate;
	track.downloadURL = track.urls[formatsName[track.bitrate]];
	if (!track.downloadURL) throw new TrackUnavailableError("Track URL not available");
	return { track, apiTrack, resolvedBitrate };
}

/**
 * C3: proves the track is streamable for this account (gw + URL + the first
 * 2 KiB from the CDN) without opening the audio stream or persisting.
 */
export async function probeProgressiveStream(
	dz: Deezer,
	trackId: string,
	bitrate: number,
	settings: Settings
): Promise<void> {
	const { track } = await resolveStreamTrack(dz, trackId, bitrate, settings);
	await probeTrack(track);
}

const UNAVAILABLE = new Set([
	"TrackUnavailableError",
	"WrongLicense",
	"WrongGeolocation",
	"PreferredBitrateNotFound",
	"TrackNot360",
]);
const NETWORK_ERRORS = new Set(["RequestError", "ReadError", "TimeoutError", "HTTPError", "MaxRedirectsError"]);

/**
 * HTTP answer for a failure before any audio byte was sent: 422
 * TRACK_UNAVAILABLE (not streamable for this account / gone from the CDN),
 * 502 UPSTREAM_ERROR (Deezer failing), null for anything else (500).
 */
export function classifyStreamError(e: unknown): { status: number; code: string; message: string } | null {
	if (!(e instanceof Error)) return null;
	const unavailable = { status: 422, code: "TRACK_UNAVAILABLE", message: "This track is not available for streaming." };
	const upstream = { status: 502, code: "UPSTREAM_ERROR", message: "Deezer did not deliver the track. Try again." };
	if (UNAVAILABLE.has(e.name)) return unavailable;
	if (e instanceof UpstreamHttpError) {
		return [403, 404, 410].includes(e.statusCode) ? unavailable : upstream;
	}
	if (e instanceof DeezerStreamError) return upstream;
	if (e.name === "GWAPIError") {
		// gw.ts: data errors carry the JSON error object, transport errors "method args:: Name: msg".
		return e.message.trimStart().startsWith("{") ? unavailable : upstream;
	}
	if (NETWORK_ERRORS.has(e.name)) return upstream;
	return null;
}

function settleWithin<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
	return new Promise<T>((resolve) => {
		const timer = setTimeout(() => resolve(fallback), ms);
		timer.unref?.();
		p.then(
			(v) => {
				clearTimeout(timer);
				resolve(v);
			},
			() => {
				clearTimeout(timer);
				resolve(fallback);
			}
		);
	});
}

/** Live-only: follows the listener's pace, persists nothing. */
async function startLiveStream(
	track: Track,
	opts: Pick<ProgressiveOptions, "maxBytes" | "range" | "signal">
): Promise<ProgressiveResult> {
	const stream = await openDecryptedStream(track, {
		signal: opts.signal,
		start: opts.range?.start,
		end: opts.range?.end,
	});
	const responseBranch = new PassThrough();
	void pumpTee({ source: stream.readable, responseBranch, maxBytes: opts.maxBytes, abort: stream.abort });
	const length = stream.contentLength ?? 0;
	return {
		body: toWebStream(responseBranch),
		contentType: stream.contentType,
		contentLength: opts.maxBytes && length ? Math.min(opts.maxBytes, length) : length,
		totalLength: stream.totalLength,
		start: stream.start,
		end: stream.end,
		rangeSupported: stream.rangeSupported,
		persisted: Promise.resolve(),
	};
}

export async function startProgressiveStream(opts: ProgressiveOptions): Promise<ProgressiveResult> {
	const { dz, trackId, bitrate, settings, storageProvider, lock, lease } = opts;
	const persist = (opts.persist ?? true) && !opts.range;

	if (!persist) {
		// Live-only streams never hold the dedup lock or lease.
		lock?.release();
		void lease?.release();
		const { track } = await resolveStreamTrack(dz, trackId, bitrate, settings);
		return startLiveStream(track, opts);
	}

	const { track, apiTrack, resolvedBitrate } = await resolveStreamTrack(dz, trackId, bitrate, settings);
	// The quality this play asked for: the server setting capped by the
	// persisting account's licence. A lower resolvedBitrate then means Deezer
	// had nothing better (see storage/cached-copy.ts).
	const requestedBitrate = capByLicence(bitrate, licenceFromDeezerUser(dz.currentUser));

	// Metadata for the tags, in parallel with the download. Best-effort: a
	// failure only means an untagged upload.
	const enrichment = (async () => {
		// The gw mapping lacks some optional API fields; parseData tolerates them.
		const existing = apiTrack as Parameters<Track["parseData"]>[2];
		await track.parseData(dz, trackId, existing, undefined, undefined, false);
		track.applySettings(settings);
		if (track.album) track.album.bitrate = resolvedBitrate;
		return true;
	})().catch((e) => {
		console.warn("[progressive-stream] enrichment failed, the file will be untagged:", e);
		return false;
	});
	const cover = enrichment
		.then(async (ok) => {
			if (!ok || !settings.tags?.cover || !track.album?.pic) return null;
			const format = settings.embeddedArtworkPNG ? "png" : `jpg-${settings.jpegImageQuality}`;
			const url = track.album.pic.getURL(settings.embeddedArtworkSize, format);
			track.album.embeddedCoverURL = url;
			return fetchCoverImage(url);
		})
		.catch(() => null);

	// No signal: the persist outlives the client (the response may be cancelled).
	const stream = await openDecryptedStream(track);
	let spool: TrackSpool;
	try {
		spool = await TrackSpool.create();
	} catch (e) {
		stream.abort();
		throw e;
	}
	lock?.publish?.({
		spool,
		contentType: stream.contentType,
		totalLength: stream.totalLength,
		rangeSupported: stream.rangeSupported,
	});
	void pumpToSpool({ source: stream.readable, spool, abort: stream.abort });
	// A fresh spool always has its file: the reader is never null here.
	const reader = spool.createReader()!;

	const persisted = (async () => {
		try {
			// S6: a truncated / failed decrypt rejects here — nothing is tagged,
			// uploaded or recorded.
			const bytes = await spool.done;
			if (bytes === 0) throw new Error("empty audio stream");
			if (stream.totalLength != null && bytes !== stream.totalLength) {
				throw new TruncatedStreamError(stream.totalLength, bytes);
			}

			const ext = trackExtension(resolvedBitrate);
			const key = trackObjectKey(trackId, resolvedBitrate);
			let data = await spool.readAll();
			if (await settleWithin(enrichment, opts.enrichmentWaitMs ?? ENRICHMENT_WAIT_MS, false)) {
				try {
					data = await tagTrackBuffer(ext, data, track, settings.tags, await cover);
				} catch (e) {
					console.warn("[progressive-stream] tagging failed, uploading untagged:", e);
				}
			}
			await storageProvider.writeFile(key, data);

			// Record the global StoredTrack so future plays hit the cached file.
			// Per-user state (SavedTrack / RecentPlay) is set independently.
			const { prisma } = await import("@/lib/prisma");
			const where = { trackId_bitrate: { trackId, bitrate: resolvedBitrate } };
			const previous = await prisma.storedTrack.findUnique({ where, select: { storagePath: true } });
			const row = {
				storagePath: key,
				storageType: STORAGE_TYPE,
				fileSize: data.length,
				requestedBitrate,
			};
			await prisma.storedTrack.upsert({
				where,
				// createdAt = when this copy was persisted (eviction grace period).
				update: { ...row, createdAt: new Date() },
				create: { trackId, bitrate: resolvedBitrate, ...row },
			});
			// A legacy row of this track/bitrate pointed at an old template path:
			// drop that object unless another row still uses it.
			if (previous && previous.storagePath !== key) {
				const users = await prisma.storedTrack.count({ where: { storagePath: previous.storagePath } });
				if (users === 0) await storageProvider.deleteFile(previous.storagePath);
			}
		} catch (e) {
			console.error("[progressive-stream] persist failed:", e);
		} finally {
			lock?.release();
			try {
				await lease?.release();
			} catch (e) {
				console.warn("[progressive-stream] lease release failed:", e);
			}
			spool.dispose();
		}
	})();

	return {
		body: toWebStream(reader),
		contentType: stream.contentType,
		contentLength: stream.totalLength ?? 0,
		totalLength: stream.totalLength,
		start: 0,
		end: stream.end,
		rangeSupported: stream.rangeSupported,
		persisted,
	};
}

/**
 * A same-instance follower (C4): reads the holder's in-progress spool from
 * the start, at its own pace. Null when the spool is gone or failed — the
 * caller then streams live.
 */
export function followProgressiveStream(shared: SharedSpool): ProgressiveResult | null {
	if (shared.spool.failed) return null;
	const reader = shared.spool.createReader();
	if (!reader) return null;
	const total = shared.totalLength;
	return {
		body: toWebStream(reader),
		contentType: shared.contentType,
		contentLength: total ?? 0,
		totalLength: total,
		start: 0,
		end: total ? total - 1 : null,
		rangeSupported: shared.rangeSupported,
		persisted: Promise.resolve(),
	};
}

export { inferContentTypeFromBitrate };
