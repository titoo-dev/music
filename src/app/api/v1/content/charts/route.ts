import { ok, handleError, requireAuth } from "../../_lib/helpers";

export async function GET() {
	try {
		const auth = requireAuth();
		if (auth.error) return auth.error;

		const charts = await auth.dz.api.get_countries_charts();
		return ok(charts);
	} catch (e) {
		return handleError(e);
	}
}
