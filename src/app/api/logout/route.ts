import { NextResponse } from "next/server";
import { getSessionDZ } from "@/lib/server-state";

export async function POST() {
	try {
		const sessionDZ = getSessionDZ();
		delete sessionDZ["default"];

		return NextResponse.json({ status: "ok" });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
