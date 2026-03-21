import { NextRequest } from "next/server";
import { ok, fail, handleError, requireAuth } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const { child } = await request.json();
		const auth = requireAuth();
		if (auth.error) return auth.error;

		if (child === undefined || child === null) {
			return fail("MISSING_CHILD_INDEX", "Child account index is required.", 400);
		}

		const [user, selectedAccount] = auth.dz.changeAccount(child);

		return ok({
			user,
			selectedAccount,
			childs: auth.dz.childs,
		});
	} catch (e) {
		return handleError(e);
	}
}
