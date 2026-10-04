import { NextRequest } from "next/server";
import { setUserDz } from "@/lib/server-state";
import { saveDeezerCredential } from "@/lib/deezer-session";
import { deezerAccountPayload } from "@/lib/deezer/public-user";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

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

		// Persist the ARL (encrypted) with the selected child account and profile
		await saveDeezerCredential(userResult.userId, arl, dz);

		// Never hand the license token to the client (it requests media as this account)
		return ok(deezerAccountPayload(dz));
	} catch (e) {
		// handleError logs the detail server-side.
		return handleError(e);
	}
}
