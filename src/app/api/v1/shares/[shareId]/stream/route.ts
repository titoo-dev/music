import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "../../../_lib/helpers";
import { streamObject } from "@/lib/s3-stream";
import { resolveShareForPlayback } from "@/lib/library";
import { startProgressiveStream } from "@/lib/deemix/progressive-stream";
import { getDeemixApp, getOrLoginUserDz } from "@/lib/server-state";

// GET /api/v1/shares/[shareId]/stream
// Public, no auth. Resolves the share, then either:
//   1. Streams the cached S3 file (fast path), OR
//   2. Re-streams via the progressive engine using the share creator's
//      stored Deezer credentials (fallback when the file was evicted)
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ shareId: string }> }
) {
	try {
		const { shareId } = await params;

		const resolved = await resolveShareForPlayback(shareId);
		if (!resolved) return fail("NOT_FOUND", "Shared track not found.", 404);
		if (resolved.expired) return fail("EXPIRED", "This share link has expired.", 410);

		const { share } = resolved;

		// Increment play count after the response is sent
		after(() => {
			prisma.sharedTrack
				.update({ where: { shareId }, data: { plays: { increment: 1 } } })
				.catch(() => {});
		});

		// Fast path: file already cached in S3
		if (share.storedTrack && share.storedTrack.storageType === "s3") {
			try {
				return await streamFromS3(request, share.storedTrack.storagePath);
			} catch (e: any) {
				// Fall through to progressive on 404 (file evicted between
				// the DB lookup and the actual S3 fetch)
				if (e?.name !== "NotFound" && e?.$metadata?.httpStatusCode !== 404) {
					console.error("[shares/stream] S3 error, falling back:", e);
				}
				// Detach the stale storedTrackId — next visit goes straight to progressive
				await prisma.sharedTrack
					.update({ where: { id: share.id }, data: { storedTrackId: null } })
					.catch(() => {});
			}
		}

		// Fallback: re-stream via progressive using the share creator's ARL
		return await streamProgressive(share);
	} catch (e) {
		return fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
	}
}

async function streamFromS3(request: NextRequest, storagePath: string) {
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
	if (contentRange) headers["Content-Range"] = contentRange;

	return new Response(body, { status: statusCode, headers });
}

async function streamProgressive(share: { trackId: string; userId: string }) {
	const dz = await getOrLoginUserDz(share.userId);
	if (!dz) {
		return fail(
			"SHARE_OWNER_OFFLINE",
			"The share owner is no longer connected to Deezer.",
			410
		);
	}

	const app = await getDeemixApp();
	if (!app?.storageProvider) {
		return fail("STORAGE_UNAVAILABLE", "Storage provider not initialized.", 500);
	}

	const settings = app.settings;
	const preferredBitrate = settings.maxBitrate;

	const { body, contentType, contentLength } = await startProgressiveStream({
		dz,
		trackId: share.trackId,
		bitrate: Number(preferredBitrate),
		settings,
		storageProvider: app.storageProvider,
		userId: share.userId,
	});

	const headers: Record<string, string> = {
		"Content-Type": contentType,
		"Cache-Control": "public, max-age=3600",
		"Accept-Ranges": "none",
	};
	if (contentLength > 0) headers["Content-Length"] = String(contentLength);

	return new Response(body, { status: 200, headers });
}
