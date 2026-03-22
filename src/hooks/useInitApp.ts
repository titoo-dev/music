"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { fetchData } from "@/utils/api";

export function useInitApp() {
	const [initialized, setInitialized] = useState(false);
	const setDeezerAvailable = useAppStore((s) => s.setDeezerAvailable);
	const setSpotifyEnabled = useAppStore((s) => s.setSpotifyEnabled);
	const { setUser, setDeezerUser, setChilds, setLoading } = useAuthStore();

	useEffect(() => {
		if (initialized) return;

		async function init() {
			try {
				const data = await fetchData("auth/connect");

				if (data.deezerAvailable) {
					setDeezerAvailable(data.deezerAvailable);
				}
				if (data.spotifyEnabled !== undefined) {
					setSpotifyEnabled(data.spotifyEnabled);
				}

				// Better-auth user (Google identity)
				if (data.user) {
					setUser(data.user);
				}

				// Deezer connection (auto-restored from stored ARL)
				if (data.deezerUser) {
					setDeezerUser(data.deezerUser);
				}
			} catch (e) {
				console.error("Failed to connect:", e);
			}
			setLoading(false);
			setInitialized(true);
		}

		init();
	}, [initialized]);
}
