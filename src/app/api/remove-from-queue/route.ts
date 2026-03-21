import { NextRequest, NextResponse } from "next/server";
import { getDeemixApp } from "@/lib/server-state";

export async function POST(request: NextRequest) {
	try {
		const { uuid } = await request.json();

		if (!uuid) {
			return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
		}

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		deemixApp.cancelDownload(uuid);
		return NextResponse.json({ status: "ok" });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
