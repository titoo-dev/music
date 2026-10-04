import { NextRequest } from "next/server";
import { ok, fail, handleError, requireDeezer } from "../../_lib/helpers";
import { saveSelectedAccount } from "@/lib/deezer-session";

export async function POST(request: NextRequest) {
	try {
		const { userId, dz, error } = await requireDeezer(request);
		if (error) return error;
		const { child } = await request.json();

		if (child === undefined || child === null) {
			return fail("MISSING_CHILD_INDEX", "Child account index is required.", 400);
		}
		const index =
			typeof child === "number" ? child : typeof child === "string" && /^\d+$/.test(child.trim()) ? Number(child) : NaN;
		if (!Number.isInteger(index) || index < 0) {
			return fail("INVALID_CHILD_INDEX", "Child account index must be a non-negative integer.", 400);
		}

		const [user, selectedAccount] = dz.changeAccount(index);
		// Persist the choice: a cold restore (other instance, after TTL) logs into the same child.
		await saveSelectedAccount(userId, dz);

		return ok({
			user,
			selectedAccount,
			childs: dz.childs,
		});
	} catch (e) {
		return handleError(e);
	}
}
