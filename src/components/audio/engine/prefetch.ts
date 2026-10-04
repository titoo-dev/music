// Everything the player fetches before it is asked to play: warmed rows,
// hover / head previews, the queue's next and previous track, the IndexedDB
// fill. Rule: a prefetch never makes the server persist a track — only a
// real play does. Cached tracks are fetched from their presigned R2 URL (or
// the /api/v1/stream proxy); uncached ones only through the non-persisting
// preview stream (/stream-progressive?preview=1).

import {
	getCachedBlobUrl,
	prefetchTrack,
	type ResolveCachedSource,
} from "@/lib/audio-cache";
import {
	PREFETCH_LIMIT,
	createPrefetchBudget,
	queuePrefetchWindow,
	shouldPrefetchAudio,
} from "@/lib/prefetch-budget";
import { isRangelessSource } from "@/lib/seek";
import { releaseElement } from "@/utils/audio-context";
import { presignedUrls, progressiveUrl, resolveCachedSource } from "./presigned-urls";
import { resolvePlaybackUrl } from "./source";

/** Elements dropped from a pool or from playback: late async work must not touch them. */
export const evictedAudio = new WeakSet<HTMLAudioElement>();

export function createAudioElement(): HTMLAudioElement {
	const audio = new Audio();
	audio.preload = "auto";
	audio.crossOrigin = "anonymous";
	return audio;
}

/**
 * Stop an element for good: no more network, its Web Audio nodes
 * disconnected, and late async work (evictedAudio) leaves it alone.
 */
export function discardElement(audio: HTMLAudioElement) {
	evictedAudio.add(audio);
	try {
		audio.pause();
	} catch {}
	audio.src = "";
	releaseElement(audio);
}

const retire = discardElement;

/** The IndexedDB / page prefetch resolver: a cached copy or nothing. */
export const cachedSourceResolver: ResolveCachedSource = (trackId, signal) =>
	resolveCachedSource(trackId, { signal });

// --- Warm levels --------------------------------------------------------
// Three intensity levels, all funneled through warmTrack({ audio }):
//
//   "none"    metadata-only via /api/v1/stream-warm (~200 byte response).
//             Used when bandwidth is constrained (saveData / 2G) or the
//             caller doesn't want any audio bytes to flow.
//
//   "head"    /stream-progressive?preview=1&head=1 — server caps the response
//             at ~64 KB. Light enough to apply to every visible item in a
//             list; the element reaches canplay so a click plays instantly
//             while AudioEngine hands off to the full stream.
//
//   "full"    /stream-progressive?preview=1 — browser-managed full buffer.
//             Used on hover, where intent is stronger.
const warmedAt = new Map<string, "none" | "head" | "full">();
const warmInflight = new Set<string>();

const hoverPreloadCache = new Map<string, HTMLAudioElement>();
const MAX_HOVER_PRELOADED = 3;
// Visibility-driven head prefetch: capped like the other pools and budgeted
// per page so scrolling a long playlist doesn't head-prefetch every row.
const headPreloadCache = new Map<string, HTMLAudioElement>();
const MAX_HEAD_PRELOADED = PREFETCH_LIMIT;
const headBudget = createPrefetchBudget();
// Tracks whose prefetched element is head-capped (ends after ~64 KB): on
// play, AudioEngine switches to the full stream before the head runs out.
const headPrefetchedTracks = new Set<string>();

// Queue preloads (next / previous track, first rows of a playlist).
const preloadCache = new Map<string, HTMLAudioElement>();
const MAX_PRELOADED = PREFETCH_LIMIT;
const preloadPending = new Set<string>();
// Tracks found uncached by a cached-only preload: not re-asked for a while
// (the 50 %-progress trigger calls preloadTrack on every timeupdate).
const preloadMisses = new Map<string, number>();
const MISS_TTL_MS = 60_000;

function evictFrom(cache: Map<string, HTMLAudioElement>, max: number) {
	if (cache.size < max) return;
	const oldest = cache.keys().next().value!;
	retire(cache.get(oldest)!);
	cache.delete(oldest);
	if (cache === headPreloadCache) headPrefetchedTracks.delete(oldest);
}

function preloadAudio(trackId: string, mode: "head" | "full") {
	const cache = mode === "head" ? headPreloadCache : hoverPreloadCache;
	const max = mode === "head" ? MAX_HEAD_PRELOADED : MAX_HOVER_PRELOADED;

	if (cache.has(trackId)) return;
	// If already prefetched at a stronger level, keep that one
	if (mode === "head" && hoverPreloadCache.has(trackId)) return;
	if (preloadCache.has(trackId)) return;

	// Upgrade from head → full: discard the lighter head element so we don't
	// hold two prefetched streams.
	if (mode === "full") {
		const headElem = headPreloadCache.get(trackId);
		if (headElem) {
			retire(headElem);
			headPreloadCache.delete(trackId);
			headPrefetchedTracks.delete(trackId);
		}
	}

	evictFrom(cache, max);

	const audio = createAudioElement();
	cache.set(trackId, audio);
	if (mode === "head") headPrefetchedTracks.add(trackId);

	void (async () => {
		try {
			const blobUrl = await getCachedBlobUrl(trackId).catch(() => null);
			if (evictedAudio.has(audio)) return;
			if (blobUrl) {
				audio.src = blobUrl;
				audio.load();
				headPrefetchedTracks.delete(trackId);
				return;
			}
			const presigned = await presignedUrls.get(trackId);
			if (evictedAudio.has(audio)) return;
			if (presigned) {
				audio.src = presigned;
				audio.load();
				headPrefetchedTracks.delete(trackId);
				return;
			}
			audio.src = progressiveUrl(trackId, { preview: true, head: mode === "head" });
			audio.load();
		} catch {
			// Best-effort
		}
	})();
}

export interface WarmOptions {
	/** "none" = metadata only, "head" = first ~3s, "full" = browser-managed buffer */
	audio?: "none" | "head" | "full";
}

export function warmTrack(trackId: string, opts: WarmOptions = {}) {
	if (typeof window === "undefined") return;
	const audio = opts.audio ?? "full";
	const desired = shouldPrefetchAudio() ? audio : "none";

	const prevLevel = warmedAt.get(trackId);
	const rank = { none: 0, head: 1, full: 2 } as const;
	// Skip if we already prefetched at the same or stronger level
	if (prevLevel && rank[prevLevel] >= rank[desired]) return;

	// Head prefetch is opportunistic (a row scrolled into view): only the
	// first PREFETCH_LIMIT rows per page get one. Hover isn't budgeted.
	if (desired === "head" && !headBudget.take(trackId, window.location.pathname)) return;

	// Metadata warm — only the first time we touch this track
	if (!prevLevel && !warmInflight.has(trackId)) {
		warmInflight.add(trackId);
		fetch(`/api/v1/stream-warm/${trackId}`, { credentials: "include" })
			.catch(() => {})
			.finally(() => {
				warmInflight.delete(trackId);
			});
	}

	warmedAt.set(trackId, desired);
	if (desired === "head" || desired === "full") {
		preloadAudio(trackId, desired);
	}
}

/**
 * Preload a track into the in-memory pool (next / previous in the queue,
 * first rows of a playlist). A cached copy (IndexedDB blob, presigned URL)
 * is preloaded right away. An uncached track is only preloaded with
 * `live: true` — AudioEngine asks for that in the last seconds of the
 * current track — and then through the non-persisting preview stream (was:
 * every preload opened the persisting stream: a full server download,
 * decrypt, tag and upload for tracks that were never played).
 */
export function preloadTrack(trackId: string, opts: { live?: boolean } = {}) {
	if (typeof window === "undefined") return;
	if (preloadCache.has(trackId) || preloadPending.has(trackId)) return;
	if (!shouldPrefetchAudio()) return;
	const missAt = preloadMisses.get(trackId);
	if (!opts.live && missAt !== undefined && Date.now() - missAt < MISS_TTL_MS) return;

	preloadPending.add(trackId);
	void (async () => {
		try {
			const url = await resolvePlaybackUrl(trackId, {
				urls: presignedUrls,
				blobUrl: getCachedBlobUrl,
				pageProtocol: window.location.protocol,
				persist: false,
			});
			if (isRangelessSource(url) && !opts.live) {
				preloadMisses.set(trackId, Date.now());
				return;
			}
			if (preloadCache.has(trackId)) return;
			evictFrom(preloadCache, MAX_PRELOADED);
			const audio = createAudioElement();
			preloadCache.set(trackId, audio);
			audio.src = url;
			audio.load();
		} catch {
			// Best-effort
		} finally {
			preloadPending.delete(trackId);
		}
	})();
}

/** The queue preload of a track, if any (crossfade needs it fully buffered). */
export function queuePreloaded(trackId: string): HTMLAudioElement | null {
	return preloadCache.get(trackId) ?? null;
}

/**
 * Take the best prefetched element for a track out of the pools, in order
 * of buffer richness: queue preload, hover preload, head preload. `head`
 * says it ends after ~64 KB and needs the full-stream handoff. The other
 * pools' elements for the same track are stopped, not left loading.
 */
export function takePreloaded(trackId: string): { audio: HTMLAudioElement; head: boolean } | null {
	const candidates = [preloadCache.get(trackId), hoverPreloadCache.get(trackId), headPreloadCache.get(trackId)];
	const audio = candidates.find(Boolean);
	if (!audio) return null;
	const head = audio === headPreloadCache.get(trackId) && headPrefetchedTracks.has(trackId);
	for (const other of candidates) if (other && other !== audio) retire(other);
	preloadCache.delete(trackId);
	hoverPreloadCache.delete(trackId);
	headPreloadCache.delete(trackId);
	headPrefetchedTracks.delete(trackId);
	return { audio, head };
}

// --- Background IndexedDB fills -----------------------------------------

let queueAbort: AbortController | null = null;
const backgroundFills = new Set<AbortController>();

/**
 * Fill IndexedDB with the tracks around the queue cursor — only those the
 * server already cached, fetched from R2, abortable, and not at all on
 * Save-Data / 2G. Each call cancels the previous batch.
 */
export function smartPrefetchQueue(queue: ReadonlyArray<{ trackId: string }>, queueIndex: number) {
	queueAbort?.abort();
	queueAbort = new AbortController();
	const signal = queueAbort.signal;
	if (queue.length === 0 || !shouldPrefetchAudio()) return;
	const ids = queuePrefetchWindow(queue, queueIndex);
	void (async () => {
		for (const trackId of ids) {
			if (signal.aborted) return;
			await prefetchTrack(trackId, { signal, resolveSource: cachedSourceResolver });
		}
	})();
}

const presignedOnly: ResolveCachedSource = async (trackId) => {
	const url = await presignedUrls.get(trackId);
	return url ? { url, kind: "presigned" } : null;
};

/**
 * Keep a track that was really listened to (30 s) in IndexedDB. Read from
 * its presigned R2 URL — never through the /api/v1/stream proxy, which made
 * every played track cross the server twice — and skipped when the track
 * isn't cached server-side yet or the network is constrained.
 */
export function cacheListenedTrack(trackId: string): Promise<boolean> {
	if (!shouldPrefetchAudio()) return Promise.resolve(false);
	const ctl = new AbortController();
	backgroundFills.add(ctl);
	return prefetchTrack(trackId, { signal: ctl.signal, resolveSource: presignedOnly }).finally(() =>
		backgroundFills.delete(ctl)
	);
}

/**
 * Preview streams (hover / head / live queue preload) aren't persisted by
 * the server. For the track that is actually playing from one, open a real
 * progressive stream and hang up right away: the server's persist branch
 * runs to completion on its own, so the next play hits the stored file.
 */
export function persistInBackground(trackId: string) {
	fetch(progressiveUrl(trackId), { credentials: "include" })
		.then((res) => {
			res.body?.cancel().catch(() => {});
		})
		.catch(() => {});
}

/** Stop every prefetched element and background fill (AudioEngine unmount). */
export function disposePrefetchPools() {
	for (const pool of [preloadCache, hoverPreloadCache, headPreloadCache]) {
		for (const audio of pool.values()) retire(audio);
		pool.clear();
	}
	headPrefetchedTracks.clear();
	preloadPending.clear();
	queueAbort?.abort();
	queueAbort = null;
	for (const ctl of backgroundFills) ctl.abort();
	backgroundFills.clear();
}

/**
 * Forget everything learnt during this sign-in (sign-out / account switch):
 * pools, warm levels, "not cached" verdicts. The next user starts cold
 * (was: module state outlived the session that filled it).
 */
export function resetPrefetchState() {
	disposePrefetchPools();
	warmedAt.clear();
	warmInflight.clear();
	preloadMisses.clear();
}

/** Has warmTrack() already handled this track (any level)? */
export function warmLevel(trackId: string): "none" | "head" | "full" | null {
	return warmedAt.get(trackId) ?? null;
}
