import { NextRequest } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "../../../_lib/helpers";
import { streamObject } from "@/lib/s3-stream";

// GET /api/v1/shares/[shareId]/stream — Stream shared track audio (public, no auth)
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ shareId: string }> }
) {
	try {
		const { shareId } = await params;

		const shared = await prisma.sharedTrack.findUnique({
			where: { shareId },
			include: { storedTrack: true },
		});

		if (!shared) {
			return fail("NOT_FOUND", "Shared track not found.", 404);
		}

		if (shared.expiresAt && shared.expiresAt < new Date()) {
			return fail("EXPIRED", "This share link has expired.", 410);
		}

		const { storagePath, storageType } = shared.storedTrack;

		if (storageType !== "s3") {
			return fail("UNSUPPORTED_STORAGE", "Only S3 storage is supported for streaming.", 400);
		}

		// Increment play count after the response is sent
		after(() => {
			prisma.sharedTrack
				.update({ where: { shareId }, data: { plays: { increment: 1 } } })
				.catch(() => {});
		});

		const rangeHeader = request.headers.get("range");

		if (!rangeHeader) {
			const { body, contentLength, contentType } = await streamObject(storagePath);

			return new Response(body, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Content-Length": String(contentLength),
					"Accept-Ranges": "bytes",
					"Cache-Control": "public, max-age=3600",
				},
			});
		}

		const { body, contentLength, contentRange, contentType, statusCode } =
			await streamObject(storagePath, rangeHeader);

		const headers: Record<string, string> = {
			"Content-Type": contentType,
			"Content-Length": String(contentLength),
			"Accept-Ranges": "bytes",
			"Cache-Control": "public, max-age=3600",
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
		return fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
	}
}
