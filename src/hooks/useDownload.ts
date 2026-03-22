"use client";

import { useCallback, useState } from "react";
import { postToServer } from "@/utils/api";
import { useQueueStore } from "@/stores/useQueueStore";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Hook for triggering downloads with loading state and direct store updates.
 * Gates downloads behind authentication + Deezer connection.
 */
export function useDownload() {
	const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
	const addToQueue = useQueueStore((s) => s.addToQueue);

	const download = useCallback(
		async (url: string, bitrate?: number | null) => {
			const { isAuthenticated, isDeezerConnected } = useAuthStore.getState();

			if (!isAuthenticated) {
				window.location.href = "/login";
				return;
			}

			if (!isDeezerConnected) {
				window.location.href = "/settings";
				return;
			}

			setLoadingUrls((prev) => new Set(prev).add(url));
			try {
				const res = await postToServer("downloads/queue", {
					url,
					bitrate: bitrate ?? null,
				});
				// Directly update the store from the API response (WS-independent)
				if (res) {
					const items = Array.isArray(res)
						? res
						: [res];
					items.forEach((item: any) => addToQueue(item));
				}
			} catch (e: any) {
				// Handle specific auth errors
				if (e.code === "NOT_AUTHENTICATED") {
					window.location.href = "/login";
					return;
				}
				if (e.code === "NO_DEEZER_ARL") {
					window.location.href = "/settings";
					return;
				}
				console.error("[Download] Failed:", e);
			} finally {
				setLoadingUrls((prev) => {
					const next = new Set(prev);
					next.delete(url);
					return next;
				});
			}
		},
		[addToQueue]
	);

	const isLoading = useCallback(
		(url: string) => loadingUrls.has(url),
		[loadingUrls]
	);

	return { download, isLoading };
}
