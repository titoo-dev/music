"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Hook that batch-checks which track IDs have already been downloaded.
 * Returns a Set of downloaded track IDs.
 */
export function useDownloadedTracks(trackIds: string[]) {
	const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	useEffect(() => {
		if (!isAuthenticated || trackIds.length === 0) return;

		const uniqueIds = [...new Set(trackIds.filter(Boolean))];
		if (uniqueIds.length === 0) return;

		async function check() {
			try {
				const res = await fetch("/api/v1/downloads/check-batch", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ trackIds: uniqueIds }),
				});
				if (!res.ok) return;
				const json = await res.json();
				const map = json.data?.downloaded || {};
				setDownloaded(new Set(Object.keys(map)));
			} catch {
				// ignore
			}
		}

		check();
	}, [trackIds.join(","), isAuthenticated]);

	const markDownloaded = useCallback((trackId: string) => {
		setDownloaded((prev) => new Set(prev).add(trackId));
	}, []);

	return { downloaded, markDownloaded };
}
