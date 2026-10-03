import type { LyricsResult } from "./resolve";

// Per-instance memo of lookups (Fluid compute reuses instances), so replaying a
// track or reopening the lyrics panel doesn't hit LRCLIB again. Misses expire
// quickly so a newly published LRCLIB entry shows up the same day.
const HIT_TTL_MS = 12 * 60 * 60 * 1000;
const MISS_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 500;

const entries = new Map<string, { value: LyricsResult; expires: number }>();

export function getCachedLyrics(key: string, now = Date.now()): LyricsResult | null {
	const e = entries.get(key);
	if (!e) return null;
	if (e.expires <= now) {
		entries.delete(key);
		return null;
	}
	// Refresh LRU position.
	entries.delete(key);
	entries.set(key, e);
	return e.value;
}

export function setCachedLyrics(key: string, value: LyricsResult, now = Date.now()): void {
	const found = !!(value.syncedLyrics || value.plainLyrics || value.instrumental);
	entries.delete(key);
	entries.set(key, { value, expires: now + (found ? HIT_TTL_MS : MISS_TTL_MS) });
	while (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value!);
}

export function clearLyricsCache(): void {
	entries.clear();
}
