import { getDeemixApp, getSessionDZ } from "@/lib/server-state";
import { ok, fail, handleError } from "../../_lib/helpers";

export async function GET() {
	try {
		const deemixApp = await getDeemixApp();
		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];

		const deezerAvailable = deemixApp
			? await deemixApp.isDeezerAvailable()
			: "no-network";

		const settings = deemixApp ? deemixApp.getSettings() : {};
		const spotifyEnabled = !!deemixApp?.plugins?.spotify?.enabled;
		const queue = deemixApp
			? deemixApp.getQueue()
			: { queue: {}, queueOrder: [] };

		const currentUser = dz?.loggedIn ? dz.currentUser : null;
		const loggedIn = !!dz?.loggedIn;

		return ok({
			loggedIn,
			deezerAvailable,
			spotifyEnabled,
			settings,
			currentUser,
			queue,
		});
	} catch (e) {
		return handleError(e);
	}
}
