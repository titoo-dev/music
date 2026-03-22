import { NextRequest } from "next/server";
import { ok, fail, handleError, requireDeezerAndApp } from "../v1/_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const { dz, app, error } = await requireDeezerAndApp(request);
		if (error) return error;

		const { uuid } = await request.json();

		if (!uuid) {
			return fail("MISSING_UUID", "Download UUID is required.", 400);
		}

		const queueItem = app.queue[uuid];
		if (!queueItem) {
			return fail("NOT_FOUND", "Item not found in queue.", 404);
		}

		// Remove the failed item and re-add it
		app.cancelDownload(uuid);

		// Re-queue using the original link info
		const url = queueItem.url || `https://www.deezer.com/${queueItem.__type__ === "Single" ? "track" : "album"}/${queueItem.id}`;
		const result = await app.addToQueue(dz, [url], queueItem.bitrate, true);

		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}
