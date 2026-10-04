"use client";

import { useEffect } from "react";
import { prefetchTracks } from "@/lib/audio-cache";
import { PREFETCH_LIMIT, shouldPrefetchAudio } from "@/lib/prefetch-budget";
import { cachedSourceResolver } from "@/components/audio/engine/prefetch";

/**
 * Prefetches audio for the first tracks of a list into IndexedDB cache.
 * Designed for playlist/album pages — when the user views a track list,
 * we proactively cache audio so playback starts instantly.
 *
 * Features:
 * - Only tracks the server already cached, read from R2: a page view never
 *   makes the server download and store a track nobody played
 * - Capped at PREFETCH_LIMIT tracks: every prefetch is a storage request,
 *   so a long playlist is never downloaded wholesale
 * - Debounced: waits 1.5s after mount before starting (avoids prefetch on quick navigation)
 * - Aborts on unmount, mid-download (won't cache tracks for a page the user left)
 * - Skipped on Save-Data / 2G
 * - Concurrency-limited to avoid bandwidth saturation
 * - Skips already-cached tracks automatically
 */
export function usePrefetch(trackIds: string[], enabled: boolean = true) {
	const batch = trackIds.slice(0, PREFETCH_LIMIT);
	const trackKey = batch.join(",");

	useEffect(() => {
		const ids = trackKey ? trackKey.split(",") : [];
		if (!enabled || ids.length === 0) return;
		const controller = new AbortController();

		// Debounce: wait before starting prefetch (user might just be browsing)
		const timer = setTimeout(() => {
			if (!shouldPrefetchAudio()) return;
			void prefetchTracks(ids, 2, { signal: controller.signal, resolveSource: cachedSourceResolver });
		}, 1500);

		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [trackKey, enabled]);
}
