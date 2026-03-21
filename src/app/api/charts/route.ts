import { NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET() {
	try {
		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const charts = await dz.api.get_countries_charts();
		return NextResponse.json(charts);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
