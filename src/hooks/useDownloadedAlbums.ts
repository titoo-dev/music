"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

interface SavedAlbum {
	id: string;
	deezerAlbumId: string;
}

/**
 * Returns a Map of `deezerAlbumId → internal Album.id` for the user's
 * saved albums. Used to route "Saved" badges + "Open library album" links.
 */
export function useDownloadedAlbums() {
	const [albumMap, setAlbumMap] = useState<Map<string, string>>(new Map());
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const refresh = useCallback(async () => {
		try {
			const res = await fetch("/api/v1/library/albums", { credentials: "include" });
			if (!res.ok) return;
			const json = await res.json();
			const items = (json?.data?.items as SavedAlbum[] | undefined) || [];
			const map = new Map<string, string>();
			for (const a of items) {
				map.set(String(a.deezerAlbumId), String(a.id));
			}
			setAlbumMap(map);
		} catch {
			// ignore
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated) refresh();
	}, [isAuthenticated, refresh]);

	return { albumMap, refresh };
}
