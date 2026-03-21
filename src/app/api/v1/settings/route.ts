import { NextRequest } from "next/server";
import { ok, handleError, requireApp } from "../_lib/helpers";

// GET /api/v1/settings — Get current settings
export async function GET() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		return ok(app.getSettings());
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/settings — Update settings
export async function POST(request: NextRequest) {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		const { settings, spotifySettings } = await request.json();

		app.saveSettings(settings, spotifySettings);
		return ok(app.getSettings());
	} catch (e) {
		return handleError(e);
	}
}
