import { NextRequest } from "next/server";
import { ok, fail, handleError, getGuestOrUserDz } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("id") || "0";

		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		const tracks = await dz.api.get_chart_tracks(parseInt(id, 10), {
			limit: 100,
		});
		return ok(tracks);
	} catch (e) {
		return handleError(e);
	}
}
