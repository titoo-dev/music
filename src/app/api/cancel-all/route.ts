import { NextResponse } from "next/server";
import { getDeemixApp } from "@/lib/server-state";

export async function POST() {
	try {
		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		deemixApp.cancelAllDownloads();
		return NextResponse.json({ status: "ok" });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
