import { NextRequest } from "next/server";
import { parsePlaylistInput, fetchPlaylist, SpotifyAPIError } from "@/lib/spotify";
import { MAX_IMPORT_TRACKS } from "@/lib/spotify/import";
import { ok, fail, handleError, requireUser } from "../../../../_lib/helpers";
import { spotifyFailure } from "../_lib/errors";

// POST /api/v1/playlists/import/spotify/playlist
// Body: { url: string } — a Spotify playlist URL, URI or id
// Response: SpotifyPlaylistMeta, tracks capped at MAX_IMPORT_TRACKS
//           (`totalTracks` keeps the real count, so the client can tell).
// Step 1 of the chunked import: then POST …/match in batches, then …/save.
export async function POST(request: NextRequest) {
	try {
		const { error } = await requireUser(request);
		if (error) return error;

		const { url } = await request.json().catch(() => ({}));
		if (!url || typeof url !== "string") {
			return fail("MISSING_URL", "A Spotify playlist URL is required.", 400);
		}
		const playlistId = parsePlaylistInput(url);
		if (!playlistId) {
			return fail("INVALID_URL", "Could not extract a Spotify playlist ID from the input.", 400);
		}

		let playlist;
		try {
			playlist = await fetchPlaylist(playlistId);
		} catch (e) {
			if (e instanceof SpotifyAPIError) return spotifyFailure(e);
			throw e;
		}
		if (playlist.tracks.length === 0) {
			return fail("EMPTY_PLAYLIST", "Playlist has no importable tracks.", 400);
		}

		return ok({
			...playlist,
			totalTracks: Math.max(playlist.totalTracks, playlist.tracks.length),
			tracks: playlist.tracks.slice(0, MAX_IMPORT_TRACKS),
		});
	} catch (e) {
		return handleError(e);
	}
}
