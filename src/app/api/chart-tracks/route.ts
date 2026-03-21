import { type NextRequest, NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("id") || "0";

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const tracks = await dz.api.get_chart_tracks(parseInt(id, 10), {
			limit: 100,
		});
		return NextResponse.json(tracks);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
