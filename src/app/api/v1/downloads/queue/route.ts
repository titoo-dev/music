import { NextRequest } from "next/server";
import { ok, fail, handleError, requireAuth, requireApp, requireAuthAndApp } from "../../_lib/helpers";

// GET /api/v1/downloads/queue — Fetch current download queue
export async function GET() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		return ok(app.getQueue());
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/downloads/queue — Add URL(s) to download queue
export async function POST(request: NextRequest) {
	try {
		const { dz, app, error } = await requireAuthAndApp();
		if (error) return error;

		const { url, bitrate } = await request.json();

		if (!url) {
			return fail("MISSING_URL", "A URL or array of URLs is required.", 400);
		}

		const effectiveBitrate = bitrate ?? app.settings.maxBitrate;
		const urls = Array.isArray(url) ? url : [url];

		const result = await app.addToQueue(dz, urls, effectiveBitrate);
		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}
