import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleError } from "../../_lib/helpers";
import { streamObject } from "@/lib/object-stream";
import {
	STORAGE_TYPE,
	isStorageNotFound,
	isStorageUnavailable,
} from "@/lib/wavelet/storage/objects";

// `live` tells /stream-progressive to skip its cache check: storage is refusing
// reads, and a HEAD there can still succeed (a suspended store answers HEAD
// but blocks GET), which would bounce the player straight back here.
function redirectToProgressive(trackId: string, { live = false } = {}) {
	return new Response(null, {
		status: 302,
		headers: { Location: `/api/v1/stream-progressive/${trackId}${live ? "?live=1" : ""}` },
	});
}

// GET /api/v1/stream/[trackId] — stream a track from the global file cache.
// Auth-gated but NOT user-scoped: any authenticated user can stream any
// cached track (since playback is allowed for any track via the progressive
// engine anyway, gating per-user makes no sense).
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	const { trackId } = await params;
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		// Pick the highest-quality cached version
		const stored = await prisma.storedTrack.findFirst({
			where: { trackId },
			orderBy: { bitrate: "desc" },
		});
		// Cache miss — bounce back to /stream-progressive so the live Deezer
		// fallback runs. Returning 404 here would kill the <audio> element with
		// no recovery path, even though the track is fully streamable live.
		if (!stored) return redirectToProgressive(trackId);

		// Rows written for older storage (Vercel Blob "blob", "s3", "local")
		// point at files this deployment can't read. Drop them so the live
		// stream re-caches the file in R2.
		if (stored.storageType !== STORAGE_TYPE) {
			await prisma.storedTrack.deleteMany({ where: { trackId } });
			return redirectToProgressive(trackId);
		}

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
			// Drop every row for this trackId so the redirect falls through to
			// a live Deezer stream in /stream-progressive.
			try {
				await prisma.storedTrack.deleteMany({ where: { trackId } });
			} catch {}
			return redirectToProgressive(trackId);
		}
		if (isStorageUnavailable(e)) {
			// Storage is unreachable or refusing, but the file might still exist.
			// Bounce to a live-only /stream-progressive so the user keeps playing.
			// Don't delete the row: it's still valid once storage is back.
			console.warn("[stream] storage unreachable — falling back to live stream:", e);
			return redirectToProgressive(trackId, { live: true });
		}
		return handleError(e);
	}
}
