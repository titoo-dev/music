import { NextRequest } from "next/server";
import { requireUser, ok, handleError } from "../../../_lib/helpers";
import { unfollowArtist } from "@/lib/library";

// DELETE /api/v1/library/artists/[deezerArtistId] — unfollow an artist.
// Uses the upstream Deezer artist id (not the internal FollowedArtist.id)
// since the frontend has the deezerArtistId readily available from the
// route params and avoids a round-trip to resolve the internal id.
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ deezerArtistId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { deezerArtistId } = await params;
		await unfollowArtist(userResult.userId, deezerArtistId);
		// Idempotent: returns OK even when the artist wasn't followed, mirroring
		// the album/track unsave routes.
		return ok({ unfollowed: true });
	} catch (e) {
		return handleError(e);
	}
}
