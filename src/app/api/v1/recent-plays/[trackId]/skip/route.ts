import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, handleError } from "../../../_lib/helpers";
import { maybeEvictFile, getTrackRefCount } from "@/lib/library";

// POST /api/v1/recent-plays/[trackId]/skip
// Called when a track is skipped before reaching the 30s threshold. If this
// user hasn't already logged a real play AND the track isn't anchored by
// any other entity (saved, in saved album, shared, recent-played by anyone),
// the file is freed. Metadata in saved-* tables stays so replay re-streams.
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
			return ok({ kept: true, reason: "already_played" });
		}

		// Get a snapshot of refs — if anything else holds this track (another
		// user listening, in someone's saved library, etc.), keep the file.
		const refs = await getTrackRefCount(trackId);
		if (refs.total > 0) {
			return ok({ kept: true, reason: "anchored" });
		}

		await maybeEvictFile(trackId);
		return ok({ evicted: true });
	} catch (e) {
		return handleError(e);
	}
}
