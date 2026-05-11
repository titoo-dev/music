import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, fail, handleError } from "../../../../_lib/helpers";
import { streamObject } from "@/lib/s3-stream";

// GET /api/v1/stems/[trackId]/[stemName]/stream — stream a stem file from S3
// through the backend (range-request aware). Used as the fallback when the
// presigned URL path is disabled or the browser can't reach S3 directly.
//
// 404 is correct here (unlike /stream which redirects to /stream-progressive
// for cache misses) because there's no live-fallback equivalent for stems —
// if the file isn't there, the client must hit POST /stems/[trackId] to
// request separation.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string; stemName: string }> },
) {
	const { trackId, stemName } = await params;
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const stored = await prisma.stemFile.findUnique({
			where: { trackId_stemName: { trackId, stemName } },
		});

		if (!stored) {
			return fail("STEM_NOT_FOUND", "Stem not available — request separation first.", 404);
		}

		if (stored.storageType !== "s3") {
			return fail("UNSUPPORTED_STORAGE", "Only S3 storage is supported for streaming.", 400);
		}

		const rangeHeader = request.headers.get("range");

		if (!rangeHeader) {
			const { body, contentLength, contentType } = await streamObject(
				stored.storagePath,
			);
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
	} catch (e: any) {
		if (e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404) {
			// Stale StemFile row — file gone from S3 (manual cleanup, lifecycle).
			// Drop the row so a future POST re-runs the separation.
			try {
				await prisma.stemFile.deleteMany({
					where: { trackId, stemName },
				});
			} catch {}
			return fail("STEM_FILE_GONE", "Stem file was removed from storage.", 404);
		}
		return handleError(e);
	}
}
