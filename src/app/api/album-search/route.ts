import { type NextRequest, NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const term = searchParams.get("term") || "";
		const start = parseInt(searchParams.get("start") || "0", 10);
		const nb = parseInt(searchParams.get("nb") || "30", 10);

		if (!term) {
			return NextResponse.json({ error: "Missing search term" }, { status: 400 });
		}

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const results = await dz.api.search_album(term, {
			index: start,
			limit: nb,
		});

		return NextResponse.json(results);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
