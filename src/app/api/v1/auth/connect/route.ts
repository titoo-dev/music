import { NextRequest } from "next/server";
import { getDeemixApp, getUserDz, setUserDz } from "@/lib/server-state";
import {
	getDeezerCredential,
	upsertDeezerCredential,
} from "@/lib/repositories/deezerCredentials";
import { ok, handleError } from "../../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const deemixApp = await getDeemixApp();

		const deezerAvailable = deemixApp
			? await deemixApp.isDeezerAvailable()
			: "no-network";

		const settings = deemixApp ? deemixApp.getSettings() : {};

		// Check better-auth session
		let betterAuthUser = null;
		let deezerUser = null;
		let deezerLoggedIn = false;

		try {
			const { getToken, fetchAuthQuery } = await import("@/lib/auth-server");
			let user:
				| { _id: string; name?: string; email?: string; image?: string }
				| null = null;
			if (await getToken()) {
				const { api } = await import("@convex/_generated/api");
				user = (await fetchAuthQuery(api.auth.getCurrentUser, {})) as typeof user;
			}

			if (user) {
				betterAuthUser = {
					id: user._id,
					name: user.name,
					email: user.email,
					image: user.image,
				};

				// Try to restore Deezer session from stored ARL or service ARL
				let dz = getUserDz(user._id);
				if (!dz?.loggedIn) {
					const cred = await getDeezerCredential(user._id);
					const arl = cred?.arl || process.env.DEEMIX_SERVICE_ARL;
					if (arl) {
						const { Deezer } = await import("@/lib/deezer");
						dz = new Deezer();
						const loggedIn = await dz.loginViaArl(arl);
						if (loggedIn) {
							setUserDz(user._id, dz);
							// Persist service ARL as user credential if not already stored
							if (!cred && process.env.DEEMIX_SERVICE_ARL) {
								try {
									await upsertDeezerCredential(user._id, {
										arl,
										deezerUserId:
											dz.currentUser?.id != null
												? Number(dz.currentUser.id)
												: null,
										deezerUserName: dz.currentUser?.name || null,
										deezerPicture: dz.currentUser?.picture || null,
										canStreamHq: !!dz.currentUser?.can_stream_hq,
										canStreamLossless: !!dz.currentUser?.can_stream_lossless,
									});
								} catch {
									// Ignore duplicate or write errors
								}
							}
						} else {
							dz = null;
						}
					}
				}

				if (dz?.loggedIn) {
					deezerUser = dz.currentUser;
					deezerLoggedIn = true;
				}
			}
		} catch {
			// No session or auth error — continue as guest
		}

		return ok({
			// Better-auth status
			authenticated: !!betterAuthUser,
			user: betterAuthUser,
			// Deezer status
			deezerLoggedIn,
			deezerUser,
			// App status
			deezerAvailable,
			settings,
		});
	} catch (e) {
		return handleError(e);
	}
}
