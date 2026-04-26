import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeezerAndApp, fail, handleError } from "../../_lib/helpers";
import { startProgressiveStream } from "@/lib/deemix/progressive-stream";

// GET /api/v1/stream-progressive/[trackId]
// Spotify-like playback: stream the track from Deezer in real time,
// decrypt on the fly, persist in parallel, and return bytes to the
// browser as soon as they arrive. Subsequent plays go to /api/v1/stream
// once the DownloadHistory row is populated.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const auth = await requireDeezerAndApp(request);
		if (auth.error) return auth.error;
		const { userId, dz, app } = auth;

		const { trackId } = await params;

		// 1. Already in user's history with a live file → fast path through /stream
		// (Evicted entries have storagePath=null and must re-stream below.)
		const owned = await prisma.downloadHistory.findUnique({
			where: { userId_trackId: { userId, trackId } },
			select: { id: true, storagePath: true, storedTrackId: true },
		});
		if (owned && owned.storagePath) {
			return NextResponse.redirect(
				new URL(`/api/v1/stream/${trackId}`, request.url),
				302
			);
		}

		// 2. Globally stored by another user → link to user's history and redirect
		const stored = await prisma.storedTrack.findFirst({
			where: { trackId },
			orderBy: { bitrate: "desc" },
		});
		if (stored) {
			let title = "";
			let artist = "";
			let cover: string | null = null;
			let album: string | null = null;
			try {
				const tr: any = await dz.api.getTrack(trackId);
				title = tr?.title || "";
				artist = tr?.artist?.name || "";
				cover = tr?.album?.cover_medium || null;
				album = tr?.album?.title || null;
			} catch {}

			await prisma.downloadHistory.upsert({
				where: { userId_trackId: { userId, trackId } },
				update: {},
				create: {
					userId,
					trackId,
					title,
					artist,
					album,
					coverUrl: cover,
					bitrate: stored.bitrate,
					storageType: stored.storageType,
					storagePath: stored.storagePath,
					storedTrackId: stored.id,
				},
			});

			return NextResponse.redirect(
				new URL(`/api/v1/stream/${trackId}`, request.url),
				302
			);
		}

		// 3. Not yet downloaded — open a progressive stream.
		const settings = app.settings;
		const preferredBitrate = settings.maxBitrate;

		// Dedup lock: if another request is already streaming the same track,
		// wait for it to finish (it will create the DB rows) and redirect.
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
			// Disable seeking on the progressive endpoint — once the file is
			// finalized, the next playback uses /api/v1/stream which supports
			// range requests for full seek support.
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
