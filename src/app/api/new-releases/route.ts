import { NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET() {
	try {
		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const releases = await dz.api.get_editorial_releases(0, {
			index: 0,
			limit: 100,
		});
		return NextResponse.json(releases);
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
