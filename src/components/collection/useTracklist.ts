"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchData } from "@/utils/api";

export type TracklistStatus = "loading" | "ready" | "missing" | "error";

// Recently seen pages, so Back / Forward between albums and artists shows the
// page at once (and the browser can restore the scroll position) while it
// revalidates in the background.
const CACHE_MAX = 24;
const cache = new Map<string, unknown>();

function remember(key: string, page: unknown) {
	cache.delete(key);
	cache.set(key, page);
	if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
}

/** Test helper. */
export function clearTracklistCache() {
	cache.clear();
}

/**
 * Loads `content/tracklist` for an album / artist / playlist and parses it.
 * The status is derived from which id (and attempt) the last result belongs
 * to, so a new id shows "loading" straight away — or the cached page.
 * "missing" means Deezer has nothing for it; "error" means the request failed
 * (offer `retry`).
 */
export function useTracklist<T>(type: "album" | "artist" | "playlist", id: string | null, parse: (data: unknown, id: string) => T | null) {
	const key = id ? `${type}:${id}` : null;
	const [attempt, setAttempt] = useState(0);
	const [result, setResult] = useState<{ key: string; attempt: number; page: T | null; failed: boolean } | null>(null);

	useEffect(() => {
		if (!id || !key) return;
		let cancelled = false;
		fetchData("content/tracklist", { id, type })
			.then((data) => {
				if (cancelled) return;
				const page = parse(data, id);
				if (page) remember(key, page);
				setResult({ key, attempt, page, failed: false });
			})
			.catch(() => !cancelled && setResult({ key, attempt, page: null, failed: true }));
		return () => {
			cancelled = true;
		};
		// `parse` is a module-level function; refetch only when the target changes or on retry.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type, id, attempt]);

	const retry = useCallback(() => setAttempt((a) => a + 1), []);

	const fresh = key && result?.key === key && result.attempt === attempt ? result : null;
	const cached = key ? ((cache.get(key) as T | undefined) ?? null) : null;
	const page = fresh?.page ?? cached;
	const status: TracklistStatus = !key ? "missing" : page ? "ready" : !fresh ? "loading" : fresh.failed ? "error" : "missing";
	return { page, status, retry };
}
