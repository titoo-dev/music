// Progressive streaming orchestrator: opens a Deezer track stream, decrypts
// it on the fly, and tees the bytes into (a) the HTTP response body and
// (b) a persistence pipeline (write → tag → finalize → DB upsert).
// Goal: Spotify-like "play-while-downloading" — the user starts hearing audio
// as soon as the first decrypted bytes arrive, while the file is persisted in
// parallel so subsequent plays come from S3/local storage.

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

const TEMPDIR = tmpdir() + "/deemix-imgs";
mkdirSync(TEMPDIR, { recursive: true });

export interface ProgressiveResult {
	body: ReadableStream<Uint8Array>;
	contentType: string;
	/** 0 when unknown — Chrome streams fine without Content-Length. */
	contentLength: number;
}

export interface ProgressiveOptions {
	dz: Deezer;
	trackId: string;
	bitrate: number;
	settings: Settings;
	storageProvider: StorageProvider;
	userId: string;
	lock?: { release: () => void };
}

export async function startProgressiveStream(
	opts: ProgressiveOptions
): Promise<ProgressiveResult> {
	const { dz, trackId, bitrate, settings, storageProvider, userId, lock } = opts;

	// Step 1 — Single fast fetch from Deezer GW. This populates the essentials
	// (id, MD5, mediaVersion, trackToken, fallbackID, filesizes) needed by
	// getPreferredBitrate. Heavy enrichment (lyrics, BPM, album/artist details)
	// is deferred to a parallel promise that the persist branch awaits before
	// tagging — it isn't required to start streaming.
	const gwTrack = await dz.gw.get_track_with_fallback(trackId);
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
	// just fine, so we don't await contentLengthPromise either.
	const { readable, contentType, contentLengthPromise, abort } =
		streamTrackToReadable(track);

	// Pre-warm the contentLengthPromise so it doesn't reject silently
	void contentLengthPromise.catch(() => 0);
	const contentLength = 0;

	// Step 5 — Defer path generation + artwork download until enrichment is
	// done. These happen in parallel with the live stream consumption.
	const persistSetupPromise = enrichmentPromise.then(async () => {
		if (track.album) track.album.bitrate = resolvedBitrate;
		const { filename, filepath } = generatePath(track as any, "track", settings);
		await storageProvider.ensureDir(filepath);
		const extension = extensions[track.bitrate];
		const writepath = `${filepath}/${filename}${extension}`;
		const partPath = writepath + ".part";
		return { writepath, partPath, extension };
	});

	// Embedded cover art — fire-and-forget; persist branch awaits before tagging
	const artworkPromise: Promise<string | null> = enrichmentPromise.then(
		async () => {
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
		}
	);
	artworkPromise.catch(() => {});

	// Step 7 — Tee: drive the source and write to both branches.
	// responseBranch feeds the HTTP response (browser audio element).
	// persistBranch feeds the storage write stream (local FS or S3 temp file).
	// If the client disconnects (responseBranch closes), persistence keeps going.
	const responseBranch = new PassThrough();
	const persistBranch = new PassThrough();
	let responseClosed = false;

	const markResponseClosed = () => {
		responseClosed = true;
	};
	responseBranch.on("close", markResponseClosed);
	responseBranch.on("error", markResponseClosed);

	(async () => {
		try {
			for await (const chunk of readable) {
				const buf = chunk as Buffer;

				// Always feed persistence (local FS / temp file → fast)
				if (!persistBranch.destroyed) {
					persistBranch.write(buf);
				}

				// Feed response only if still open; respect backpressure
				if (!responseClosed && !responseBranch.destroyed) {
					try {
						if (!responseBranch.write(buf)) {
							await new Promise<void>((resolve) => {
								const done = () => {
									responseBranch.off("drain", done);
									responseBranch.off("close", done);
									resolve();
								};
								responseBranch.once("drain", done);
								responseBranch.once("close", done);
							});
						}
					} catch {
						responseClosed = true;
					}
				}
			}
			if (!persistBranch.destroyed) persistBranch.end();
			if (!responseClosed && !responseBranch.destroyed) responseBranch.end();
		} catch (e) {
			abort();
			if (!persistBranch.destroyed) persistBranch.destroy(e as Error);
			if (!responseClosed && !responseBranch.destroyed) {
				responseBranch.destroy(e as Error);
			}
		}
	})();

	// Step 8 — Persistence pipeline (fire-and-forget; runs to completion even if
	// the client disconnects). Waits for persistSetupPromise to know writepath,
	// then tags the file, finalizes storage, and creates the DB rows so the
	// next playback uses /api/v1/stream/[trackId] directly.
	void (async () => {
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

			// Atomic rename: .part → final (S3: just remaps temp→final mapping)
			await storageProvider.rename(partPath, writepath);

			// Make sure the cover art finished downloading before tagging
			await artworkPromise;

			// Tag in place — for S3, getLocalPath returns the temp file
			const localPath = storageProvider.getLocalPath(writepath);
			await tagTrack(extension, localPath, track, settings.tags);

			// Upload to S3 (no-op for LocalStorageProvider)
			await storageProvider.finalizeStream(writepath);

			// Record the global StoredTrack so future plays hit the cached file.
			// Per-user state (SavedTrack / RecentPlay) is set independently by the
			// user's actions (save) or playback rules (30s threshold).
			const { prisma } = await import("@/lib/prisma");
			const storageType = settings.storageType || "local";
			await prisma.storedTrack.upsert({
				where: { trackId_bitrate: { trackId, bitrate: resolvedBitrate } },
				update: { storagePath: writepath, storageType },
				create: {
					trackId,
					bitrate: resolvedBitrate,
					storagePath: writepath,
					storageType,
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

	// Step 9 — Convert Node Readable to Web ReadableStream for Next.js Response
	const body = Readable.toWeb(responseBranch) as unknown as ReadableStream<Uint8Array>;

	return {
		body,
		contentType,
		contentLength,
	};
}

export { inferContentTypeFromBitrate };
