import { NextRequest } from "next/server";
import { getSessionDZ } from "@/lib/server-state";
import { ok, fail, handleError } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
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
