import { NextRequest } from "next/server";
import { ok, fail, handleError, getGuestOrUserDz } from "../../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		const id = request.nextUrl.searchParams.get("id") || "0";

		const tracks = await dz.api.get_chart_tracks(parseInt(id, 10), {
			limit: 100,
		});
		return ok(tracks);
	} catch (e) {
		return handleError(e);
	}
}
