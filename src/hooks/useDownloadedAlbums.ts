"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchData } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Hook that fetches the user's downloaded albums.
 * Returns a Map of deezerAlbumId → internal album id for lookup and routing.
 */
export function useDownloadedAlbums() {
	const [albumMap, setAlbumMap] = useState<Map<string, string>>(new Map());
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const refresh = useCallback(async () => {
		try {
			const albums = await fetchData("albums");
			const map = new Map<string, string>();
			for (const a of albums || []) {
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
