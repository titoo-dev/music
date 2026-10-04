import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeezerAndApp, fail, handleError } from "../../_lib/helpers";
import { startProgressiveStream } from "@/lib/wavelet/progressive-stream";
import { headObject } from "@/lib/object-stream";
import { isStorageNotFound } from "@/lib/wavelet/storage/objects";
import { findCachedCopy, loadStreamLicence } from "@/lib/wavelet/storage/cached-copy";

// The persist pipeline (tag + R2 upload) runs in after() once the audio
// response ends; give it room on long FLAC tracks.
export const maxDuration = 300;

// GET /api/v1/stream-progressive/[trackId]
// Spotify-like progressive playback: streams live from Deezer, decrypts
// on the fly, persists to R2 in parallel. If the file is already cached
// (StoredTrack exists), redirects to /api/v1/stream for fast Range support —
// unless `live=1`: /stream sends that when storage refuses reads.
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
		// to the browser without persisting to storage / DB and without taking
		// the per-track download lock — so it never blocks a real play.
		const preview = request.nextUrl.searchParams.get("preview") === "1";
		// Head mode (only valid with preview=1): cap the response at ~64 KB
		// so a sliding-window prefetch over a search-results list doesn't
		// burn megabytes per track. ~64 KB is enough for an MP3 320 / FLAC
		// header + a couple of seconds of audio — the browser's audio element
		// gets to readyState >= 2 (canplay) and fires duration metadata.
		const head = preview && request.nextUrl.searchParams.get("head") === "1";
		const headBytes = head ? 64 * 1024 : 0;
		const live = request.nextUrl.searchParams.get("live") === "1";

		const settings = await app.freshSettings();
		const preferredBitrate = settings.maxBitrate;

		// Already cached → fast path through /stream. The copy is chosen by the
		// shared rank rules (storage/cached-copy.ts); a copy below this user's
		// quality is re-persisted by this play ("upgrade"). Verify the object
		// actually exists first; stale rows (file deleted, migration) would
		// otherwise cause a redirect-then-404 loop and burn the audio element's
		// retry budget.
		if (!live) {
			const copy = await findCachedCopy(trackId, {
				maxBitrate: Number(preferredBitrate),
				licence: await loadStreamLicence(userId),
			});
			// Rows written for older storage (Vercel Blob "blob", "s3", "local")
			// point at files this deployment can't read — drop them.
			if (copy.stale.length > 0) {
				await prisma.storedTrack.deleteMany({ where: { id: { in: copy.stale.map((r) => r.id) } } });
			}
			if (copy.kind === "hit") {
				let missing = false;
				let unreachable = false;
				try {
					await headObject(copy.row.storagePath);
				} catch (e) {
					if (isStorageNotFound(e)) {
						missing = true;
					} else {
						// Network / permissions failure (storage down). Don't redirect to
						// /stream — it would also fail. Fall through to the live Deezer
						// stream so playback still works while storage is unreachable.
						// Keep the row so the cached file is reused once storage is back.
						unreachable = true;
					}
				}
				if (!missing && !unreachable) {
					return new Response(null, {
						status: 302,
						headers: { Location: `/api/v1/stream/${trackId}` },
					});
				}
				if (missing) {
					// File is genuinely gone — drop every row pointing at it so we
					// don't keep redirecting to it on the next call.
					await prisma.storedTrack.deleteMany({ where: { storagePath: copy.row.storagePath } });
				}
			}
		}

		// Not cached (or below this user's quality) — open a progressive stream

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
