import { NextRequest } from "next/server";
import { TrackFormats } from "@/lib/deezer/types";
import { ok, fail, handleError, requireApp, requireUser } from "../../_lib/helpers";

/** MP3 128 (data saver), MP3 320 (high), FLAC (lossless). */
const BITRATES: readonly number[] = [TrackFormats.MP3_128, TrackFormats.MP3_320, TrackFormats.FLAC];

// GET /api/v1/settings/quality — the server-wide streaming quality (`maxBitrate`)
export async function GET() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;
		const { maxBitrate } = await app.freshSettings();
		return ok({ maxBitrate });
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/settings/quality — change it for every listener. Body: { maxBitrate: 1 | 3 | 9 }
export async function POST(request: NextRequest) {
	try {
		const { error: userError } = await requireUser(request);
		if (userError) return userError;
		const { app, error } = await requireApp();
		if (error) return error;

		let body: { maxBitrate?: unknown };
		try {
			body = await request.json();
		} catch {
			return fail("INVALID_BODY", "Expected a JSON body.", 400);
		}
		const maxBitrate = body?.maxBitrate;
		if (typeof maxBitrate !== "number" || !BITRATES.includes(maxBitrate)) {
			return fail("INVALID_BITRATE", `maxBitrate must be one of ${BITRATES.join(", ")}.`, 400);
		}

		// Re-read first: another instance may have saved newer settings since this one loaded them.
		const current = await app.freshSettings(0);
		await app.saveSettings({ ...current, maxBitrate });
		return ok({ maxBitrate });
	} catch (e) {
		return handleError(e);
	}
}
