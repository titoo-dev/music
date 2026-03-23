import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail, handleError } from "../_lib/helpers";

// POST /api/v1/shares — Create a share link for a track
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const body = await request.json();
		const { trackId, duration, expiresIn } = body as {
			trackId?: string;
			duration?: number;
			expiresIn?: number | null; // hours, null = never
		};

		if (!trackId) {
			return fail("MISSING_TRACK_ID", "trackId is required.", 400);
		}

		// Verify the user has downloaded this track
		const download = await prisma.downloadHistory.findUnique({
			where: { userId_trackId: { userId: userResult.userId, trackId } },
			include: { storedTrack: true },
		});

		if (!download) {
			return fail("NOT_DOWNLOADED", "You need to download this track before sharing.", 404);
		}

		// Resolve or create StoredTrack
		let storedTrackId = download.storedTrackId;

		if (!storedTrackId) {
			// Legacy download without StoredTrack — backfill from storagePath
			const storagePath = download.storagePath;
			if (!storagePath) {
				return fail("NO_FILE", "No file path recorded for this track.", 404);
			}

			// Check if a StoredTrack already exists for this trackId+bitrate
			const existing = await prisma.storedTrack.findUnique({
				where: { trackId_bitrate: { trackId, bitrate: download.bitrate } },
			});

			if (existing) {
				storedTrackId = existing.id;
			} else {
				const created = await prisma.storedTrack.create({
					data: {
						trackId,
						bitrate: download.bitrate,
						storagePath,
						storageType: download.storageType,
						fileSize: download.fileSize,
					},
				});
				storedTrackId = created.id;
			}

			// Link the DownloadHistory to the StoredTrack
			await prisma.downloadHistory.update({
				where: { id: download.id },
				data: { storedTrackId },
			});
		}

		// Check if user already shared this track — return existing link
		const existingShare = await prisma.sharedTrack.findFirst({
			where: { userId: userResult.userId, trackId, storedTrackId },
		});

		if (existingShare) {
			return ok(existingShare);
		}

		const expiresAt = expiresIn
			? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
			: null;

		const shared = await prisma.sharedTrack.create({
			data: {
				shareId: nanoid(12),
				trackId,
				userId: userResult.userId,
				title: download.title,
				artist: download.artist,
				album: download.album,
				coverUrl: download.coverUrl,
				duration: duration ?? null,
				storedTrackId,
				expiresAt,
			},
		});

		return ok(shared, 201);
	} catch (e: unknown) {
		return handleError(e);
	}
}

// GET /api/v1/shares — List user's shared links
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const shares = await prisma.sharedTrack.findMany({
			where: { userId: userResult.userId },
			orderBy: { createdAt: "desc" },
		});

		return ok(shares);
	} catch (e: unknown) {
		return handleError(e);
	}
}
