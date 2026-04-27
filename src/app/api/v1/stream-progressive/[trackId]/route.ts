import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeezerAndApp, fail, handleError } from "../../_lib/helpers";
import { startProgressiveStream } from "@/lib/deemix/progressive-stream";

// GET /api/v1/stream-progressive/[trackId]
// Spotify-like progressive playback: streams live from Deezer, decrypts
// on the fly, persists to S3 in parallel. If the file is already cached
// (StoredTrack exists), redirects to /api/v1/stream for fast Range support.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const auth = await requireDeezerAndApp(request);
		if (auth.error) return auth.error;
		const { userId, dz, app } = auth;

		const { trackId } = await params;

		// Already cached → fast path through /stream
		const stored = await prisma.storedTrack.findFirst({
			where: { trackId },
			select: { id: true },
			orderBy: { bitrate: "desc" },
		});
		if (stored) {
			return NextResponse.redirect(
				new URL(`/api/v1/stream/${trackId}`, request.url),
				302
			);
		}

		// Not cached — open a progressive stream
		const settings = app.settings;
		const preferredBitrate = settings.maxBitrate;

		// Dedup lock: if another request is already streaming the same track,
		// wait for it to finish (it will create the StoredTrack) and redirect.
		const lock = app.acquireDownloadLock(
			String(trackId),
			Number(preferredBitrate)
		);
		if (lock.alreadyInProgress) {
			await lock.waitForExisting();
			return NextResponse.redirect(
				new URL(`/api/v1/stream/${trackId}`, request.url),
				302
			);
		}

		if (!app.storageProvider) {
			lock.release();
			return fail("STORAGE_UNAVAILABLE", "Storage provider not initialized.", 500);
		}

		const { body, contentType, contentLength } = await startProgressiveStream({
			dz,
			trackId: String(trackId),
			bitrate: Number(preferredBitrate),
			settings,
			storageProvider: app.storageProvider,
			userId,
			lock: { release: lock.release },
		}).catch((e) => {
			lock.release();
			throw e;
		});

		const headers: Record<string, string> = {
			"Content-Type": contentType,
			"Cache-Control": "no-store",
			"Accept-Ranges": "none",
		};
		if (contentLength > 0) {
			headers["Content-Length"] = String(contentLength);
		}

		return new Response(body, { status: 200, headers });
	} catch (e) {
		return handleError(e);
	}
}
