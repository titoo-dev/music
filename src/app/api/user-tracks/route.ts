import { NextRequest } from "next/server";
import { ok, fail, handleError, requireDeezer } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const { dz, error } = await requireDeezer(request);
		if (error) return error;

		const userId = dz.currentUser?.id;
		if (!userId) {
			return fail("NO_USER_ID", "User ID not available.", 400);
		}

		const tracks = await dz.gw.get_user_tracks(userId, { limit: 2000 });
		return ok(tracks);
	} catch (e) {
		return handleError(e);
	}
}
