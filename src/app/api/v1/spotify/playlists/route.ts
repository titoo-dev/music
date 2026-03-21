import { NextRequest } from "next/server";
import { ok, fail, handleError, requireApp } from "../../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		const spotifyUser = request.nextUrl.searchParams.get("spotifyUser") || "";
		if (!spotifyUser) {
			return fail("MISSING_SPOTIFY_USER", "Spotify username is required.", 400);
		}

		const spotify = app.plugins.spotify;
		if (!spotify?.enabled) {
			return fail("SPOTIFY_NOT_ENABLED", "Spotify integration is not enabled. Configure Spotify credentials in settings.", 400);
		}

		const sp = spotify.sp;
		const usernames = spotifyUser.split(/[\s,]+/);
		const data: any[] = [];
		let playlistList: any[] = [];

		for (let username of usernames) {
			username = username.trim();
			if (!username) continue;
			try {
				let playlists = await sp.playlists.getUsersPlaylists(username);
				playlistList = playlistList.concat(playlists.items);
				while (playlists.next) {
					const regExec = /offset=(\d+)/g.exec(playlists.next);
					const offset = regExec?.[1];
					playlists = await sp.playlists.getUsersPlaylists(username, undefined, offset);
					playlistList = playlistList.concat(playlists.items);
				}
			} catch {
				return fail("INVALID_SPOTIFY_USER", `Spotify username "${username}" not found.`, 404);
			}
		}

		playlistList.forEach((playlist: any) => {
			if (spotify._convertPlaylistStructure) {
				data.push(spotify._convertPlaylistStructure(playlist));
			} else {
				data.push({
					id: playlist.id,
					title: playlist.name,
					picture_medium: playlist.images?.[0]?.url || "",
					nb_tracks: playlist.tracks?.total || 0,
				});
			}
		});

		return ok(data);
	} catch (e) {
		return handleError(e);
	}
}
