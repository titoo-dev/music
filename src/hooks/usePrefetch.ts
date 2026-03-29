"use client";

import { useEffect, useRef } from "react";
import { prefetchTracks } from "@/lib/audio-cache";

/**
 * Prefetches audio for a list of tracks into IndexedDB cache.
 * Designed for playlist/album pages — when the user views a track list,
 * we proactively cache audio so playback starts instantly.
 *
 * Features:
 * - Debounced: waits 1.5s after mount before starting (avoids prefetch on quick navigation)
 * - Aborts on unmount (won't cache tracks for a page the user left)
 * - Concurrency-limited to avoid bandwidth saturation
 * - Skips already-cached tracks automatically
 */
export function usePrefetch(trackIds: string[], enabled: boolean = true) {
	const abortRef = useRef<AbortController | null>(null);
	const trackKey = trackIds.join(",");

	useEffect(() => {
		if (!enabled || trackIds.length === 0) return;

		// Debounce: wait before starting prefetch (user might just be browsing)
		const timer = setTimeout(() => {
			abortRef.current = new AbortController();
			const signal = abortRef.current.signal;

			// Prefetch with low concurrency to avoid saturating bandwidth
			(async () => {
				// Filter to reasonable batch (first 20 tracks max)
				const batch = trackIds.slice(0, 20);
				for (let i = 0; i < batch.length; i += 2) {
					if (signal.aborted) return;
					const chunk = batch.slice(i, i + 2);
					await prefetchTracks(chunk, 2);
				}
			})();
		}, 1500);

		return () => {
			clearTimeout(timer);
			abortRef.current?.abort();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [trackKey, enabled]);
}
