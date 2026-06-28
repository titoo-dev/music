import { NextRequest } from "next/server";
import { requireUser, ok, handleError } from "../../../../_lib/helpers";
import { getPresignedUrl } from "@/lib/s3-stream";
import { getStemFile } from "@/lib/repositories/stems";

// GET /api/v1/stems/[trackId]/[stemName]/url — return a presigned S3 URL for
// direct browser playback of a single stem. Mirrors /api/v1/stream-url:
// returns { url: null, status: ... } on cache miss / unsupported storage so
// the client can fall back to the proxy stream without a 404 in the Network
// tab.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string; stemName: string }> },
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId, stemName } = await params;

		const stored = await getStemFile(trackId, stemName);

		if (!stored) {
			return ok({ url: null, status: "not_cached" });
		}

		if (stored.storageType !== "s3") {
			return ok({ url: null, status: "unsupported_storage" });
		}

		// DB lookup happens before this check so the client can distinguish
		// "no stem yet" (status=not_cached → fall through to original audio)
		// from "stem exists, just no direct URL" (status=presigned_disabled →
		// use the /stream proxy instead).
		if (process.env.DEEMIX_DISABLE_PRESIGNED_URLS === "1") {
			return ok({ url: null, status: "presigned_disabled" });
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
