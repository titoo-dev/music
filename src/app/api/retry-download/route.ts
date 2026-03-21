import { NextRequest, NextResponse } from "next/server";
import { getDeemixApp, getSessionDZ } from "@/lib/server-state";

export async function POST(request: NextRequest) {
	try {
		const { uuid } = await request.json();

		if (!uuid) {
			return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
		}

		const sessionDZ = getSessionDZ();
		const dz = sessionDZ["default"];
		if (!dz?.loggedIn) {
			return NextResponse.json({ error: "notLoggedIn" }, { status: 403 });
		}

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		const queueItem = deemixApp.queue[uuid];
		if (!queueItem) {
			return NextResponse.json({ error: "Item not found in queue" }, { status: 404 });
		}

		// Remove the failed item and re-add it
		deemixApp.cancelDownload(uuid);

		// Re-queue using the original link info
		const url = queueItem.url || `https://www.deezer.com/${queueItem.__type__ === "Single" ? "track" : "album"}/${queueItem.id}`;
		const result = await deemixApp.addToQueue(dz, [url], queueItem.bitrate, true);

		return NextResponse.json({ result });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
