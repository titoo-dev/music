import { NextRequest } from "next/server";
import { ok, fail, handleError, getGuestOrUserDz, requireApp } from "../../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		const { app, error } = await requireApp();
		if (error) return error;

		const term = request.nextUrl.searchParams.get("term") || "";
		if (!term) {
			return fail("MISSING_TERM", "A link/URL is required.", 400);
		}

		const { parseLink } = await import("@/lib/deemix");
		const [link, linkType, linkId] = await parseLink(term);

		if (!linkType || !linkId) {
			if (app.plugins.spotify?.enabled) {
				try {
					const spotifyData = await app.plugins.spotify.parseLink(term);
					if (spotifyData) {
						return ok({ source: "spotify", ...spotifyData });
					}
				} catch {
					// Not a Spotify link
				}
			}
			return fail("LINK_NOT_RECOGNIZED", "The provided link could not be recognized.", 400);
		}

		let data: any;

		switch (linkType) {
			case "track":
				data = await dz.api.getTrack(linkId);
				break;
			case "album":
				data = await dz.api.get_album(linkId);
				break;
			case "playlist":
				data = await dz.api.get_playlist(linkId);
				break;
			case "artist":
				data = await dz.api.get_artist(linkId);
				break;
			default:
				data = { linkType, linkId, link };
				break;
		}

		return ok({ source: "deezer", type: linkType, id: linkId, data });
	} catch (e) {
		return handleError(e);
	}
}
