"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { adjustVolume } from "@/utils/adjust-volume";
import {
	initAudioCtx,
	connectAudioElement,
	isConnectedOrFailed,
	measureRms,
	applyNormGain,
	resetNormGain,
} from "@/utils/audio-context";
import {
	getCachedBlobUrl,
	prefetchTrack as cachePrefetch,
	isCached,
	cacheTrack,
	setCacheLimit,
} from "@/lib/audio-cache";

// Restore cache limit from localStorage
if (typeof window !== "undefined") {
	try {
		const saved = localStorage.getItem("deemix-cache-limit");
		if (saved) {
			const bytes = parseInt(saved, 10);
			if (!isNaN(bytes) && bytes > 0) setCacheLimit(bytes);
		}
	} catch {}
}

// --- URL Cache (for presigned URLs only) ---
const urlCache = new Map<string, { url: string; fetchedAt: number }>();
// Presigned URLs are signed for 900s (15min). We allow 14min of client reuse
// so we never hand the audio element a URL with <60s of validity left.
const URL_CACHE_TTL = 14 * 60 * 1000;
let usePresigned = true;

// Dedup in-flight presigned URL requests so prefetch + on-demand calls share one fetch
const inflightPresigned = new Map<string, Promise<string | null>>();

function pruneUrlCache() {
	const now = Date.now();
	for (const [key, val] of urlCache) {
		if (now - val.fetchedAt >= URL_CACHE_TTL) urlCache.delete(key);
	}
}

async function fetchPresignedUrl(trackId: string): Promise<string | null> {
	const cached = urlCache.get(trackId);
	if (cached && Date.now() - cached.fetchedAt < URL_CACHE_TTL) {
		return cached.url;
	}

	const existing = inflightPresigned.get(trackId);
	if (existing) return existing;

	pruneUrlCache();

	const promise = (async () => {
		try {
			const res = await fetch(`/api/v1/stream-url/${trackId}`);
			if (!res.ok) return null;
			const json = await res.json();
			const url = json.data?.url;
			if (url) {
				urlCache.set(trackId, { url, fetchedAt: Date.now() });
			}
			return url || null;
		} catch {
			return null;
		} finally {
			inflightPresigned.delete(trackId);
		}
	})();

	inflightPresigned.set(trackId, promise);
	return promise;
}

// Warm the URL cache for upcoming tracks. Cheap (one DB query + S3 sign per
// track) and turns the next click-to-play into a cache hit on the URL fetch.
function prefetchPresignedUrls(trackIds: string[]) {
	if (!usePresigned) return;
	for (const trackId of trackIds) {
		const cached = urlCache.get(trackId);
		if (cached && Date.now() - cached.fetchedAt < URL_CACHE_TTL) continue;
		if (inflightPresigned.has(trackId)) continue;
		void fetchPresignedUrl(trackId);
	}
}

/**
 * Resolve audio URL for a track. Priority:
 * 1. IndexedDB blob URL (instant, zero network)
 * 2. Presigned S3 URL (direct browser streaming for downloaded tracks)
 * 3. Progressive endpoint (live decrypts from Deezer; auto-redirects to /stream once cached)
 */
async function getTrackUrl(trackId: string): Promise<string> {
	// 1. Check IndexedDB cache — instant blob URL
	try {
		const blobUrl = await getCachedBlobUrl(trackId);
		if (blobUrl) return blobUrl;
	} catch {
		// Cache miss — continue to network
	}

	// 2. Presigned URL — only succeeds for tracks already in user's DownloadHistory
	if (usePresigned) {
		const url = await fetchPresignedUrl(trackId);
		if (url) {
			// Skip presigned URL if it would cause mixed content (HTTPS page → HTTP audio)
			if (window.location.protocol === "https:" && url.startsWith("http://")) {
				usePresigned = false;
				urlCache.clear();
				return `/api/v1/stream-progressive/${trackId}`;
			}
			return url;
		}
	}

	// 3. Progressive stream — server decides:
	//    • Already downloaded → 302 redirect to /api/v1/stream/[trackId]
	//    • Not downloaded → live stream from Deezer with parallel persistence
	return `/api/v1/stream-progressive/${trackId}`;
}

// --- Prefetch caches ---
// Three intensity levels, all funneled through warmTrack({ audio }):
//
//   "none"    metadata-only via /api/v1/stream-warm (~200 byte response).
//             Used when bandwidth is constrained (saveData / 2G) or the
//             caller doesn't want any audio bytes to flow.
//
//   "head"    /stream-progressive?preview=1&head=1 — server caps the response
//             at ~64 KB (~2-3s of audio). Light enough to apply to every
//             visible item in a list without burning megabytes; the audio
//             element reaches readyState >= 2 (canplay) so a click can play
//             instantly while we transparently swap to the full stream.
//
//   "full"    /stream-progressive?preview=1 — browser-managed full buffer
//             (~30s with preload="auto"). Used on hover, where intent is
//             stronger. Click-to-play is sub-200ms.
const warmedAt = new Map<string, "none" | "head" | "full">();
const warmInflight = new Set<string>();

const hoverPreloadCache = new Map<string, HTMLAudioElement>();
const MAX_HOVER_PRELOADED = 3;
// Larger window for visibility-driven head prefetch — bytes per slot are tiny
const headPreloadCache = new Map<string, HTMLAudioElement>();
const MAX_HEAD_PRELOADED = 8;
// Tracks whose prefetched audio element is head-capped (ends after ~64 KB).
// On swap-to-play, AudioEngine seamlessly switches to the full stream so
// playback continues past the head segment.
const headPrefetchedTracks = new Set<string>();

function shouldPrefetchAudio(): boolean {
	if (typeof navigator === "undefined") return false;
	const conn = (navigator as Navigator & {
		connection?: { saveData?: boolean; effectiveType?: string };
	}).connection;
	if (conn) {
		if (conn.saveData) return false;
		const eff = conn.effectiveType;
		if (eff && (eff.includes("2g") || eff === "slow-2g")) return false;
	}
	return true;
}

function evictFrom(
	cache: Map<string, HTMLAudioElement>,
	max: number
) {
	if (cache.size < max) return;
	const oldest = cache.keys().next().value!;
	const oldAudio = cache.get(oldest)!;
	evictedAudio.add(oldAudio);
	oldAudio.src = "";
	cache.delete(oldest);
	headPrefetchedTracks.delete(oldest);
}

function preloadAudio(trackId: string, mode: "head" | "full") {
	const cache = mode === "head" ? headPreloadCache : hoverPreloadCache;
	const max = mode === "head" ? MAX_HEAD_PRELOADED : MAX_HOVER_PRELOADED;

	if (cache.has(trackId)) return;
	// If already prefetched at a stronger level, keep that one
	if (mode === "head" && hoverPreloadCache.has(trackId)) return;
	if (preloadCache.has(trackId)) return;

	// Upgrade from head → full: discard the lighter head element so we don't
	// leak bytes / browser memory holding two prefetched streams.
	if (mode === "full") {
		const headElem = headPreloadCache.get(trackId);
		if (headElem) {
			evictedAudio.add(headElem);
			headElem.src = "";
			headPreloadCache.delete(trackId);
			headPrefetchedTracks.delete(trackId);
		}
	}

	evictFrom(cache, max);

	const audio = new Audio();
	audio.preload = "auto";
	audio.crossOrigin = "anonymous";
	cache.set(trackId, audio);
	if (mode === "head") headPrefetchedTracks.add(trackId);

	(async () => {
		try {
			const blobUrl = await getCachedBlobUrl(trackId).catch(() => null);
			if (blobUrl) {
				if (evictedAudio.has(audio)) return;
				audio.src = blobUrl;
				audio.load();
				headPrefetchedTracks.delete(trackId);
				return;
			}

			const presigned = await fetchPresignedUrl(trackId);
			if (presigned) {
				if (evictedAudio.has(audio)) return;
				audio.src = presigned;
				audio.load();
				headPrefetchedTracks.delete(trackId);
				return;
			}

			if (evictedAudio.has(audio)) return;
			audio.src =
				mode === "head"
					? `/api/v1/stream-progressive/${trackId}?preview=1&head=1`
					: `/api/v1/stream-progressive/${trackId}?preview=1`;
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

/** True if AudioEngine should transparently switch to a full stream after
 *  the prefetched head segment runs out. Cleared after the swap so future
 *  plays of the same track use whichever path is freshest. */
export function isHeadPrefetched(trackId: string): boolean {
	return headPrefetchedTracks.has(trackId);
}

export function clearHeadFlag(trackId: string) {
	headPrefetchedTracks.delete(trackId);
}

// --- Audio Preload Cache (in-memory HTMLAudioElement pool) ---
const preloadCache = new Map<string, HTMLAudioElement>();
const MAX_PRELOADED = 6;
const evictedAudio = new WeakSet<HTMLAudioElement>();

export function preloadTrack(trackId: string) {
	if (preloadCache.has(trackId)) return;

	// Evict oldest if at capacity
	if (preloadCache.size >= MAX_PRELOADED) {
		const oldest = preloadCache.keys().next().value!;
		const oldAudio = preloadCache.get(oldest)!;
		evictedAudio.add(oldAudio);
		oldAudio.src = "";
		preloadCache.delete(oldest);
	}

	const audio = new Audio();
	audio.preload = "auto";
	audio.crossOrigin = "anonymous";
	// Reserve spot immediately to prevent duplicate fetches
	preloadCache.set(trackId, audio);

	getTrackUrl(trackId).then((url) => {
		if (evictedAudio.has(audio)) return;
		audio.src = url;
		audio.load();
	});
}

// --- Smart Prefetch: background cache upcoming queue tracks ---
let prefetchAbort: AbortController | null = null;

function smartPrefetchQueue() {
	// Cancel any in-flight prefetch batch
	prefetchAbort?.abort();
	prefetchAbort = new AbortController();
	const signal = prefetchAbort.signal;

	const { queue, queueIndex } = usePlayerStore.getState();
	if (queue.length === 0) return;

	// Prefetch strategy: next 5 tracks, then previous 2
	const prefetchIds: string[] = [];

	// Next tracks (higher priority)
	for (let i = 1; i <= 5 && queueIndex + i < queue.length; i++) {
		prefetchIds.push(queue[queueIndex + i].trackId);
	}
	// Previous tracks (lower priority)
	for (let i = 1; i <= 2 && queueIndex - i >= 0; i++) {
		prefetchIds.push(queue[queueIndex - i].trackId);
	}

	// Background prefetch with concurrency=2, respecting abort
	(async () => {
		for (const trackId of prefetchIds) {
			if (signal.aborted) return;
			// Don't await all at once — stagger to avoid bandwidth saturation
			await cachePrefetch(trackId);
		}
	})();
}

/**
 * Log a "real" play (≥30s of continuous playback) so the track joins the
 * user's recently-played history. Cap-aware on the server side.
 */
async function logRecentPlay(track: {
	trackId: string;
	title: string;
	artist: string;
	cover: string | null;
	duration: number | null;
}) {
	try {
		await fetch("/api/v1/recent-plays", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				trackId: track.trackId,
				title: track.title,
				artist: track.artist,
				coverUrl: track.cover,
				duration: track.duration,
			}),
		});
	} catch {
		// Non-fatal — just a missed history entry
	}
}

/**
 * Notify the server that the user skipped a track before reaching the 30s
 * threshold so its S3 file can be evicted (if no other user listened to it).
 * The DownloadHistory metadata stays for re-streaming on a future replay.
 */
function notifyTrackSkipped(trackId: string) {
	try {
		// sendBeacon survives page unload (closing tab during a play <30s)
		const url = `/api/v1/recent-plays/${trackId}/skip`;
		if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
			navigator.sendBeacon(url);
			return;
		}
		fetch(url, { method: "POST", credentials: "include", keepalive: true }).catch(() => {});
	} catch {
		// Non-fatal
	}
}

/**
 * Cache current track after it starts playing (if not already cached).
 * This ensures every played track gets persisted to IndexedDB.
 *
 * Only runs when the track is actually downloaded (DownloadHistory exists).
 * If we hit /api/v1/stream/[id] for a non-downloaded track, it 404s. Worse,
 * it would race the in-progress /stream-progressive download. So we gate on
 * the presigned-URL endpoint first — if it returns null, the track isn't
 * cacheable yet (the progressive flow will create the DB row on completion,
 * and a future play will populate the cache).
 */
async function cacheCurrentTrackInBackground(trackId: string) {
	if (await isCached(trackId)) return;

	try {
		// Quick existence check — returns { url: null } when not yet downloaded
		const cached = urlCache.get(trackId);
		const probe =
			cached && Date.now() - cached.fetchedAt < URL_CACHE_TTL
				? { ok: true }
				: await fetch(`/api/v1/stream-url/${trackId}`, { credentials: "include" })
						.then((r) => (r.ok ? r.json() : null))
						.catch(() => null);
		const isReady = !!(cached || probe?.data?.url);
		if (!isReady) return;

		const res = await fetch(`/api/v1/stream/${trackId}`, {
			credentials: "include",
		});
		if (!res.ok) return;
		const contentType = res.headers.get("Content-Type") || "audio/mpeg";
		const blob = await res.blob();
		await cacheTrack(trackId, blob, contentType);
	} catch {
		// Non-critical
	}
}

/**
 * Drives full-track playback from S3 using imperatively managed Audio objects.
 * Pre-buffers adjacent tracks in the queue for instant playback.
 * Also manages the Media Session API for OS-level media controls.
 */
export function AudioEngine() {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const prevTrackIdRef = useRef<string | null>(null);
	// Flag to skip play/pause effect when loadTrack already handled playback
	const skipPlayEffectRef = useRef(false);
	// Generation counter to cancel stale track loads on rapid switching
	const loadGenRef = useRef(0);

	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const volume = usePlayerStore((s) => s.volume);
	const repeat = usePlayerStore((s) => s.repeat);
	const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
	const setDuration = usePlayerStore((s) => s.setDuration);
	const next = usePlayerStore((s) => s.next);
	const prev = usePlayerStore((s) => s.prev);
	const pause = usePlayerStore((s) => s.pause);
	const resume = usePlayerStore((s) => s.resume);

	const setBuffering = usePlayerStore((s) => s.setBuffering);
	const setError = usePlayerStore((s) => s.setError);
	const playbackRate = usePlayerStore((s) => s.playbackRate);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const sleepTimerEnd = usePlayerStore((s) => s.sleepTimerEnd);
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);

	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewIsPlaying = usePreviewStore((s) => s.isPlaying);

	// Error retry counter
	const retryCountRef = useRef(0);
	const MAX_RETRIES = 2;

	// Play tracking — Spotify-like 30s rule.
	// playLoggedRef: did we already POST /recent-plays for the *current* track?
	// playLoggedTrackIdRef: which trackId that flag refers to (avoids stale state).
	const playLoggedRef = useRef(false);
	const playLoggedTrackIdRef = useRef<string | null>(null);
	const PLAY_THRESHOLD_SECONDS = 30;

	// Crossfade state
	const crossfadeActiveRef = useRef(false);
	const outgoingAudioRef = useRef<HTMLAudioElement | null>(null);

	// Normalization: measured once per track at t=3s
	const normMeasuredRef = useRef(false);

	// --- Stable event handler delegation via refs ---
	const handlersRef = useRef({
		onCanPlay: () => {},
		onTimeUpdate: () => {},
		onEnded: () => {},
		onError: () => {},
		onLoadedMetadata: () => {},
		onWaiting: () => {},
		onPlaying: () => {},
	});

	const attachEvents = useCallback((audio: HTMLAudioElement) => {
		audio.oncanplay = () => handlersRef.current.onCanPlay();
		audio.ontimeupdate = () => handlersRef.current.onTimeUpdate();
		audio.onended = () => handlersRef.current.onEnded();
		audio.onerror = () => handlersRef.current.onError();
		audio.onloadedmetadata = () => handlersRef.current.onLoadedMetadata();
		audio.onwaiting = () => handlersRef.current.onWaiting();
		audio.onplaying = () => handlersRef.current.onPlaying();
	}, []);

	const detachEvents = useCallback((audio: HTMLAudioElement) => {
		audio.oncanplay = null;
		audio.ontimeupdate = null;
		audio.onended = null;
		audio.onerror = null;
		audio.onloadedmetadata = null;
		audio.onwaiting = null;
		audio.onplaying = null;
	}, []);

	// Hand off from a head-prefetched audio element (~3s buffered) to the
	// full progressive stream so playback continues seamlessly past the head.
	// We open the full stream right after the swap and ride out the head
	// segment; once the head approaches its end we copy state, swap refs,
	// and seek the full element to the head's position.
	const handoffFullStream = useCallback(
		(headAudio: HTMLAudioElement, trackId: string, gen: number) => {
			const fullAudio = new Audio();
			fullAudio.preload = "auto";
			fullAudio.crossOrigin = "anonymous";
			fullAudio.src = `/api/v1/stream-progressive/${trackId}`;
			fullAudio.load();

			let swapped = false;
			const cleanup = () => {
				headAudio.removeEventListener("timeupdate", onTimeUpdate);
				headAudio.removeEventListener("ended", onEnded);
			};

			const swap = () => {
				if (swapped) return;
				swapped = true;
				cleanup();
				if (loadGenRef.current !== gen || audioRef.current !== headAudio) {
					evictedAudio.add(fullAudio);
					fullAudio.src = "";
					return;
				}
				const seekTo = headAudio.currentTime || 0;
				const userVol = usePlayerStore.getState().volume / 100;
				const wasPlaying = !headAudio.paused;

				detachEvents(headAudio);
				evictedAudio.add(headAudio);
				headAudio.pause();
				headAudio.src = "";

				audioRef.current = fullAudio;
				attachEvents(fullAudio);
				try {
					fullAudio.currentTime = seekTo;
				} catch {
					// Seek may throw if not enough buffered; the audio element
					// will handle it by re-buffering and seeking when ready.
				}
				fullAudio.volume = userVol;
				fullAudio.playbackRate = usePlayerStore.getState().playbackRate;
				if (wasPlaying || usePlayerStore.getState().isPlaying) {
					fullAudio.play().catch(() => {});
				}
			};

			// Swap 300ms before head ends for smoother transition; fall back
			// to the ended event in case timeupdate granularity misses it.
			const onTimeUpdate = () => {
				if (swapped) return;
				const dur = headAudio.duration;
				if (!isFinite(dur) || dur <= 0) return;
				if (headAudio.currentTime > dur - 0.3) swap();
			};
			const onEnded = () => swap();

			headAudio.addEventListener("timeupdate", onTimeUpdate);
			headAudio.addEventListener("ended", onEnded);
		},
		[attachEvents, detachEvents]
	);

	// --- Initialize audio element (client-only) ---
	useEffect(() => {
		if (!audioRef.current) {
			const audio = new Audio();
			audio.preload = "auto";
			audio.crossOrigin = "anonymous";
			audioRef.current = audio;
			attachEvents(audio);
		}
		return () => {
			const audio = audioRef.current;
			if (audio) {
				detachEvents(audio);
				audio.pause();
				audio.src = "";
				evictedAudio.add(audio);
			}
			// Clean up preload caches
			for (const [, a] of preloadCache) {
				evictedAudio.add(a);
				a.src = "";
			}
			preloadCache.clear();
			for (const [, a] of hoverPreloadCache) {
				evictedAudio.add(a);
				a.src = "";
			}
			hoverPreloadCache.clear();
			for (const [, a] of headPreloadCache) {
				evictedAudio.add(a);
				a.src = "";
			}
			headPreloadCache.clear();
			headPrefetchedTracks.clear();
			// Cancel background prefetch
			prefetchAbort?.abort();
		};
	}, [attachEvents, detachEvents]);

	// Stop preview when full player resumes
	useEffect(() => {
		if (currentTrack && isPlaying) {
			const preview = usePreviewStore.getState();
			if (preview.currentTrack) preview.stop();
		}
	}, [currentTrack, isPlaying]);

	// Pause (not stop) stream player when preview starts; resume when preview ends
	useEffect(() => {
		if (previewTrack && previewIsPlaying) {
			const { isPlaying: mainPlaying } = usePlayerStore.getState();
			usePreviewStore.getState().setMainWasPlaying(mainPlaying);
			if (mainPlaying) {
				const audio = audioRef.current;
				if (audio) {
					adjustVolume(audio, 0, { duration: 300 }).then(() => {
						if (!usePlayerStore.getState().isPlaying) return;
						audio.pause();
						usePlayerStore.getState().pause();
					});
				}
			}
		} else if (!previewTrack && !previewIsPlaying) {
			// Preview ended — resume main player if it was playing before
			if (usePreviewStore.getState()._mainWasPlaying && usePlayerStore.getState().currentTrack) {
				usePlayerStore.getState().resume();
			}
			usePreviewStore.getState().setMainWasPlaying(false);
		}
	}, [previewTrack, previewIsPlaying]);

	// --- Preload adjacent tracks + smart background prefetch ---
	useEffect(() => {
		if (!currentTrack) return;
		const { queue, queueIndex } = usePlayerStore.getState();

		// Immediate preload: adjacent tracks (in-memory Audio elements for instant swap)
		if (queueIndex + 1 < queue.length) {
			preloadTrack(queue[queueIndex + 1].trackId);
		}
		if (queueIndex - 1 >= 0) {
			preloadTrack(queue[queueIndex - 1].trackId);
		}

		// Warm presigned URL cache for the next 3 tracks so click-to-play
		// skips the /api/v1/stream-url roundtrip.
		const upcoming: string[] = [];
		for (let i = 1; i <= 3 && queueIndex + i < queue.length; i++) {
			upcoming.push(queue[queueIndex + i].trackId);
		}
		if (queueIndex - 1 >= 0) upcoming.push(queue[queueIndex - 1].trackId);
		prefetchPresignedUrls(upcoming);

		// Background IndexedDB prefetch: next 5 + prev 2 tracks
		smartPrefetchQueue();

		// Cache current track if not already cached
		cacheCurrentTrackInBackground(currentTrack.trackId);
	}, [currentTrack]);

	// --- Load new track ---
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		if (!currentTrack) {
			// Stopping playback (queue cleared / explicit stop). If the last
			// track wasn't counted, it's a skip.
			if (
				prevTrackIdRef.current &&
				playLoggedTrackIdRef.current === prevTrackIdRef.current &&
				!playLoggedRef.current
			) {
				notifyTrackSkipped(prevTrackIdRef.current);
			}
			playLoggedRef.current = false;
			playLoggedTrackIdRef.current = null;
			audio.pause();
			audio.src = "";
			prevTrackIdRef.current = null;
			return;
		}

		if (currentTrack.trackId !== prevTrackIdRef.current) {
			// If the *previous* track never reached the 30s threshold, treat it
			// as a skip → ask the server to evict its file (metadata stays).
			if (
				prevTrackIdRef.current &&
				playLoggedTrackIdRef.current === prevTrackIdRef.current &&
				!playLoggedRef.current
			) {
				notifyTrackSkipped(prevTrackIdRef.current);
			}
			// Reset play-tracking state for the incoming track
			playLoggedRef.current = false;
			playLoggedTrackIdRef.current = currentTrack.trackId;

			// Cancel any in-progress crossfade on manual track change
			if (crossfadeActiveRef.current) {
				crossfadeActiveRef.current = false;
				if (outgoingAudioRef.current) {
					outgoingAudioRef.current.pause();
					outgoingAudioRef.current.src = "";
					evictedAudio.add(outgoingAudioRef.current);
					outgoingAudioRef.current = null;
				}
			}
			// Reset normalization for the incoming track
			normMeasuredRef.current = false;
			resetNormGain();
			const gen = ++loadGenRef.current;
			retryCountRef.current = 0;
			setError(null);
			// Prevent the play/pause effect from re-starting the old audio
			skipPlayEffectRef.current = true;

			// Immediately kill the old audio — hard stop, no fade
			detachEvents(audio);
			audio.pause();
			audio.src = "";
			evictedAudio.add(audio);

			prevTrackIdRef.current = currentTrack.trackId;

			// Pick the best prefetched element, in order of buffer richness:
			//   1. queue preload (next/prev — persisting full stream)
			//   2. hover preload  (preview-mode full stream, ~30s buffered)
			//   3. head preload   (preview-mode head — ~3s buffered, must
			//                      transition to full stream when it ends)
			const preloaded =
				preloadCache.get(currentTrack.trackId) ||
				hoverPreloadCache.get(currentTrack.trackId) ||
				headPreloadCache.get(currentTrack.trackId);

			if (preloaded) {
				audioRef.current = preloaded;
				preloadCache.delete(currentTrack.trackId);
				hoverPreloadCache.delete(currentTrack.trackId);
				headPreloadCache.delete(currentTrack.trackId);
				attachEvents(preloaded);

				// If we swapped onto a head-prefetched element, kick off the
				// full stream now so it can take over before the head runs
				// out. The full stream goes through normal /stream-progressive
				// (no preview, persisting) — first listen, server downloads
				// from Deezer once and persists; subsequent plays hit S3.
				if (headPrefetchedTracks.has(currentTrack.trackId)) {
					handoffFullStream(preloaded, currentTrack.trackId, gen);
					headPrefetchedTracks.delete(currentTrack.trackId);
				}

				if (preloaded.readyState >= 2) {
					// Already buffered — play immediately
					setBuffering(false);
					setDuration(preloaded.duration || 0);
					preloaded.playbackRate = usePlayerStore.getState().playbackRate;
					if (usePlayerStore.getState().isPlaying) {
						skipPlayEffectRef.current = true;
						preloaded.volume = 0;
						preloaded.play().catch(() => {});
						const targetVol = usePlayerStore.getState().volume / 100;
						adjustVolume(preloaded, targetVol, { duration: 200 });
					}
				}
				// If not ready yet, onCanPlay will fire and handle playback
			} else {
				// No preloaded data — load normally on a fresh element
				const newAudio = new Audio();
				newAudio.preload = "auto";
				newAudio.crossOrigin = "anonymous";
				audioRef.current = newAudio;
				attachEvents(newAudio);

				getTrackUrl(currentTrack.trackId).then((url) => {
					if (loadGenRef.current !== gen) return;
					newAudio.src = url;
					newAudio.load();
				});
			}
		}
	}, [currentTrack, attachEvents, detachEvents, setDuration]);

	// --- Play / pause with fade effects ---
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentTrack) return;

		if (isPlaying) {
			// Skip if loadTrack already started playback (preloaded swap)
			if (skipPlayEffectRef.current) {
				skipPlayEffectRef.current = false;
				return;
			}
			if (audio.readyState >= 2) {
				audio.volume = 0;
				audio.play().catch(() => {});
				const targetVolume = usePlayerStore.getState().volume / 100;
				adjustVolume(audio, targetVolume, { duration: 200 });
			}
		} else {
			adjustVolume(audio, 0, { duration: 500 }).then(() => {
				if (!usePlayerStore.getState().isPlaying) {
					audio.pause();
				}
			});
		}
	}, [isPlaying, currentTrack]);

	// Volume — smooth transition
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !isPlaying) return;
		adjustVolume(audio, volume / 100, { duration: 300 });
	}, [volume, isPlaying]);

	// Playback rate
	useEffect(() => {
		const audio = audioRef.current;
		if (audio) audio.playbackRate = playbackRate;
	}, [playbackRate]);

	// Normalization toggle — reset gain when turned off
	useEffect(() => {
		if (!normalizationEnabled) {
			normMeasuredRef.current = false;
			resetNormGain();
		}
	}, [normalizationEnabled]);

	// Sleep timer
	useEffect(() => {
		if (!sleepTimerEnd) return;
		const interval = setInterval(() => {
			if (Date.now() >= sleepTimerEnd) {
				usePlayerStore.getState().pause();
				usePlayerStore.getState().setSleepTimer(null);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [sleepTimerEnd]);

	// Seek: respond to _seekTo signal from prev() restart or seek()
	const seekTo = usePlayerStore((s) => s._seekTo);
	useEffect(() => {
		if (seekTo === null) return;
		const audio = audioRef.current;
		if (audio) {
			audio.currentTime = seekTo;
		}
		// Clear the signal so it doesn't re-fire
		usePlayerStore.setState({ _seekTo: null });
	}, [seekTo]);

	// --- Media Session position update ---
	const onPositionUpdate = useCallback(() => {
		if (!("mediaSession" in navigator)) return;
		const audio = audioRef.current;
		if (!audio || !audio.duration || !isFinite(audio.duration)) return;
		try {
			navigator.mediaSession.setPositionState({
				duration: audio.duration,
				playbackRate: audio.playbackRate,
				position: Math.min(audio.currentTime, audio.duration),
			});
		} catch {
			// Ignore invalid state errors
		}
	}, []);

	// --- Update handler refs (always point to latest closures) ---
	handlersRef.current.onCanPlay = () => {
		const audio = audioRef.current;
		if (!audio) return;
		setBuffering(false);
		setDuration(audio.duration || 0);
		audio.playbackRate = usePlayerStore.getState().playbackRate;
		onPositionUpdate();
		if (usePlayerStore.getState().isPlaying) {
			const targetVolume = usePlayerStore.getState().volume / 100;
			// Only reset volume and call play() if not already playing — prevents
			// double-fade when canplay fires after we already started the element.
			if (audio.paused) {
				audio.volume = 0;
				audio.play().catch(() => {});
			}
			adjustVolume(audio, targetVolume, { duration: 200 });
		}
	};

	handlersRef.current.onTimeUpdate = () => {
		const audio = audioRef.current;
		if (!audio) return;
		// Throttle store writes to ~4Hz to avoid excessive re-renders
		const now = audio.currentTime;
		const last = usePlayerStore.getState().currentTime;
		if (Math.abs(now - last) >= 0.25) {
			setCurrentTime(now);
		}
		onPositionUpdate();

		// Spotify rule: count a real play once playback crosses 30s.
		// This is the moment the track "joins" the user's recently-played
		// history and its S3 file is locked from eviction-on-skip.
		const track = usePlayerStore.getState().currentTrack;
		if (
			track &&
			!playLoggedRef.current &&
			playLoggedTrackIdRef.current === track.trackId &&
			audio.currentTime >= PLAY_THRESHOLD_SECONDS
		) {
			playLoggedRef.current = true;
			void logRecentPlay({
				trackId: track.trackId,
				title: track.title,
				artist: track.artist,
				cover: track.cover,
				duration: track.duration,
			});

			// If this track is playing from a preview-mode prefetch, the server
			// didn't persist it. Trigger a real (persisting) progressive stream
			// in the background so the next play hits the cached S3 file. The
			// server's persist branch runs to completion even after we cancel
			// the response body — we just want the upload to start.
			const src = audio.src || "";
			if (src.includes("/stream-progressive/") && src.includes("preview=1")) {
				fetch(`/api/v1/stream-progressive/${track.trackId}`, {
					credentials: "include",
				})
					.then((res) => {
						res.body?.cancel().catch(() => {});
					})
					.catch(() => {});
			}
		}

		// Connect to Web Audio API on first timeUpdate after playback starts.
		// This provides audio data for the visualizer and normalization.
		// Idempotent — skipped once connected or if connection fails (CORS etc.).
		if (!isConnectedOrFailed(audio)) {
			initAudioCtx();
			connectAudioElement(audio);
		}

		// Normalization: measure RMS at t=3s (once per track, if enabled)
		if (normalizationEnabled && !normMeasuredRef.current && audio.currentTime >= 3.0) {
			normMeasuredRef.current = true;
			const rms = measureRms();
			if (rms > 0) {
				// Target −18.4 dBFS (≈ −14 LUFS for most music)
				const rawGain = 0.12 / rms;
				// Cap boost so normGain × userVol ≤ 1.0 to prevent clipping
				const userVol = usePlayerStore.getState().volume / 100;
				const maxBoost = userVol > 0 ? 1.0 / userVol : 1.5;
				applyNormGain(Math.min(rawGain, maxBoost));
			}
		}

		// Preload next track at 50% progress
		if (audio.duration > 0 && audio.currentTime / audio.duration > 0.5) {
			const { queue, queueIndex } = usePlayerStore.getState();
			if (queueIndex + 1 < queue.length) {
				preloadTrack(queue[queueIndex + 1].trackId);
			}
		}

		// --- Crossfade ---
		const timeLeft = audio.duration - audio.currentTime;
		if (
			crossfadeDuration > 0 &&
			!crossfadeActiveRef.current &&
			audio.duration > crossfadeDuration * 2 && // skip very short tracks
			timeLeft > 0 &&
			timeLeft <= crossfadeDuration &&
			repeat !== "one"
		) {
			const { queue, queueIndex, shuffle, _shuffleOrder, _shufflePos, repeat: rep } = usePlayerStore.getState();

			// Determine next queue index (mirrors next() logic)
			let nextQueueIndex = -1;
			if (shuffle && _shuffleOrder.length > 0) {
				const nextPos = _shufflePos + 1;
				if (nextPos < _shuffleOrder.length) nextQueueIndex = _shuffleOrder[nextPos];
				// skip crossfade on last shuffle track (re-shuffle would happen)
			} else {
				if (queueIndex + 1 < queue.length) nextQueueIndex = queueIndex + 1;
				else if (rep === "all") nextQueueIndex = 0;
			}

			if (nextQueueIndex >= 0) {
				const nextTrack = queue[nextQueueIndex];
				const preloaded = preloadCache.get(nextTrack.trackId);

				if (preloaded && preloaded.readyState >= 3) {
					crossfadeActiveRef.current = true;
					const fadeDuration = timeLeft * 1000;

					// Detach events from outgoing audio so its onended doesn't trigger next()
					const outgoing = audio;
					detachEvents(outgoing);
					outgoingAudioRef.current = outgoing;

					// Swap to incoming audio
					preloadCache.delete(nextTrack.trackId);
					attachEvents(preloaded);
					audioRef.current = preloaded;
					prevTrackIdRef.current = nextTrack.trackId;
					skipPlayEffectRef.current = true;

					preloaded.playbackRate = playbackRate;
					preloaded.volume = 0;
					preloaded.currentTime = 0;
					preloaded.play().catch(() => {});

					const targetVol = usePlayerStore.getState().volume / 100;
					adjustVolume(outgoing, 0, { duration: fadeDuration });
					adjustVolume(preloaded, targetVol, { duration: fadeDuration });

					// Advance store state to next track
					usePlayerStore.getState().next();

					// Clean up outgoing after fade
					setTimeout(() => {
						outgoing.pause();
						outgoing.src = "";
						evictedAudio.add(outgoing);
						outgoingAudioRef.current = null;
						crossfadeActiveRef.current = false;
					}, fadeDuration + 300);
				}
			}
		}
	};

	handlersRef.current.onEnded = () => {
		if (repeat === "one") {
			const audio = audioRef.current;
			if (audio) {
				audio.currentTime = 0;
				audio.play().catch(() => {});
			}
		} else {
			next();
		}
	};

	handlersRef.current.onError = () => {
		const audio = audioRef.current;
		if (!audio || !currentTrack) return;
		const src = audio.src;

		// First: try falling back from presigned URL to proxy stream
		if (usePresigned && src && !src.includes("/api/v1/stream-progressive/") && !src.includes("/api/v1/stream/")) {
			usePresigned = false;
			urlCache.clear();
			for (const [, a] of preloadCache) {
				evictedAudio.add(a);
				a.src = "";
			}
			preloadCache.clear();
			audio.src = `/api/v1/stream-progressive/${currentTrack.trackId}`;
			audio.load();
			return;
		}

		// Retry up to MAX_RETRIES times
		retryCountRef.current++;
		if (retryCountRef.current <= MAX_RETRIES) {
			setTimeout(() => {
				if (audioRef.current && currentTrack) {
					audioRef.current.src = `/api/v1/stream-progressive/${currentTrack.trackId}`;
					audioRef.current.load();
				}
			}, 1000 * retryCountRef.current);
			return;
		}

		// All retries exhausted — set error and auto-skip
		setError(`Can't play "${currentTrack.title}"`);
		const { queue, queueIndex } = usePlayerStore.getState();
		if (queueIndex + 1 < queue.length) {
			setTimeout(() => next(), 1500);
		} else {
			pause();
		}
	};

	handlersRef.current.onLoadedMetadata = () => {
		const audio = audioRef.current;
		if (audio) setDuration(audio.duration || 0);
	};

	handlersRef.current.onWaiting = () => {
		setBuffering(true);
	};

	handlersRef.current.onPlaying = () => {
		setBuffering(false);
	};

	// --- Media Session API ---

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		if (!currentTrack) {
			navigator.mediaSession.metadata = null;
			return;
		}

		const artwork: MediaImage[] = currentTrack.cover
			? [
					{
						src: currentTrack.cover.replace(/\/\d+x\d+-/, "/256x256-"),
						sizes: "256x256",
						type: "image/jpeg",
					},
					{
						src: currentTrack.cover.replace(/\/\d+x\d+-/, "/512x512-"),
						sizes: "512x512",
						type: "image/jpeg",
					},
				]
			: [];

		navigator.mediaSession.metadata = new MediaMetadata({
			title: currentTrack.title,
			artist: currentTrack.artist,
			artwork,
		});
	}, [currentTrack]);

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = currentTrack
			? isPlaying
				? "playing"
				: "paused"
			: "none";
	}, [isPlaying, currentTrack]);

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
			["play", () => resume()],
			["pause", () => pause()],
			["previoustrack", () => prev()],
			["nexttrack", () => next()],
			[
				"seekto",
				(details) => {
					if (details.seekTime != null) {
						usePlayerStore.getState().seek(details.seekTime);
					}
				},
			],
			[
				"seekbackward",
				(details) => {
					const audio = audioRef.current;
					if (audio) {
						const offset = details.seekOffset ?? 10;
						usePlayerStore.getState().seek(Math.max(0, audio.currentTime - offset));
					}
				},
			],
			[
				"seekforward",
				(details) => {
					const audio = audioRef.current;
					if (audio) {
						const offset = details.seekOffset ?? 10;
						usePlayerStore.getState().seek(Math.min(audio.duration || 0, audio.currentTime + offset));
					}
				},
			],
		];

		for (const [action, handler] of actions) {
			try {
				navigator.mediaSession.setActionHandler(action, handler);
			} catch {
				// Action not supported by browser
			}
		}

		return () => {
			for (const [action] of actions) {
				try {
					navigator.mediaSession.setActionHandler(action, null);
				} catch {}
			}
		};
	}, [pause, resume, prev, next]);

	// No JSX audio element — all managed imperatively for preload swapping
	return null;
}
