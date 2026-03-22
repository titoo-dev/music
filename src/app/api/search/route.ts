import { NextRequest } from "next/server";
import { clean_search_query } from "@/lib/deezer/utils";
import { ok, fail, handleError, getGuestOrUserDz } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const rawTerm = searchParams.get("term") || "";
		const type = searchParams.get("type") || "track";
		const start = parseInt(searchParams.get("start") || "0", 10);
		const nb = parseInt(searchParams.get("nb") || "100", 10);

		const term = clean_search_query(rawTerm);

		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		const results = await dz.gw.search_music(term, type, {
			index: start,
			limit: nb,
		});

		return ok(results);
	} catch (e) {
		return handleError(e);
	}
}
