import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, handleError } from "../../../_lib/helpers";
import { evictTrackStorage } from "@/lib/track-eviction";

// POST /api/v1/recent-plays/[trackId]/skip
// Called by the client when a track is skipped before reaching the 30s play
// threshold. If this user has never logged a real play for this track (no
// RecentPlay row), the track was just a one-off sample → free its S3 file
// to avoid clutter. Metadata in DownloadHistory stays so a replay can
// re-stream and re-cache.
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;
		const userId = userResult.userId;

		const { trackId } = await params;

		// Did this user ever count a real play for this track?
		const previously = await prisma.recentPlay.findUnique({
			where: { userId_trackId: { userId, trackId } },
			select: { id: true },
		});
		if (previously) {
			// Already counted — keep the file
			return ok({ kept: true, reason: "already_played" });
		}

		// Don't evict if any other user has actually listened to it
		const usedElsewhere = await prisma.recentPlay.findFirst({
			where: { trackId },
			select: { id: true },
		});
		if (usedElsewhere) {
			return ok({ kept: true, reason: "shared" });
		}

		const removed = await evictTrackStorage(trackId);
		return ok({ evicted: true, files: removed });
	} catch (e) {
		return handleError(e);
	}
}
