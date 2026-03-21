import { type NextRequest, NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const term = searchParams.get("term") || "";

		if (!term) {
			return NextResponse.json({ error: "Missing search term" }, { status: 400 });
		}

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const results = await dz.gw.search(term);
		return NextResponse.json(results);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
