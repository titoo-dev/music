import { type NextRequest, NextResponse } from "next/server";
import { getDeemixApp, getSessionDZ } from "@/lib/server-state";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const term = searchParams.get("term") || "";

		if (!term) {
			return NextResponse.json({ error: "Missing term" }, { status: 400 });
		}

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		const { parseLink } = await import("@/lib/deemix");
		const [link, linkType, linkId] = await parseLink(term);

		if (!linkType || !linkId) {
			// Could be a Spotify link - check plugins
			if (deemixApp.plugins.spotify?.enabled) {
				try {
					const spotifyData = await deemixApp.plugins.spotify.parseLink(term);
					if (spotifyData) {
						return NextResponse.json(spotifyData);
					}
				} catch {
					// Not a recognized Spotify link
				}
			}
			return NextResponse.json({ error: "Link not recognized" }, { status: 400 });
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

		return NextResponse.json({ type: linkType, id: linkId, data });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
