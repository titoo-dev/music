import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../_lib/helpers";

export interface UserPrefsData {
	playlistSortOrder?: "asc" | "desc";
	albumSortOrder?: "asc" | "desc";
}

// GET /api/v1/preferences
export async function GET(request: NextRequest) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const record = await prisma.userPreferences.findUnique({
			where: { userId },
		});

		return ok<UserPrefsData>((record?.preferences as UserPrefsData) ?? {});
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

		const allowed: (keyof UserPrefsData)[] = ["playlistSortOrder", "albumSortOrder"];
		for (const key of Object.keys(updates) as (keyof UserPrefsData)[]) {
			if (!allowed.includes(key)) return fail("INVALID_KEY", `Unknown preference key: ${key}`);
		}

		const existing = await prisma.userPreferences.findUnique({ where: { userId } });
		const merged = { ...((existing?.preferences as object) ?? {}), ...updates };

		const record = await prisma.userPreferences.upsert({
			where: { userId },
			update: { preferences: merged },
			create: { userId, preferences: merged },
		});

		return ok<UserPrefsData>(record.preferences as UserPrefsData);
	} catch (e) {
		return handleError(e);
	}
}
