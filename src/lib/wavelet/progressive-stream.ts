// Progressive streaming orchestrator: opens a Deezer track stream, decrypts
// it on the fly, and tees the bytes into (a) the HTTP response body and
// (b) a persistence pipeline (write → tag → finalize → DB upsert).
// Goal: Spotify-like "play-while-downloading" — the user starts hearing audio
// as soon as the first decrypted bytes arrive, while the file is persisted in
// parallel so subsequent plays come from R2.

import { PassThrough, Readable } from "stream";
import { TrackFormats, utils, type Deezer } from "@/lib/deezer";
import {
	streamTrackToReadable,
	inferContentTypeFromBitrate,
} from "./decryption";
import { tagTrack } from "./utils/downloadUtils";
import { generatePath } from "./utils/pathtemplates";
import { getPreferredBitrate } from "./utils/getPreferredBitrate";
import { downloadImage } from "./utils/downloadImage";
import Track, { formatsName } from "./types/Track";
import type { Settings } from "./types/Settings";
import type { StorageProvider } from "./storage/StorageProvider";
import { gwTrackCache } from "./cache/deezer-track-cache";
import { STORAGE_TYPE } from "./storage/objects";
import { pumpTee } from "./tee-pump";
import { mkdirSync } from "fs";
import { tmpdir } from "os";

const { mapGwTrackToDeezer } = utils;

const extensions = {
	[TrackFormats.FLAC]: ".flac",
	[TrackFormats.LOCAL]: ".mp3",
	[TrackFormats.MP3_320]: ".mp3",
	[TrackFormats.MP3_128]: ".mp3",
	[TrackFormats.DEFAULT]: ".mp3",
	[TrackFormats.MP4_RA3]: ".mp4",
	[TrackFormats.MP4_RA2]: ".mp4",
	[TrackFormats.MP4_RA1]: ".mp4",
} as const;

const TEMPDIR = tmpdir() + "/wavelet-imgs";
mkdirSync(TEMPDIR, { recursive: true });

export interface ProgressiveResult {
	body: ReadableStream<Uint8Array>;
	contentType: string;
	/** 0 when unknown — Chrome streams fine without Content-Length. */
	contentLength: number;
	/**
	 * Settles once the persist pipeline (tag → R2 upload → DB row) is done.
	 * Never rejects. Callers must hand it to `after()` — on Vercel the
	 * function is frozen as soon as the response ends otherwise.
	 */
	persisted: Promise<void>;
}

export interface ProgressiveOptions {
	dz: Deezer;
	trackId: string;
	bitrate: number;
	settings: Settings;
	storageProvider: StorageProvider;
	userId: string;
	lock?: { release: () => void };
	/**
	 * Persist the decrypted bytes to R2 / DB as they flow.
	 * Set false for hover-prefetch streams that should not pollute storage —
	 * the bytes are streamed to the client only and discarded server-side.
	 * Default true.
	 */
	persist?: boolean;
	/**
	 * Cap the response body at this many decrypted bytes. Used together with
	 * preview mode so a sliding-window prefetch over a list doesn't pull
	 * the whole track. Once the cap is reached, the response branch ends
	 * cleanly and the upstream Deezer connection is closed.
	 */
	maxBytes?: number;
}

export async function startProgressiveStream(
	opts: ProgressiveOptions
): Promise<ProgressiveResult> {
	const {
		dz,
		trackId,
		bitrate,
		settings,
		storageProvider,
		userId,
		lock,
		persist = true,
		maxBytes,
	} = opts;

	// Step 1 — Single fast fetch from Deezer GW. This populates the essentials
	// (id, MD5, mediaVersion, trackToken, fallbackID, filesizes) needed by
	// getPreferredBitrate. Heavy enrichment (lyrics, BPM, album/artist details)
	// is deferred to a parallel promise that the persist branch awaits before
	// tagging — it isn't required to start streaming.
	//
	// In-memory TTL cache: track metadata is global to all users, so caching
	// by trackId is safe. The TRACK_TOKEN inside is short-lived but valid
	// well beyond our 5-min TTL window.
	let gwTrack = gwTrackCache.get(String(trackId)) as Awaited<
		ReturnType<typeof dz.gw.get_track_with_fallback>
	> | null;
	if (!gwTrack) {
		gwTrack = await dz.gw.get_track_with_fallback(trackId);
		gwTrackCache.set(String(trackId), gwTrack);
	}
	const apiTrack: any = mapGwTrackToDeezer(gwTrack);

	const track = new Track();
	track.parseEssentialData(apiTrack);

	if (track.local) {
		throw new Error("Local tracks are not supported in progressive streaming");
	}

	// Step 2 — Kick off full metadata enrichment in parallel with URL
	// resolution. Both touch different fields on `track` so they don't race.
	// The persist branch awaits this before generating paths / tagging.
	const enrichmentPromise = (async () => {
		await track.parseData(dz, trackId, apiTrack, undefined, undefined, false);
		track.applySettings(settings);
	})();
	// Don't leave it as an unhandled rejection if it errors before being awaited
	enrichmentPromise.catch(() => {});

	// Step 3 — Resolve preferred bitrate (writes track.urls[formatName] = url).
	// Runs in parallel with the enrichment above.
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
	if (!track.downloadURL) {
		throw new Error("Track URL not available");
	}

	// Step 4 — Open the decrypted Deezer stream NOW. We have the URL, that's
	// all we need. Chrome handles chunked responses without Content-Length
	// just fine. We don't set Content-Length because the depadder trims a
	// variable number of leading zero bytes, so Deezer's content-length
	// would be slightly off — the browser would stall waiting for missing
	// bytes or cut off the tail.
	const { readable, contentType, contentLengthPromise, abort } =
		streamTrackToReadable(track);

	void contentLengthPromise.catch(() => 0);
	const contentLength = 0;

	// Step 5 — Defer path generation + artwork download until enrichment is
	// done. These happen in parallel with the live stream consumption.
	// In preview mode (persist=false) we skip both since nothing is written.
	const persistSetupPromise = persist
		? enrichmentPromise.then(async () => {
				if (track.album) track.album.bitrate = resolvedBitrate;
				const { filename, filepath } = generatePath(track as any, "track", settings);
				await storageProvider.ensureDir(filepath);
				const extension = extensions[track.bitrate];
				const writepath = `${filepath}/${filename}${extension}`;
				const partPath = writepath + ".part";
				return { writepath, partPath, extension };
			})
		: null;

	const artworkPromise: Promise<string | null> = persist
		? enrichmentPromise.then(async () => {
				try {
					if (!track.album?.pic) return null;
					let embeddedImageFormat = `jpg-${settings.jpegImageQuality}`;
					if (settings.embeddedArtworkPNG) embeddedImageFormat = "png";
					const url = track.album.pic.getURL(
						settings.embeddedArtworkSize,
						embeddedImageFormat
					);
					track.album.embeddedCoverURL = url;
					let ext = url.slice(-4);
					if (ext.charAt(0) !== ".") ext = ".jpg";
					const coverTmp = `${TEMPDIR}/alb${track.album.id}_${settings.embeddedArtworkSize}${ext}`;
					const path = await downloadImage(url, coverTmp);
					track.album.embeddedCoverPath = path || coverTmp;
					return path || coverTmp;
				} catch {
					return null;
				}
			})
		: Promise.resolve(null);
	artworkPromise.catch(() => {});

	// Step 7 — Drive the source. In persist mode we tee into responseBranch
	// (HTTP) and persistBranch (/tmp → R2 upload); in preview mode we only feed
	// responseBranch and discard the rest, so the client gets bytes immediately
	// and nothing pollutes storage.
	const responseBranch = new PassThrough();
	const persistBranch = persist ? new PassThrough() : null;
	void pumpTee({ source: readable, responseBranch, persistBranch, maxBytes, abort });

	// Step 8 — Persistence pipeline (runs to completion even if the client
	// disconnects, as long as the caller keeps `persisted` alive via after()). Waits for persistSetupPromise to know writepath,
	// then tags the file, finalizes storage, and creates the DB rows so the
	// next playback uses /api/v1/stream/[trackId] directly.
	// Skipped entirely when persist=false (preview / hover-prefetch mode).
	let persisted: Promise<void> = Promise.resolve();
	if (persist && persistBranch && persistSetupPromise) {
		persisted = (async () => {
			let writepath: string | null = null;
			let partPath: string | null = null;
			let extension: string | null = null;

			try {
				const setup = await persistSetupPromise;
				writepath = setup.writepath;
				partPath = setup.partPath;
				extension = setup.extension;

				const writeStream = storageProvider.createWriteStream(partPath);
				await new Promise<void>((resolve, reject) => {
					persistBranch.pipe(writeStream as NodeJS.WritableStream);
					writeStream.on("finish", () => resolve());
					writeStream.on("error", reject);
					persistBranch.on("error", reject);
				});

				// Atomic rename: .part → final (R2: just remaps the temp file mapping)
				await storageProvider.rename(partPath, writepath);

				// Make sure the cover art finished downloading before tagging
				await artworkPromise;

				// Tag in place — getLocalPath returns the /tmp file
				const localPath = storageProvider.getLocalPath(writepath);
				await tagTrack(extension, localPath, track, settings.tags);

				// Upload the tagged temp file to R2
				await storageProvider.finalizeStream(writepath);

				// Record the global StoredTrack so future plays hit the cached file.
				// Per-user state (SavedTrack / RecentPlay) is set independently by the
				// user's actions (save) or playback rules (30s threshold).
				const { prisma } = await import("@/lib/prisma");
				await prisma.storedTrack.upsert({
					where: { trackId_bitrate: { trackId, bitrate: resolvedBitrate } },
					update: { storagePath: writepath, storageType: STORAGE_TYPE },
					create: {
						trackId,
						bitrate: resolvedBitrate,
						storagePath: writepath,
						storageType: STORAGE_TYPE,
					},
				});
			} catch (e) {
				console.error("[progressive-stream] persist failed:", e);
				if (partPath) {
					try {
						await storageProvider.deleteFile(partPath);
					} catch {}
				}
			} finally {
				lock?.release();
			}
		})();
	} else {
		// Preview mode — release the lock as soon as the response stream finishes.
		responseBranch.on("close", () => lock?.release());
		responseBranch.on("end", () => lock?.release());
	}

	// Step 9 — Convert Node PassThrough to Web ReadableStream. We hand-roll
	// the bridge instead of using Readable.toWeb because the built-in bridge
	// races on client disconnect: Node emits a final 'data' chunk, the bridge
	// calls controller.enqueue(), but the controller has already been closed
	// from the cancel signal — the resulting "Invalid state: Controller is
	// already closed" surfaces as an uncaughtException in dev mode. Wrapping
	// every controller call in try/catch makes the late-write a no-op, and
	// pause/resume on the Node side propagates consumer backpressure upstream
	// so a preview stream doesn't outpace a slow audio element (persisting
	// streams ignore it — see pumpTee).
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			let closed = false;
			const safeEnqueue = (chunk: Buffer) => {
				if (closed) return;
				try {
					controller.enqueue(new Uint8Array(chunk));
				} catch {
					closed = true;
				}
				if (
					!closed &&
					controller.desiredSize !== null &&
					controller.desiredSize <= 0 &&
					!responseBranch.isPaused()
				) {
					responseBranch.pause();
				}
			};
			const safeClose = () => {
				if (closed) return;
				closed = true;
				try {
					controller.close();
				} catch {}
			};
			const safeError = (err: unknown) => {
				if (closed) return;
				closed = true;
				try {
					controller.error(err);
				} catch {}
			};

			responseBranch.on("data", safeEnqueue);
			responseBranch.on("end", safeClose);
			responseBranch.on("close", safeClose);
			responseBranch.on("error", safeError);
		},
		pull() {
			if (responseBranch.isPaused() && !responseBranch.destroyed) {
				responseBranch.resume();
			}
		},
		cancel() {
			// Client aborted — tear down the response branch so the streaming
			// loop sees responseClosed and stops feeding it. The persist branch
			// (if any) keeps running independently.
			if (!responseBranch.destroyed) {
				responseBranch.destroy();
			}
		},
	});

	return {
		body,
		contentType,
		contentLength,
		persisted,
	};
}

export { inferContentTypeFromBitrate };
