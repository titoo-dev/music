"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserPrefsData } from "@/app/api/v1/preferences/route";

export function useUserPreferences() {
	const [prefs, setPrefs] = useState<UserPrefsData>({});
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	useEffect(() => {
		if (!isAuthenticated) return;
		fetch("/api/v1/preferences")
			.then((r) => r.json())
			.then((json) => {
				if (json.success) setPrefs(json.data);
			})
			.catch(() => {});
	}, [isAuthenticated]);

	const updatePrefs = useCallback(async (updates: Partial<UserPrefsData>) => {
		setPrefs((prev) => ({ ...prev, ...updates }));
		await fetch("/api/v1/preferences", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
	}, []);

	return { prefs, updatePrefs };
}
