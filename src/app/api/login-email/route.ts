import { NextRequest, NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Missing email or password" },
				{ status: 400 }
			);
		}

		const { Deezer } = await import("@/lib/deezer");
		const dz = new Deezer();
		const loggedIn = await dz.login(email, password, "");

		if (loggedIn) {
			const sessionDZ = getSessionDZ();
			sessionDZ["default"] = dz;

			return NextResponse.json({
				status: dz.childs.length > 1 ? 3 : 1,
				user: dz.currentUser,
				childs: dz.childs,
				currentChild: dz.selectedAccount,
			});
		}

		return NextResponse.json({ status: 0, error: "Login failed" });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
