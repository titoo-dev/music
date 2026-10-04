import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeezerAndApp, fail, ok, handleError } from "../../_lib/helpers";
import {
	startProgressiveStream,
	probeProgressiveStream,
	classifyStreamError,
} from "@/lib/wavelet/progressive-stream";
import { headObject } from "@/lib/object-stream";
import { isStorageNotFound } from "@/lib/wavelet/storage/objects";
import { capByLicence, findCachedCopy, loadStreamLicence } from "@/lib/wavelet/storage/cached-copy";
import { servePlay } from "../_lib/play";

// The persist pipeline (tag + R2 upload) runs in after() once the audio
// response ends; give it room on long FLAC tracks.
export const maxDuration = 300;

// GET /api/v1/stream-progressive/[trackId]
// Spotify-like progressive playback: streams live from Deezer, decrypts
// on the fly, persists to R2 in parallel. If the file is already cached
// (a usable StoredTrack copy exists), redirects to /api/v1/stream for fast
// Range support — unless `live=1`: /stream sends that when storage refuses
// reads or the cached copy needs an upgrade.
//
//  - Range (C2): "bytes=a-b" other than "bytes=0-" is served live-only (206,
//    never persisted, lock-free) when the Deezer CDN allows ranges; no Range
//    or "bytes=0-" is a normal persisting play with Content-Length (206 +
//    Content-Range for "bytes=0-").
//  - A play never waits for another in-flight persist of the same track (C4):
//    a follower on this instance reads the in-progress bytes; while another
//    instance holds the persist lease, the track streams live unpersisted.
//  - ?probe=1 (C3): { ok: true, cached } when the track is streamable for
//    this user; never opens the audio stream, never persists.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const auth = await requireDeezerAndApp(request);
		if (auth.error) return auth.error;
		const { userId, dz, app } = auth;

		const { trackId } = await params;
		const search = request.nextUrl.searchParams;
		// Preview mode: hover-prefetch from the client. Streams audio bytes
		// to the browser without persisting to storage / DB and without taking
		// the per-track download lock — so it never blocks a real play.
		const preview = search.get("preview") === "1";
		// Head mode (only valid with preview=1): cap the response at ~64 KB
		// so a sliding-window prefetch over a search-results list doesn't
		// burn megabytes per track. ~64 KB is enough for an MP3 320 / FLAC
		// header + a couple of seconds of audio — the browser's audio element
		// gets to readyState >= 2 (canplay) and fires duration metadata.
		const head = preview && search.get("head") === "1";
		const headBytes = head ? 64 * 1024 : 0;
		const live = search.get("live") === "1";
		const probe = search.get("probe") === "1";

		const settings = await app.freshSettings();
		const preferredBitrate = Number(settings.maxBitrate);
		const licence = await loadStreamLicence(userId);

		// Already cached → fast path through /stream. The copy is chosen by the
		// shared rank rules (storage/cached-copy.ts); a copy below this user's
		// quality is re-persisted by this play ("upgrade"). Verify the object
		// actually exists first; stale rows (file deleted, migration) would
		// otherwise cause a redirect-then-404 loop and burn the audio element's
		// retry budget.
		if (!live) {
			const copy = await findCachedCopy(trackId, { maxBitrate: preferredBitrate, licence });
			// Rows written for older storage (Vercel Blob "blob", "s3", "local")
			// point at files this deployment can't read — drop them.
			if (copy.stale.length > 0) {
				await prisma.storedTrack.deleteMany({ where: { id: { in: copy.stale.map((r) => r.id) } } });
			}
			if (copy.kind === "hit") {
				if (probe) return ok({ ok: true, cached: true });
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

		if (probe) {
			try {
				await probeProgressiveStream(dz, trackId, preferredBitrate, settings);
			} catch (e) {
				const c = classifyStreamError(e) ?? {
					status: 502,
					code: "UPSTREAM_ERROR",
					message: "Deezer did not answer the probe. Try again.",
				};
				console.warn("[stream-progressive] probe failed:", e);
				return fail(c.code, c.message, c.status);
			}
			return ok({ ok: true, cached: false });
		}

		if (preview) {
			// Live-only, lock-free; headers unchanged (no Content-Length, no ranges).
			const { body, contentType } = await startProgressiveStream({
				dz,
				trackId: String(trackId),
				bitrate: preferredBitrate,
				settings,
				storageProvider: app.storageProvider,
				userId,
				persist: false,
				maxBytes: headBytes || undefined,
				signal: request.signal,
			});
			return new Response(body, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Cache-Control": "no-store",
					"Accept-Ranges": "none",
				},
			});
		}

		return await servePlay({
			request,
			dz,
			app,
			trackId: String(trackId),
			userId,
			settings,
			bitrate: preferredBitrate,
			requestedBitrate: capByLicence(preferredBitrate, licence),
			cacheControl: "no-store",
		});
	} catch (e) {
		console.error("[stream-progressive] failed:", e);
		const c = classifyStreamError(e);
		return c ? fail(c.code, c.message, c.status) : handleError(e);
	}
}
