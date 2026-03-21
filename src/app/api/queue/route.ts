import { NextResponse } from "next/server";
import { getDeemixApp } from "@/lib/server-state";

export async function GET() {
	try {
		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		return NextResponse.json(deemixApp.getQueue());
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
