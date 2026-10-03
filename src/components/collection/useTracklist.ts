"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";

export type TracklistStatus = "loading" | "ready" | "missing";

/**
 * Loads `content/tracklist` for an album / artist / playlist and parses it.
 * The status is derived from which id the last result belongs to, so a new
 * id shows "loading" straight away (no synchronous setState in the effect).
 */
export function useTracklist<T>(type: "album" | "artist" | "playlist", id: string | null, parse: (data: unknown, id: string) => T | null) {
	const [result, setResult] = useState<{ id: string; page: T | null } | null>(null);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		fetchData("content/tracklist", { id, type })
			.then((data) => !cancelled && setResult({ id, page: parse(data, id) }))
			.catch(() => !cancelled && setResult({ id, page: null }));
		return () => {
			cancelled = true;
		};
		// `parse` is a module-level function; refetch only when the target changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type, id]);

	const page = id && result?.id === id ? result.page : null;
	const status: TracklistStatus = !id ? "missing" : result?.id !== id ? "loading" : page ? "ready" : "missing";
	return { page, status };
}
