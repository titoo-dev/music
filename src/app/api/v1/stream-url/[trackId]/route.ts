import { NextRequest } from "next/server";
import { requireUser, ok, handleError } from "../../_lib/helpers";
import { getPresignedUrl } from "@/lib/object-stream";
import { isStorageNotFound } from "@/lib/wavelet/storage/objects";
import { findCachedCopy, resolveCacheQuery } from "@/lib/wavelet/storage/cached-copy";

/**
 * Lifetime of the presigned URL (C1). One hour covers a long FLAC with
 * pauses; the response's expiresAt lets the client refresh before it lapses.
 */
const PRESIGN_TTL_SECONDS = 3600;

// GET /api/v1/stream-url/[trackId] — return a presigned R2 URL for direct
// browser playback. Returns { url: null } when the track isn't cached so
// the client can fall through to /api/v1/stream-progressive without a 404
// in the Network tab. The copy is chosen by the shared rank rules
// (storage/cached-copy.ts) for this user's licence; a copy below what the
// user may get counts as not cached, so the progressive play upgrades it.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;

		// Escape hatch: WAVELET_DISABLE_PRESIGNED_URLS=1 forces every client to
		// stream through the same-origin proxy at /api/v1/stream/[trackId]
		// (e.g. if R2 ever rejects the player's CORS requests).
		if (process.env.WAVELET_DISABLE_PRESIGNED_URLS === "1") {
			return ok({ url: null, status: "presigned_disabled" });
		}

		const copy = await findCachedCopy(trackId, await resolveCacheQuery(userResult.userId));
		if (copy.kind !== "hit") {
			const legacyOnly = copy.kind === "miss" && copy.stale.length > 0;
			return ok({ url: null, status: legacyOnly ? "unsupported_storage" : "not_cached" });
		}

		// Taken before signing: the signature's own clock is a few ms later, so
		// the URL never expires before the reported time.
		const expiresAt = new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000).toISOString();
		const { url, contentType } = await getPresignedUrl(copy.row.storagePath, PRESIGN_TTL_SECONDS);
		return ok({ url, contentType, expiresAt });
	} catch (e: unknown) {
		if (isStorageNotFound(e)) {
			return ok({ url: null, status: "file_missing" });
		}
		return handleError(e);
	}
}
