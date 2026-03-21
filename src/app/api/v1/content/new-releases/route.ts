import { ok, handleError, requireAuth } from "../../_lib/helpers";

export async function GET() {
	try {
		const auth = requireAuth();
		if (auth.error) return auth.error;

		const releases = await auth.dz.api.get_editorial_releases(0, {
			index: 0,
			limit: 100,
		});
		return ok(releases);
	} catch (e) {
		return handleError(e);
	}
}
