import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeezerAndApp, fail, handleError } from "../../_lib/helpers";
import { startProgressiveStream } from "@/lib/wavelet/progressive-stream";
import { headObject } from "@/lib/blob-stream";
import { BLOB_STORAGE_TYPE, isStorageNotFound } from "@/lib/wavelet/storage/blob";

// The persist pipeline (tag + Blob upload) runs in after() once the audio
// response ends; give it room on long FLAC tracks.
export const maxDuration = 300;

// GET /api/v1/stream-progressive/[trackId]
// Spotify-like progressive playback: streams live from Deezer, decrypts
// on the fly, persists to Vercel Blob in parallel. If the file is already cached
// (StoredTrack exists), redirects to /api/v1/stream for fast Range support.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const auth = await requireDeezerAndApp(request);
		if (auth.error) return auth.error;
		const { userId, dz, app } = auth;

		const { trackId } = await params;
		// Preview mode: hover-prefetch from the client. Streams audio bytes
		// to the browser without persisting to Blob / DB and without taking
		// the per-track download lock — so it never blocks a real play.
		const preview = request.nextUrl.searchParams.get("preview") === "1";
		// Head mode (only valid with preview=1): cap the response at ~64 KB
		// so a sliding-window prefetch over a search-results list doesn't
		// burn megabytes per track. ~64 KB is enough for an MP3 320 / FLAC
		// header + a couple of seconds of audio — the browser's audio element
		// gets to readyState >= 2 (canplay) and fires duration metadata.
		const head = preview && request.nextUrl.searchParams.get("head") === "1";
		const headBytes = head ? 64 * 1024 : 0;

		// Already cached → fast path through /stream. Verify the blob actually
		// exists first; stale rows (file deleted, migration) would otherwise
		// cause a redirect-then-404 loop and burn the audio element's retry budget.
		const stored = await prisma.storedTrack.findFirst({
			where: { trackId },
			orderBy: { bitrate: "desc" },
		});
		if (stored) {
			// Rows from before the move to Vercel Blob (storageType "s3" / "local")
			// point at storage this deployment can't reach — treat them as missing.
			let missing = stored.storageType !== BLOB_STORAGE_TYPE;
			let unreachable = false;
			if (!missing) {
				try {
					await headObject(stored.storagePath);
				} catch (e) {
					if (isStorageNotFound(e)) {
						missing = true;
					} else {
						// Network / permissions failure (Blob down). Don't redirect to
						// /stream — it would also fail. Fall through to the live Deezer
						// stream so playback still works while storage is unreachable.
						// Keep the row so the cached file is reused once Blob comes back.
						unreachable = true;
					}
				}
			}
			if (!missing && !unreachable) {
				return new Response(null, {
					status: 302,
					headers: { Location: `/api/v1/stream/${trackId}` },
				});
			}
			if (missing) {
				// File is genuinely gone — drop every stale row so we don't
				// keep redirecting to it on the next call.
				await prisma.storedTrack.deleteMany({ where: { trackId } });
			}
		}

		// Not cached — open a progressive stream
		const settings = await app.freshSettings();
		const preferredBitrate = settings.maxBitrate;

		// Dedup lock: only used for real (persisting) plays. Preview streams
		// run lock-free so a hover never delays a click that wants the same
		// track, and the persisting branch always wins the StoredTrack row.
		let lockRelease: (() => void) | undefined;
		if (!preview) {
			const lock = app.acquireDownloadLock(
				String(trackId),
				Number(preferredBitrate)
			);
			if (lock.alreadyInProgress) {
				await lock.waitForExisting();
				return new Response(null, {
					status: 302,
					headers: { Location: `/api/v1/stream/${trackId}` },
				});
			}
			lockRelease = lock.release;

			if (!app.storageProvider) {
				lock.release();
				return fail(
					"STORAGE_UNAVAILABLE",
					"Storage provider not initialized.",
					500
				);
			}
		}

		const { body, contentType, contentLength, persisted } = await startProgressiveStream({
			dz,
			trackId: String(trackId),
			bitrate: Number(preferredBitrate),
			settings,
			storageProvider: app.storageProvider,
			userId,
			lock: lockRelease ? { release: lockRelease } : undefined,
			persist: !preview,
			maxBytes: headBytes || undefined,
		}).catch((e) => {
			lockRelease?.();
			throw e;
		});

		// Keep the function alive until the file is tagged, uploaded and recorded.
		after(() => persisted);

		const headers: Record<string, string> = {
			"Content-Type": contentType,
			"Cache-Control": "no-store",
			"Accept-Ranges": "none",
		};
		if (contentLength > 0) {
			headers["Content-Length"] = String(contentLength);
		}

		return new Response(body, { status: 200, headers });
	} catch (e) {
		console.error("[stream-progressive] failed:", e);
		return handleError(e);
	}
}
