import { type NextRequest, NextResponse } from "next/server";
import { getDeemixApp } from "@/lib/server-state";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const spotifyUser = searchParams.get("spotifyUser") || "";

		if (!spotifyUser) {
			return NextResponse.json(
				{ error: "Missing spotifyUser parameter" },
				{ status: 400 }
			);
		}

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		const spotify = deemixApp.plugins.spotify;
		if (!spotify?.enabled) {
			return NextResponse.json({ error: "spotifyNotEnabled" });
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
				return NextResponse.json({ error: "wrongSpotifyUsername", username });
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

		return NextResponse.json(data);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
