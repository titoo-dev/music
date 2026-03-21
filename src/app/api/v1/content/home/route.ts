import { ok, handleError, requireAuth } from "../../_lib/helpers";

export async function GET() {
	try {
		const auth = requireAuth();
		if (auth.error) return auth.error;

		const pageData = await auth.dz.gw.get_page("channels/explore");
		return ok(pageData);
	} catch (e) {
		return handleError(e);
	}
}
