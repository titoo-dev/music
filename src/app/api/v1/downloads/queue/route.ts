import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireApp, requireDeezerAndApp } from "../../_lib/helpers";

// GET /api/v1/downloads/queue — Fetch current download queue
export async function GET() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		return ok(app.getQueue());
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/downloads/queue — Add URL(s) to download queue
export async function POST(request: NextRequest) {
	try {
		const { userId, dz, app, error } = await requireDeezerAndApp(request);
		if (error) return error;

		const { url, bitrate } = await request.json();

		if (!url) {
			return fail("MISSING_URL", "A URL or array of URLs is required.", 400);
		}

		const urls = Array.isArray(url) ? url : [url];
		const effectiveBitrate = bitrate ?? app.settings.maxBitrate;
		const storageType = app.settings.storageType || "local";

		// For single track URLs, check per-user dedup and global StoredTrack dedup
		for (const u of urls) {
			const trackMatch = String(u).match(/deezer\.com\/(?:\w+\/)?track\/(\d+)/);
			if (!trackMatch) continue;

			const trackId = trackMatch[1];

			// 1. Per-user dedup: already downloaded by this user?
			const existing = await prisma.downloadHistory.findUnique({
				where: { userId_trackId: { userId, trackId } },
			});
			if (existing) {
				return fail(
					"ALREADY_DOWNLOADED",
					`Track "${existing.title}" by ${existing.artist} was already downloaded on ${existing.downloadedAt.toLocaleDateString()}.`,
					409
				);
			}

			// 2. Global dedup: file already exists in storage from another user's download?
			const storedTrack = await app.findStoredTrack(trackId, effectiveBitrate);
			if (storedTrack) {
				// File already in S3/local — just create the DownloadHistory entry for this user
				// and wait for any in-progress download to finish first
				const lock = app.acquireDownloadLock(trackId, effectiveBitrate);
				if (lock.alreadyInProgress) {
					await lock.waitForExisting();
					// Re-check stored track after waiting (it should still exist)
					const freshStored = await app.findStoredTrack(trackId, effectiveBitrate);
					if (freshStored) {
						await _linkExistingTrack(userId, trackId, effectiveBitrate, freshStored, storageType);
						return ok([{ title: trackId, status: "linked", reused: true }]);
					}
				} else {
					// Not in progress, just link it — release the lock we accidentally acquired
					lock.release();
					await _linkExistingTrack(userId, trackId, effectiveBitrate, storedTrack, storageType);
					return ok([{ title: trackId, status: "linked", reused: true }]);
				}
			}

			// 3. Check if another user is currently downloading this exact track
			const lock = app.acquireDownloadLock(trackId, effectiveBitrate);
			if (lock.alreadyInProgress) {
				// Wait for the in-progress download to finish, then link
				await lock.waitForExisting();
				const freshStored = await app.findStoredTrack(trackId, effectiveBitrate);
				if (freshStored) {
					await _linkExistingTrack(userId, trackId, effectiveBitrate, freshStored, storageType);
					return ok([{ title: trackId, status: "linked", reused: true }]);
				}
				// If stored track not found after waiting, fall through to normal download
			} else {
				// We acquired the lock — release it here; startQueue will re-acquire it
				lock.release();
			}
		}

		const result = await app.addToQueue(dz, urls, effectiveBitrate, false, userId);
		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}

/** Link an existing StoredTrack to a new user's DownloadHistory without re-downloading */
async function _linkExistingTrack(
	userId: string,
	trackId: string,
	bitrate: number,
	storedTrack: { id: string; storagePath: string; storageType: string },
	_storageType: string
) {
	// Fetch metadata from any existing DownloadHistory for this track
	const existingHistory = await prisma.downloadHistory.findFirst({
		where: { trackId },
		select: { title: true, artist: true, album: true, albumId: true, coverUrl: true },
	});

	// Use StoredTrack's storageType (the actual location), not the app's current setting
	await prisma.downloadHistory.upsert({
		where: { userId_trackId: { userId, trackId } },
		update: {
			downloadedAt: new Date(),
			storagePath: storedTrack.storagePath,
			storageType: storedTrack.storageType,
			storedTrackId: storedTrack.id,
		},
		create: {
			userId,
			trackId,
			title: existingHistory?.title || "",
			artist: existingHistory?.artist || "",
			album: existingHistory?.album,
			albumId: existingHistory?.albumId,
			coverUrl: existingHistory?.coverUrl,
			bitrate,
			storageType: storedTrack.storageType,
			storagePath: storedTrack.storagePath,
			storedTrackId: storedTrack.id,
		},
	});
}
