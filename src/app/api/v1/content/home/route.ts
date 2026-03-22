import { NextRequest } from "next/server";
import { ok, fail, handleError, getGuestOrUserDz } from "../../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		const pageData = await dz.gw.get_page("channels/explore");
		return ok(pageData);
	} catch (e) {
		return handleError(e);
	}
}
