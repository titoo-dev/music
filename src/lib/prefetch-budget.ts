/**
 * Caps on how much audio the client fetches ahead of playback.
 *
 * Every prefetch is a request against object storage (R2) — warming a whole
 * 200-track playlist on page load, or head-prefetching every row as the
 * user scrolls, burns requests for tracks that will never be played. All
 * prefetch paths (IndexedDB cache, in-memory <audio> pools, scroll-driven
 * head prefetch) share this one limit.
 */
export const PREFETCH_LIMIT = 5;

/**
 * Track ids to prefetch around the current queue position: upcoming tracks
 * first (most likely next), then the previous one (for "back"), never more
 * than `limit` in total.
 */
export function queuePrefetchWindow(
	queue: ReadonlyArray<{ trackId: string }>,
	queueIndex: number,
	limit: number = PREFETCH_LIMIT
): string[] {
	if (limit <= 0 || queue.length === 0) return [];
	const hasPrev = queueIndex - 1 >= 0 && queueIndex - 1 < queue.length;
	// Keep one slot for the previous track, unless the limit is a single slot.
	const ahead = hasPrev && limit > 1 ? limit - 1 : limit;

	const ids: string[] = [];
	for (let i = 1; i <= ahead && queueIndex + i < queue.length; i++) {
		ids.push(queue[queueIndex + i].trackId);
	}
	if (hasPrev && ids.length < limit) ids.push(queue[queueIndex - 1].trackId);
	return ids;
}

/** Structural subset of navigator.connection (Network Information API). */
export interface NetworkInfoLike {
	saveData?: boolean;
	effectiveType?: string;
}

/**
 * May the client fetch audio it hasn't been asked to play yet? Not on
 * Save-Data, not on 2G-class links. Every background prefetch path (page
 * prefetch, queue prefetch, in-memory preloads, the IndexedDB fill of the
 * playing track) checks this first.
 */
export function shouldPrefetchAudio(
	nav: { connection?: NetworkInfoLike } | null = typeof navigator === "undefined"
		? null
		: (navigator as Navigator & { connection?: NetworkInfoLike })
): boolean {
	if (!nav) return false;
	const conn = nav.connection;
	if (conn) {
		if (conn.saveData) return false;
		const eff = conn.effectiveType;
		if (eff && eff.includes("2g")) return false;
	}
	return true;
}

/**
 * A per-scope allowance for opportunistic prefetches (rows scrolling into
 * view). Each scope — the current page — gets `limit` takes; moving to a
 * new scope refills it. Re-taking an id already granted in the scope is
 * free, so a row that re-mounts (virtualized lists) doesn't eat budget.
 */
export function createPrefetchBudget(limit: number = PREFETCH_LIMIT) {
	let scope: string | null = null;
	const granted = new Set<string>();

	return {
		take(id: string, currentScope: string): boolean {
			if (currentScope !== scope) {
				scope = currentScope;
				granted.clear();
			}
			if (granted.has(id)) return true;
			if (granted.size >= limit) return false;
			granted.add(id);
			return true;
		},
	};
}
