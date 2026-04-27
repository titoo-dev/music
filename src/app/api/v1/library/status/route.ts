import { NextRequest } from "next/server";
import { requireUser, ok, handleError } from "../../_lib/helpers";
import { getSavedTrackIds, getSavedAlbumIds } from "@/lib/library";

// POST /api/v1/library/status
// Batch lookup: which of these tracks/albums are in my library?
// Body: { trackIds?: string[], albumIds?: string[] }
// Response: { tracks: string[], albums: string[] }
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const body = await request.json().catch(() => ({}));
		const trackIds: string[] = Array.isArray(body.trackIds)
			? body.trackIds.map(String)
			: [];
		const albumIds: string[] = Array.isArray(body.albumIds)
			? body.albumIds.map(String)
			: [];

		const [savedTrackIds, savedAlbumIds] = await Promise.all([
			getSavedTrackIds(userResult.userId, trackIds),
			getSavedAlbumIds(userResult.userId, albumIds),
		]);

		return ok({
			tracks: Array.from(savedTrackIds),
			albums: Array.from(savedAlbumIds),
		});
	} catch (e) {
		return handleError(e);
	}
}
