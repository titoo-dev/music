import { type NextRequest, NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";
import { clean_search_query } from "@/lib/deezer/utils";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const rawTerm = searchParams.get("term") || "";
		const type = searchParams.get("type") || "track";
		const start = parseInt(searchParams.get("start") || "0", 10);
		const nb = parseInt(searchParams.get("nb") || "100", 10);

		const term = clean_search_query(rawTerm);

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const results = await dz.gw.search_music(term, type, {
			index: start,
			limit: nb,
		});

		return NextResponse.json(results);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
