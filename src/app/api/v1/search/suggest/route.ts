import { NextRequest } from "next/server";
import { clean_search_query } from "@/lib/deezer/utils";
import { deezerSuggest } from "@/lib/deezer/suggest";
import { ok, fail, handleError, getGuestOrUserDz } from "../../_lib/helpers";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

export async function GET(request: NextRequest) {
	try {
		const { dz } = await getGuestOrUserDz(request);
		if (!dz) {
			return fail(
				"NO_DEEZER",
				"Deezer is not available. Sign in or configure a service ARL.",
				503
			);
		}

		const params = request.nextUrl.searchParams;
		const rawTerm = params.get("term") || "";
		const term = clean_search_query(rawTerm);
		if (!term) {
			return fail("MISSING_TERM", "Search term is required.", 400);
		}

		const limitParam = parseInt(params.get("limit") || `${DEFAULT_LIMIT}`, 10);
		const limit = Math.max(
			1,
			Math.min(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, MAX_LIMIT)
		);

		const suggestions = await deezerSuggest(dz, term, { limit });

		return ok({
			tracks: suggestions.tracks,
			albums: suggestions.albums,
			artists: suggestions.artists,
			source: "deezer" as const,
		});
	} catch (e) {
		return handleError(e);
	}
}
