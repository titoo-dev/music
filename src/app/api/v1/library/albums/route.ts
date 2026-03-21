import { ok, fail, handleError, requireAuth } from "../../_lib/helpers";

export async function GET() {
	try {
		const auth = requireAuth();
		if (auth.error) return auth.error;

		const userId = auth.dz.currentUser?.id;
		if (!userId) {
			return fail("NO_USER_ID", "User ID not available.", 400);
		}

		const albums = await auth.dz.gw.get_user_albums(userId, { limit: 2000 });
		return ok(albums);
	} catch (e) {
		return handleError(e);
	}
}
