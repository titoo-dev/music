import { NextRequest } from "next/server";
import { ok, fail, handleError, requireAuth } from "../../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const auth = requireAuth();
		if (auth.error) return auth.error;

		const id = request.nextUrl.searchParams.get("id") || "0";

		const tracks = await auth.dz.api.get_chart_tracks(parseInt(id, 10), {
			limit: 100,
		});
		return ok(tracks);
	} catch (e) {
		return handleError(e);
	}
}
