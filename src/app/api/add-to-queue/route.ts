import { NextRequest } from "next/server";
import { ok, fail, handleError, requireDeezerAndApp } from "../v1/_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const { dz, app, error } = await requireDeezerAndApp(request);
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
