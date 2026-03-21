import { NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET() {
	try {
		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const userId = dz.currentUser?.id;
		if (!userId) {
			return NextResponse.json({ error: "No user ID" }, { status: 400 });
		}

		const [tracks, albums, artists, playlists] = await Promise.all([
			dz.gw.get_user_tracks(userId, { limit: 25 }),
			dz.gw.get_user_albums(userId, { limit: 25 }),
			dz.gw.get_user_artists(userId, { limit: 25 }),
			dz.gw.get_user_playlists(userId, { limit: 25 }),
		]);

		return NextResponse.json({ tracks, albums, artists, playlists });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
