import { NextRequest } from "next/server";
import { clean_search_query } from "@/lib/deezer/utils";
import { ok, fail, handleError, requireAuth } from "../_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const auth = requireAuth();
		if (auth.error) return auth.error;

		const searchParams = request.nextUrl.searchParams;
		const rawTerm = searchParams.get("term") || "";
		const type = searchParams.get("type") || "track";
		const start = parseInt(searchParams.get("start") || "0", 10);
		const nb = parseInt(searchParams.get("nb") || "100", 10);

		const term = clean_search_query(rawTerm);
		if (!term) {
			return fail("MISSING_TERM", "Search term is required.", 400);
		}

		const validTypes = ["track", "album", "artist", "playlist"];
		if (!validTypes.includes(type)) {
			return fail("INVALID_TYPE", `Type must be one of: ${validTypes.join(", ")}`, 400);
		}

		const results = await auth.dz.gw.search_music(term, type, {
			index: start,
			limit: nb,
		});

		return ok(results);
	} catch (e) {
		return handleError(e);
	}
}
