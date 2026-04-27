import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, handleError } from "../../_lib/helpers";
import { getPresignedUrl } from "@/lib/s3-stream";

// GET /api/v1/stream-url/[trackId] — return a presigned S3 URL for direct
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

		const stored = await prisma.storedTrack.findFirst({
			where: { trackId },
			orderBy: { bitrate: "desc" },
		});

		if (!stored) {
			return ok({ url: null, status: "not_cached" });
		}

		if (stored.storageType !== "s3") {
			return ok({ url: null, status: "unsupported_storage" });
		}

		const { url, contentType } = await getPresignedUrl(stored.storagePath, 900);
		return ok({ url, contentType });
	} catch (e: unknown) {
		const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
		if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) {
			return ok({ url: null, status: "file_missing" });
		}
		return handleError(e);
	}
}
