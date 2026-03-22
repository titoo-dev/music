import { NextRequest } from "next/server";
import { ok, fail, handleError, getGuestOrUserDz } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		const releases = await dz.api.get_editorial_releases(0, {
			index: 0,
			limit: 100,
		});
		return ok(releases);
	} catch (e) {
		return handleError(e);
	}
}
