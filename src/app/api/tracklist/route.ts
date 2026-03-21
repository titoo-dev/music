import { type NextRequest, NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("id") || "";
		const type = searchParams.get("type") || "";

		if (!id || !type) {
			return NextResponse.json(
				{ error: "Missing id or type parameter" },
				{ status: 400 }
			);
		}

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		let data: any;

		switch (type) {
			case "album": {
				const albumPage = await dz.gw.get_album_page(id);
				const albumTracks = await dz.gw.get_album_tracks(id);
				data = { ...albumPage, tracks: albumTracks };
				break;
			}
			case "playlist": {
				const playlistPage = await dz.gw.get_playlist_page(id);
				const playlistTracks = await dz.gw.get_playlist_tracks(id);
				data = { ...playlistPage, tracks: playlistTracks };
				break;
			}
			case "artist": {
				const artistPage = await dz.gw.get_artist_page(id);
				const artistTop = await dz.gw.get_artist_top_tracks(id);
				const discography = await dz.gw.get_artist_discography_tabs(id, {
					limit: 100,
				});
				data = { ...artistPage, topTracks: artistTop, discography };
				break;
			}
			default:
				return NextResponse.json(
					{ error: `Unknown type: ${type}` },
					{ status: 400 }
				);
		}

		return NextResponse.json(data);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
