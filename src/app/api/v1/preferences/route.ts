import { NextRequest } from "next/server";
import {
	getUserPreferences,
	upsertUserPreferences,
} from "@/lib/repositories/userPreferences";
import { ok, fail, handleError, requireUser } from "../_lib/helpers";

export interface UserPrefsData {
	playlistSortOrder?: "asc" | "desc";
	albumSortOrder?: "asc" | "desc";
	/** When true, saving a track/album triggers a background fetch to warm
	 *  the S3 cache so the first play is instant. Off by default. */
	preCacheSaved?: boolean;
}

// GET /api/v1/preferences
export async function GET(request: NextRequest) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const prefs = await getUserPreferences(userId);

		return ok<UserPrefsData>((prefs as UserPrefsData) ?? {});
	} catch (e) {
		return handleError(e);
	}
}

// PATCH /api/v1/preferences
export async function PATCH(request: NextRequest) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const updates: Partial<UserPrefsData> = await request.json();

		const allowed: (keyof UserPrefsData)[] = [
			"playlistSortOrder",
			"albumSortOrder",
			"preCacheSaved",
		];
		for (const key of Object.keys(updates) as (keyof UserPrefsData)[]) {
			if (!allowed.includes(key)) return fail("INVALID_KEY", `Unknown preference key: ${key}`);
		}

		const existing = await getUserPreferences(userId);
		const merged = { ...((existing as object) ?? {}), ...updates };

		const saved = await upsertUserPreferences(userId, merged);

		return ok<UserPrefsData>(saved as UserPrefsData);
	} catch (e) {
		return handleError(e);
	}
}
