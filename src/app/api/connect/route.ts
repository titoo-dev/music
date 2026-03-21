import { NextResponse } from "next/server";
import { getDeemixApp, getSessionDZ } from "@/lib/server-state";

export async function GET() {
	try {
		const deemixApp = await getDeemixApp();
		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];

		const deezerAvailable = deemixApp
			? await deemixApp.isDeezerAvailable()
			: "no-network";

		const settingsData = deemixApp ? deemixApp.getSettings() : {};
		const spotifyEnabled = !!deemixApp?.plugins?.spotify?.enabled;
		const queue = deemixApp ? deemixApp.getQueue() : { queue: {}, queueOrder: [] };

		const currentUser = dz?.loggedIn ? dz.currentUser : null;
		const autologin = !dz?.loggedIn;

		return NextResponse.json({
			deezerAvailable,
			spotifyEnabled,
			settingsData,
			currentUser,
			queue,
			autologin,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
