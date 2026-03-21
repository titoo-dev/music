"use client";

import { useCallback, useState } from "react";
import { postToServer } from "@/utils/api";
import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Hook for triggering downloads with loading state and direct store updates.
 * Does NOT depend on WebSocket for UI feedback — uses the API response directly.
 */
export function useDownload() {
	const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
	const addToQueue = useQueueStore((s) => s.addToQueue);

	const download = useCallback(
		async (url: string, bitrate?: number | null) => {
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
				// Open the download sheet for visual feedback
				useAppStore.getState().setDownloadsOpen(true);
			} catch (e) {
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
