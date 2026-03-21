import { type NextRequest, NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const child = parseInt(searchParams.get("child") || "0", 10);

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const [user, selectedAccount] = dz.changeAccount(child);

		return NextResponse.json({
			user,
			selectedAccount,
			childs: dz.childs,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
