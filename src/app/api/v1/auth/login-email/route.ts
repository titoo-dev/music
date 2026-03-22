import { NextRequest } from "next/server";
import { setUserDz } from "@/lib/server-state";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { email, password } = await request.json();

		if (!email || !password) {
			return fail("MISSING_CREDENTIALS", "Email and password are required.", 400);
		}

		const { Deezer } = await import("@/lib/deezer");
		const dz = new Deezer();
		const loggedIn = await dz.login(email, password, "");

		if (!loggedIn) {
			return fail("LOGIN_FAILED", "Invalid email or password.", 401);
		}

		setUserDz(userResult.userId, dz);

		// Try to extract ARL from the Deezer cookie jar for persistence
		const arl = dz.cookieJar?.getCookiesSync?.("https://www.deezer.com")
			?.find((c: any) => c.key === "arl")?.value;

		if (arl) {
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
		}

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
