import { NextRequest } from "next/server";
import {
	listPlaylistsWithCovers,
	createPlaylist,
} from "@/lib/repositories/playlists";
import { ok, fail, handleError, requireUser } from "../_lib/helpers";

// GET /api/v1/playlists — List all playlists for current user.
// Optional ?trackId=... annotates each playlist with `containsTrack: boolean`,
// used by the "Add to playlist" menu to mark playlists already holding the track.
export async function GET(request: NextRequest) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const trackId = request.nextUrl.searchParams.get("trackId");
		const result = await listPlaylistsWithCovers(userId, trackId);
		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/playlists — Create a new playlist
export async function POST(request: NextRequest) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { title, description } = await request.json();
		if (!title?.trim()) {
			return fail("MISSING_TITLE", "Playlist title is required.", 400);
		}

		const playlist = await createPlaylist(
			userId,
			title.trim(),
			description?.trim() || null
		);

		return ok(playlist);
	} catch (e) {
		return handleError(e);
	}
}
