import { NextRequest } from "next/server";
import { setUserDz } from "@/lib/server-state";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../v1/_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { arl, child } = await request.json();

		if (!arl) {
			return fail("MISSING_ARL", "ARL token is required.", 400);
		}

		const { Deezer } = await import("@/lib/deezer");
		const dz = new Deezer();
		const loggedIn = await dz.loginViaArl(arl, child || 0);

		if (!loggedIn) {
			return fail("LOGIN_FAILED", "Invalid ARL token or login failed.", 401);
		}

		// Store Deezer session in memory (keyed by better-auth user ID)
		setUserDz(userResult.userId, dz);

		// Persist ARL and Deezer user info in database
		await prisma.deezerCredential.upsert({
			where: { userId: userResult.userId },
			update: {
				arl,
				deezerUserId: dz.currentUser?.id ?? null,
				deezerUserName: dz.currentUser?.name ?? null,
				deezerPicture: dz.currentUser?.picture ?? null,
				canStreamHq: dz.currentUser?.can_stream_hq ?? false,
				canStreamLossless: dz.currentUser?.can_stream_lossless ?? false,
			},
			create: {
				userId: userResult.userId,
				arl,
				deezerUserId: dz.currentUser?.id ?? null,
				deezerUserName: dz.currentUser?.name ?? null,
				deezerPicture: dz.currentUser?.picture ?? null,
				canStreamHq: dz.currentUser?.can_stream_hq ?? false,
				canStreamLossless: dz.currentUser?.can_stream_lossless ?? false,
			},
		});

		return ok({
			user: dz.currentUser,
			childs: dz.childs,
			currentChild: dz.selectedAccount,
			hasMultipleAccounts: dz.childs.length > 1,
		});
	} catch (e) {
		return handleError(e);
	}
}
