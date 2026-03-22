import { NextRequest } from "next/server";
import { ok, fail, handleError, getGuestOrUserDz } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("id") || "";
		const type = searchParams.get("type") || "";

		if (!id || !type) {
			return fail("MISSING_PARAMS", "Missing id or type parameter.", 400);
		}

		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

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
				return fail("UNKNOWN_TYPE", `Unknown type: ${type}`, 400);
		}

		return ok(data);
	} catch (e) {
		return handleError(e);
	}
}
