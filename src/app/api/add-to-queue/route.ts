import { NextRequest, NextResponse } from "next/server";
import { getDeemixApp, getSessionDZ } from "@/lib/server-state";

export async function POST(request: NextRequest) {
	try {
		const { url, bitrate } = await request.json();

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		const effectiveBitrate = bitrate ?? deemixApp.settings.maxBitrate;
		const urls = Array.isArray(url) ? url : [url];

		const result = await deemixApp.addToQueue(dz, urls, effectiveBitrate);
		return NextResponse.json({ result });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
