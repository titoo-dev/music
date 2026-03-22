import { NextRequest } from "next/server";
import { getDeemixApp, getUserDz, setUserDz } from "@/lib/server-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "../../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const deemixApp = await getDeemixApp();

		const deezerAvailable = deemixApp
			? await deemixApp.isDeezerAvailable()
			: "no-network";

		const settings = deemixApp ? deemixApp.getSettings() : {};
		const spotifyEnabled = !!deemixApp?.plugins?.spotify?.enabled;
		const queue = deemixApp
			? deemixApp.getQueue()
			: { queue: {}, queueOrder: [] };

		// Check better-auth session
		let betterAuthUser = null;
		let deezerUser = null;
		let deezerLoggedIn = false;

		try {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			if (session?.user) {
				betterAuthUser = {
					id: session.user.id,
					name: session.user.name,
					email: session.user.email,
					image: session.user.image,
				};

				// Try to restore Deezer session from stored ARL or service ARL
				let dz = getUserDz(session.user.id);
				if (!dz?.loggedIn) {
					const cred = await prisma.deezerCredential.findUnique({
						where: { userId: session.user.id },
					});
					const arl = cred?.arl || process.env.DEEMIX_SERVICE_ARL;
					if (arl) {
						const { Deezer } = await import("@/lib/deezer");
						dz = new Deezer();
						const loggedIn = await dz.loginViaArl(arl);
						if (loggedIn) {
							setUserDz(session.user.id, dz);
							// Persist service ARL as user credential if not already stored
							if (!cred && process.env.DEEMIX_SERVICE_ARL) {
								try {
									await prisma.deezerCredential.create({
										data: {
											userId: session.user.id,
											arl,
											deezerUserId: String(dz.currentUser?.id || ""),
											deezerUserName: dz.currentUser?.name || "",
											deezerPicture: dz.currentUser?.picture || "",
											canStreamHq: !!dz.currentUser?.can_stream_hq,
											canStreamLossless: !!dz.currentUser?.can_stream_lossless,
										},
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
			spotifyEnabled,
			settings,
			queue,
		});
	} catch (e) {
		return handleError(e);
	}
}
