import { NextRequest } from "next/server";
import { ok, fail, handleError, requireDeezer } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const { child } = await request.json();
		const { dz, error } = await requireDeezer(request);
		if (error) return error;

		if (child === undefined || child === null) {
			return fail("MISSING_CHILD_INDEX", "Child account index is required.", 400);
		}

		const [user, selectedAccount] = dz.changeAccount(child);

		return ok({
			user,
			selectedAccount,
			childs: dz.childs,
		});
	} catch (e) {
		return handleError(e);
	}
}
