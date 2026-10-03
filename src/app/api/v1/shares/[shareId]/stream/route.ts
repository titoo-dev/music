import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "../../../_lib/helpers";
import { streamObject } from "@/lib/blob-stream";
import { BLOB_STORAGE_TYPE, isStorageNotFound } from "@/lib/wavelet/storage/blob";
import { resolveShareForPlayback } from "@/lib/library";
import { startProgressiveStream } from "@/lib/wavelet/progressive-stream";
import { getWaveletApp, getOrLoginUserDz } from "@/lib/server-state";

// The progressive fallback persists the file in after(); see stream-progressive.
export const maxDuration = 300;

// GET /api/v1/shares/[shareId]/stream
// Public, no auth. Resolves the share, then either:
//   1. Streams the cached Blob file (fast path), OR
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

		// Fast path: file already cached in Blob
		if (share.storedTrack && share.storedTrack.storageType === BLOB_STORAGE_TYPE) {
			try {
				return await streamFromBlob(request, share.storedTrack.storagePath);
			} catch (e) {
				// Fall through to progressive on 404 (file evicted between
				// the DB lookup and the actual Blob fetch)
				if (!isStorageNotFound(e)) {
					console.error("[shares/stream] Blob error, falling back:", e);
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

async function streamFromBlob(request: NextRequest, storagePath: string) {
	const rangeHeader = request.headers.get("range") ?? undefined;
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

	const app = await getWaveletApp();
	if (!app?.storageProvider) {
		return fail("STORAGE_UNAVAILABLE", "Storage provider not initialized.", 500);
	}

	const settings = await app.freshSettings();
	const preferredBitrate = settings.maxBitrate;

	const { body, contentType, contentLength, persisted } = await startProgressiveStream({
		dz,
		trackId: share.trackId,
		bitrate: Number(preferredBitrate),
		settings,
		storageProvider: app.storageProvider,
		userId: share.userId,
	});
	after(() => persisted);

	const headers: Record<string, string> = {
		"Content-Type": contentType,
		"Cache-Control": "public, max-age=3600",
		"Accept-Ranges": "none",
	};
	if (contentLength > 0) headers["Content-Length"] = String(contentLength);

	return new Response(body, { status: 200, headers });
}
