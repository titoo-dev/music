"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useLoginStore } from "@/stores/useLoginStore";
import { fetchData, postToServer } from "@/utils/api";

export function useInitApp() {
	const [initialized, setInitialized] = useState(false);
	const setDeezerAvailable = useAppStore((s) => s.setDeezerAvailable);
	const setSpotifyEnabled = useAppStore((s) => s.setSpotifyEnabled);
	const { arl, setUser, setChilds, setLoggedIn, setCurrentChild } = useLoginStore();

	useEffect(() => {
		if (initialized) return;

		async function init() {
			try {
				const data = await fetchData("connect");

				if (data.deezerAvailable) {
					setDeezerAvailable(data.deezerAvailable);
				}
				if (data.spotifyEnabled !== undefined) {
					setSpotifyEnabled(data.spotifyEnabled);
				}
				if (data.currentUser) {
					setUser(data.currentUser);
					setLoggedIn(true);
				}

				// Auto-login with stored ARL
				if (data.autologin && arl) {
					try {
						const loginRes = await postToServer("login-arl", { arl });
						if (loginRes.status === 1 || loginRes.status === 3) {
							setUser(loginRes.user);
							setChilds(loginRes.childs || []);
							setCurrentChild(loginRes.currentChild || 0);
							setLoggedIn(true);
						}
					} catch {
						// Login failed silently
					}
				}
			} catch (e) {
				console.error("Failed to connect:", e);
			}
			setInitialized(true);
		}

		init();
	}, [initialized, arl]);
}
