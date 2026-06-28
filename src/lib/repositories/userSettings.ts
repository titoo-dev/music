// Repository userSettings — Convex (Postgres supprimé, Phase 6).

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

type Settings = Record<string, unknown>;

export async function getUserSettings(userId: string): Promise<Settings | null> {
	const value = await getConvexClient().query(api.settings.get, { userId });
	return (value as Settings) ?? null;
}

export async function upsertUserSettings(
	userId: string,
	settings: Settings,
): Promise<void> {
	await getConvexClient().mutation(api.settings.set, { userId, settings });
}
