import { NextRequest } from "next/server";
import { getDeemixApp } from "@/lib/server-state";
import { ok, fail, handleError, getGuestOrUserDz } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const term = searchParams.get("term") || "";

		if (!term) {
			return fail("MISSING_TERM", "A search term or link is required.", 400);
		}

		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return fail("APP_NOT_INITIALIZED", "Server application not initialized.", 500);
		}

		const { parseLink } = await import("@/lib/deemix");
		const [link, linkType, linkId] = await parseLink(term);

		if (!linkType || !linkId) {
			// Could be a Spotify link - check plugins
			if (deemixApp.plugins.spotify?.enabled) {
				try {
					const spotifyData = await deemixApp.plugins.spotify.parseLink(term);
					if (spotifyData) {
						return ok(spotifyData);
					}
				} catch {
					// Not a recognized Spotify link
				}
			}
			return fail("LINK_NOT_RECOGNIZED", "Link not recognized.", 400);
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

		return ok({ type: linkType, id: linkId, data });
	} catch (e) {
		return handleError(e);
	}
}
