import { getSessionDZ } from "@/lib/server-state";
import { ok, handleError } from "../../_lib/helpers";

export async function POST() {
	try {
		const sessionDZ = getSessionDZ();
		delete sessionDZ["default"];

		return ok({ message: "Logged out successfully." });
	} catch (e) {
		return handleError(e);
	}
}
