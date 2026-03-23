import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail, handleError } from "../../_lib/helpers";
import { getPresignedUrl } from "@/lib/s3-stream";

// GET /api/v1/stream-url/[trackId] — Return a presigned S3 URL for direct browser streaming
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
			include: { storedTrack: { select: { storagePath: true, storageType: true } } },
		});

		// Resolve storage path: prefer StoredTrack (global dedup), fallback to direct storagePath
		const storagePath = download?.storedTrack?.storagePath ?? download?.storagePath;
		const storageType = download?.storedTrack?.storageType ?? download?.storageType;

		if (!storagePath) {
			return fail("NOT_FOUND", "Track not found in your downloads.", 404);
		}

		if (storageType !== "s3") {
			return fail("UNSUPPORTED_STORAGE", "Only S3 storage is supported.", 400);
		}

		const { url, contentType } = await getPresignedUrl(storagePath, 900);

		return ok({ url, contentType });
	} catch (e: unknown) {
		const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
		if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) {
			return fail("FILE_NOT_FOUND", "Audio file not found in storage.", 404);
		}
		return handleError(e);
	}
}
