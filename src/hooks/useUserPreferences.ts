"use client";

// Réactif via Convex (Phase 5) : useQuery souscrit aux préférences de
// l'utilisateur courant (auth Convex) et se met à jour en temps réel ; plus de
// polling/fetch. Voir docs/CONVEX_MIGRATION.md.

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { UserPrefsData } from "@/app/api/v1/preferences/route";

export function useUserPreferences() {
	const data = useQuery(api.preferences.getMine);
	const prefs = (data ?? {}) as UserPrefsData;
	const setMine = useMutation(api.preferences.setMine);

	const updatePrefs = useCallback(
		async (updates: Partial<UserPrefsData>) => {
			await setMine({ preferences: { ...prefs, ...updates } });
		},
		[setMine, prefs],
	);

	return { prefs, updatePrefs };
}
