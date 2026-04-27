import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, fail, handleError } from "../../_lib/helpers";
import { streamObject } from "@/lib/s3-stream";

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
		if (!stored) {
			return fail("NOT_CACHED", "Track is not in the file cache.", 404);
		}

		if (stored.storageType !== "s3") {
			return fail("UNSUPPORTED_STORAGE", "Only S3 storage is supported for streaming.", 400);
		}

		const rangeHeader = request.headers.get("range");

		if (!rangeHeader) {
			const { body, contentLength, contentType } = await streamObject(stored.storagePath);
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
			// Stale StoredTrack: DB row points to a file that no longer exists
			// in S3 (manual cleanup, lifecycle policy, migration). Drop every
			// row for this trackId so the next call to /stream-progressive
			// re-fetches from Deezer instead of redirecting back here.
			try {
				await prisma.storedTrack.deleteMany({ where: { trackId } });
			} catch {}
			return fail("FILE_NOT_FOUND", "Audio file not found in storage.", 404);
		}
		return handleError(e);
	}
}
