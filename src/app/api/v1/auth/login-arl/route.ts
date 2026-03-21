import { NextRequest } from "next/server";
import { getSessionDZ } from "@/lib/server-state";
import { ok, fail, handleError } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
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

		const sessionDZ = getSessionDZ();
		sessionDZ["default"] = dz;

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
