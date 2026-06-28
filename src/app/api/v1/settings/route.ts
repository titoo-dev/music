import { NextRequest } from "next/server";
import { getUserSettings, upsertUserSettings } from "@/lib/repositories/userSettings";
import { ok, handleError, requireApp, requireUser } from "../_lib/helpers";

// GET /api/v1/settings — Get settings (per-user if authenticated, defaults otherwise)
export async function GET(request: NextRequest) {
	try {
		const { app, error: appError } = await requireApp();
		if (appError) return appError;

		const globalSettings = app.getSettings();

		// Try to get per-user settings if authenticated
		const userResult = await requireUser(request);
		if (!userResult.error) {
			const userSettings = await getUserSettings(userResult.userId);
			if (userSettings) {
				return ok({
					settings: {
						...globalSettings.settings,
						...userSettings,
					},
					defaultSettings: globalSettings.defaultSettings,
					spotifySettings: globalSettings.spotifySettings,
				});
			}
		}

		return ok(globalSettings);
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/settings — Save settings (per-user if authenticated, global otherwise)
export async function POST(request: NextRequest) {
	try {
		const { app, error: appError } = await requireApp();
		if (appError) return appError;

		const { settings, spotifySettings } = await request.json();

		// Save per-user settings if authenticated
		const userResult = await requireUser(request);
		if (!userResult.error) {
			await upsertUserSettings(userResult.userId, settings ?? {});
		}

		// Always save Spotify settings globally (shared plugin config)
		if (spotifySettings) {
			await app.saveSettings(app.settings, spotifySettings);
		}

		// Return the merged settings
		const globalSettings = app.getSettings();
		return ok({
			settings: settings ?? globalSettings.settings,
			defaultSettings: globalSettings.defaultSettings,
			spotifySettings: globalSettings.spotifySettings,
		});
	} catch (e) {
		return handleError(e);
	}
}
