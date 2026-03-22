import { type NextRequest, NextResponse } from "next/server";
import { getDeemixApp } from "@/lib/server-state";

export async function GET() {
	try {
		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		return NextResponse.json(deemixApp.getSettings(), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const { settings, spotifySettings } = await request.json();

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		await deemixApp.saveSettings(settings, spotifySettings);
		return NextResponse.json(deemixApp.getSettings(), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
