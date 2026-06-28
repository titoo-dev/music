import { NextRequest } from "next/server";
import { removeUserDz } from "@/lib/server-state";
import { ok, handleError, requireUser } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		// Clear the in-memory Deezer session for the authenticated user (the
		// Better Auth session itself is cleared client-side via /api/auth).
		const { userId } = await requireUser(request);
		if (userId) removeUserDz(userId);

		return ok({ message: "Deezer session cleared." });
	} catch (e) {
		return handleError(e);
	}
}
