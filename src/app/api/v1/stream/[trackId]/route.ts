import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleError, fail } from "../../_lib/helpers";
import { streamObject } from "@/lib/object-stream";
import {
	isStorageNotFound,
	isStorageUnavailable,
} from "@/lib/wavelet/storage/objects";
import { findCachedCopy, resolveCacheQuery } from "@/lib/wavelet/storage/cached-copy";

// `live` tells /stream-progressive to skip its cache check: storage is refusing
// reads, and a HEAD there can still succeed (a suspended store answers HEAD
// but blocks GET), which would bounce the player straight back here. Also
// used for an upgrade: the cached copy is below this listener's quality, and
// an instance with an older quality setting must not send the player back.
function redirectToProgressive(trackId: string, { live = false } = {}) {
	return new Response(null, {
		status: 302,
		headers: { Location: `/api/v1/stream-progressive/${trackId}${live ? "?live=1" : ""}` },
	});
}

// ?prefetch=1 (C5): the caller only wants bytes that are already cached — a
// miss is a 404 NOT_CACHED, never a redirect to a live Deezer stream.
function notCached() {
	return fail("NOT_CACHED", "This track is not cached yet.", 404);
}

// GET /api/v1/stream/[trackId] — stream a track from the global file cache.
// Auth-gated but NOT user-scoped: any authenticated user can stream any
// cached track (since playback is allowed for any track via the progressive
// engine anyway, gating per-user makes no sense). The copy is chosen by the
// shared rank rules (storage/cached-copy.ts) for this user's licence.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	const { trackId } = await params;
	const prefetch = request.nextUrl.searchParams.get("prefetch") === "1";
	let storagePath: string | null = null;
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const copy = await findCachedCopy(trackId, await resolveCacheQuery(userResult.userId));

		// Rows written for older storage (Vercel Blob "blob", "s3", "local")
		// point at files this deployment can't read. Drop them so the live
		// stream re-caches the file in R2.
		if (copy.stale.length > 0) {
			await prisma.storedTrack.deleteMany({ where: { id: { in: copy.stale.map((r) => r.id) } } });
		}
		if (copy.kind !== "hit") {
			if (prefetch) return notCached();
			// Cache miss — bounce back to /stream-progressive so the live Deezer
			// fallback runs. Returning 404 here would kill the <audio> element with
			// no recovery path, even though the track is fully streamable live.
			// An upgrade (a copy exists, the listener may get better) re-persists
			// through a live=1 play.
			return redirectToProgressive(trackId, { live: copy.kind === "upgrade" });
		}
		const stored = copy.row;
		storagePath = stored.storagePath;

		const rangeHeader = request.headers.get("range") ?? undefined;
		const { body, contentLength, contentRange, contentType, statusCode } =
			await streamObject(stored.storagePath, rangeHeader);

		const headers: Record<string, string> = {
			"Content-Type": contentType,
			"Content-Length": String(contentLength),
			"Accept-Ranges": "bytes",
			"Cache-Control": "private, max-age=86400",
		};
		if (contentRange) headers["Content-Range"] = contentRange;

		return new Response(body, { status: statusCode, headers });
	} catch (e) {
		if (isStorageNotFound(e)) {
			// Stale StoredTrack: DB row points to an object that no longer exists.
			// Drop every row pointing at it so the redirect falls through to
			// a live Deezer stream in /stream-progressive.
			if (storagePath) {
				try {
					await prisma.storedTrack.deleteMany({ where: { storagePath } });
				} catch {}
			}
			if (prefetch) return notCached();
			return redirectToProgressive(trackId);
		}
		if (isStorageUnavailable(e)) {
			if (prefetch) return notCached();
			// Storage is unreachable or refusing, but the file might still exist.
			// Bounce to a live-only /stream-progressive so the user keeps playing.
			// Don't delete the row: it's still valid once storage is back.
			console.warn("[stream] storage unreachable — falling back to live stream:", e);
			return redirectToProgressive(trackId, { live: true });
		}
		return handleError(e);
	}
}
