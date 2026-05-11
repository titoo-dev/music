"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useTrackCached(trackId) — true once the track has been persisted to S3
// (StoredTrack row exists). Reused by the karaoke toggle to hide itself
// until separation is even possible: stems can only be generated from a
// cached file, so showing the toggle earlier just leads to a 409 when the
// user clicks it.
//
// Reuses /api/v1/stream-url which already exposes this signal:
//   - 200 + status="not_cached" → false
//   - 200 with anything else (presigned url, presigned_disabled,
//     unsupported_storage, file_missing) → cached
//
// Polls every 15 s while not cached so the toggle appears automatically
// once the track crosses the 30-s persistence threshold during playback.
// Stops polling as soon as cached flips true (no further checks needed —
// once cached, always cached for our purposes; eviction is per-user and
// the karaoke flow re-runs separation if files are gone).
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000;

interface UseTrackCachedOptions {
	pollIntervalMs?: number;
}

export function useTrackCached(
	trackId: string | null | undefined,
	options: UseTrackCachedOptions = {},
): boolean {
	const [cached, setCached] = useState(false);

	useEffect(() => {
		if (!trackId) {
			setCached(false);
			return;
		}

		let alive = true;
		let timer: ReturnType<typeof setTimeout> | null = null;
		const interval = options.pollIntervalMs ?? POLL_INTERVAL_MS;

		const schedule = () => {
			timer = setTimeout(() => void check(), interval);
		};

		const check = async () => {
			try {
				const res = await fetch(
					`/api/v1/stream-url/${encodeURIComponent(trackId)}`,
					{ credentials: "include", cache: "no-store" },
				);
				if (!alive) return;
				if (!res.ok) {
					schedule();
					return;
				}
				const json = (await res.json()) as {
					success?: boolean;
					data?: { status?: string };
				};
				const isCached = json?.data?.status !== "not_cached";
				setCached(isCached);
				if (!isCached) schedule();
			} catch {
				if (alive) schedule();
			}
		};

		setCached(false);
		void check();

		return () => {
			alive = false;
			if (timer) clearTimeout(timer);
		};
	}, [trackId, options.pollIntervalMs]);

	return cached;
}
