// Repository userPreferences — Convex (Postgres supprimé, Phase 6).

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

type Prefs = Record<string, unknown>;

export async function getUserPreferences(userId: string): Promise<Prefs | null> {
	const value = await getConvexClient().query(api.preferences.get, { userId });
	return (value as Prefs) ?? null;
}

/** Écrit les préférences (objet complet) et renvoie la valeur stockée. */
export async function upsertUserPreferences(
	userId: string,
	prefs: Prefs,
): Promise<Prefs> {
	await getConvexClient().mutation(api.preferences.set, {
		userId,
		preferences: prefs,
	});
	return prefs;
}
