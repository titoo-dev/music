import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, fail, handleError } from "../../_lib/helpers";
import { streamObject } from "@/lib/s3-stream";

// GET /api/v1/stream/[trackId] — Stream a downloaded track from S3
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;

		const download = await prisma.downloadHistory.findUnique({
			where: { userId_trackId: { userId: userResult.userId, trackId } },
		});

		if (!download) {
			return fail("NOT_FOUND", "Track not found in your downloads.", 404);
		}

		if (!download.storagePath) {
			return fail("NO_FILE", "No file path recorded for this track.", 404);
		}

		if (download.storageType !== "s3") {
			return fail("UNSUPPORTED_STORAGE", "Only S3 storage is supported for streaming.", 400);
		}

		const rangeHeader = request.headers.get("range");

		// If no range requested, stream the whole file
		if (!rangeHeader) {
			const { body, contentLength, contentType } = await streamObject(download.storagePath);

			return new Response(body, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Content-Length": String(contentLength),
					"Accept-Ranges": "bytes",
					"Cache-Control": "private, max-age=86400",
				},
			});
		}

		// Range request for seeking
		const { body, contentLength, contentRange, contentType, statusCode } =
			await streamObject(download.storagePath, rangeHeader);

		const headers: Record<string, string> = {
			"Content-Type": contentType,
			"Content-Length": String(contentLength),
			"Accept-Ranges": "bytes",
			"Cache-Control": "private, max-age=86400",
		};

		if (contentRange) {
			headers["Content-Range"] = contentRange;
		}

		return new Response(body, {
			status: statusCode,
			headers,
		});
	} catch (e: any) {
		if (e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404) {
			return fail("FILE_NOT_FOUND", "Audio file not found in storage.", 404);
		}
		return handleError(e);
	}
}
