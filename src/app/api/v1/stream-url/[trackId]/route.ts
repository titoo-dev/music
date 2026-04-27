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

		// Some deployments expose an S3 endpoint that the browser can't reach
		// directly (self-signed cert, HTTP-only, internal-only DNS). Setting
		// DEEMIX_DISABLE_PRESIGNED_URLS=1 forces every client to stream through
		// the backend proxy at /api/v1/stream/[trackId], which in turn talks
		// server-to-server to S3 and never exposes the raw endpoint.
		if (process.env.DEEMIX_DISABLE_PRESIGNED_URLS === "1") {
			return ok({ url: null, status: "presigned_disabled" });
		}

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
