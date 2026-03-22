import { NextRequest } from "next/server";
import { removeUserDz } from "@/lib/server-state";
import { auth } from "@/lib/auth";
import { ok, handleError } from "../v1/_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		// Clear Deezer session for the authenticated user
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (session?.user?.id) {
			removeUserDz(session.user.id);
		}

		return ok({ message: "Deezer session cleared." });
	} catch (e) {
		return handleError(e);
	}
}
