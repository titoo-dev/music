import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail, handleError } from "../_lib/helpers";
import { evictTrackStorage } from "@/lib/track-eviction";

const RECENT_PLAYS_CAP = 100;

// GET /api/v1/recent-plays — list recent plays (most recent first)
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const url = new URL(request.url);
		const limit = Math.min(
			Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1),
			RECENT_PLAYS_CAP
		);

		const rows = await prisma.recentPlay.findMany({
			where: { userId: userResult.userId },
			orderBy: { playedAt: "desc" },
			take: limit,
		});

		return ok({ items: rows });
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/recent-plays — log a play (called by the client at 30s of
// continuous playback). Upserts on (userId, trackId) so replays just bump
// playedAt without duplicating rows. When the per-user cap is exceeded,
// evicts the oldest entries — releasing their S3 files but keeping nothing
// for them in RecentPlay (DownloadHistory metadata stays so the track can
// be re-streamed later).
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;
		const userId = userResult.userId;

		const body = await request.json().catch(() => null);
		if (!body || typeof body.trackId !== "string" || !body.trackId) {
			return fail("INVALID_BODY", "trackId is required.", 400);
		}

		const {
			trackId,
			title = "",
			artist = "",
			album = null,
			albumId = null,
			coverUrl = null,
			duration = null,
		} = body as {
			trackId: string;
			title?: string;
			artist?: string;
			album?: string | null;
			albumId?: string | null;
			coverUrl?: string | null;
			duration?: number | null;
		};

		await prisma.recentPlay.upsert({
			where: { userId_trackId: { userId, trackId } },
			update: { playedAt: new Date() },
			create: {
				userId,
				trackId,
				title,
				artist,
				album,
				albumId,
				coverUrl,
				duration: duration ?? null,
			},
		});

		// Cap the user's history at RECENT_PLAYS_CAP entries. Evict the oldest
		// ones beyond that; their storage gets freed but the DownloadHistory
		// metadata stays so the user can replay them (which will re-stream).
		const total = await prisma.recentPlay.count({ where: { userId } });
		if (total > RECENT_PLAYS_CAP) {
			const toEvict = await prisma.recentPlay.findMany({
				where: { userId },
				orderBy: { playedAt: "asc" },
				take: total - RECENT_PLAYS_CAP,
				select: { id: true, trackId: true },
			});

			await prisma.recentPlay.deleteMany({
				where: { id: { in: toEvict.map((r) => r.id) } },
			});

			// Free storage for evicted tracks — only when no other user has them
			// in their RecentPlay (otherwise we'd kill someone else's library).
			for (const row of toEvict) {
				const stillUsed = await prisma.recentPlay.findFirst({
					where: { trackId: row.trackId },
					select: { id: true },
				});
				if (!stillUsed) {
					await evictTrackStorage(row.trackId).catch((e) =>
						console.error("[recent-plays] eviction failed:", e)
					);
				}
			}
		}

		return ok({ logged: true });
	} catch (e) {
		return handleError(e);
	}
}
