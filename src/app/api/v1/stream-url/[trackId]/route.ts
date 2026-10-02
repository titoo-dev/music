import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, handleError } from "../../_lib/helpers";
import { getPresignedUrl } from "@/lib/blob-stream";
import { BLOB_STORAGE_TYPE, isStorageNotFound } from "@/lib/wavelet/storage/blob";

// GET /api/v1/stream-url/[trackId] — return a presigned Blob URL for direct
// browser playback. Returns { url: null } when the track isn't cached so
// the client can fall through to /api/v1/stream-progressive without a 404
// in the Network tab.
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
		// (e.g. if the Blob CDN ever rejects the player's CORS requests).
		if (process.env.WAVELET_DISABLE_PRESIGNED_URLS === "1") {
			return ok({ url: null, status: "presigned_disabled" });
		}

		const stored = await prisma.storedTrack.findFirst({
			where: { trackId },
			orderBy: { bitrate: "desc" },
		});

		if (!stored) {
			return ok({ url: null, status: "not_cached" });
		}

		if (stored.storageType !== BLOB_STORAGE_TYPE) {
			return ok({ url: null, status: "unsupported_storage" });
		}

		const { url, contentType } = await getPresignedUrl(stored.storagePath, 900);
		return ok({ url, contentType });
	} catch (e: unknown) {
		if (isStorageNotFound(e)) {
			return ok({ url: null, status: "file_missing" });
		}
		return handleError(e);
	}
}
