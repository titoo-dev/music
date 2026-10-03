import { SpotifyAPIError } from "@/lib/spotify";
import { fail } from "../../../../_lib/helpers";

export function spotifyFailure(e: SpotifyAPIError) {
	if (e.status === 404) {
		return fail("SPOTIFY_NOT_FOUND", "Playlist not found, private, or unavailable in this region.", 404);
	}
	if (e.status === 403) {
		return fail("SPOTIFY_FORBIDDEN", `Spotify denied the request: ${e.message}.`, 403);
	}
	if (e.status === 429) {
		return fail("SPOTIFY_RATE_LIMITED", "Spotify is rate-limiting requests. Please try again in a moment.", 429);
	}
	return fail("SPOTIFY_ERROR", e.message, 502);
}
