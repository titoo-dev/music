"use client";

import { useEffect, useRef, useCallback } from "react";
import type Hls from "hls.js";
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
const URL_CACHE_TTL = 12 * 60 * 1000; // 12 minutes (presigned URLs valid for 15)
let usePresigned = true;

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

	pruneUrlCache();

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
	}
}

/**
 * Resolve audio URL for a track. Priority:
 * 1. IndexedDB blob URL (instant, zero network) — skipped in HLS mode
 * 2. Presigned S3 URL (direct browser streaming) — skipped in HLS mode
 * 3. Proxied stream API (fallback / HLS segments backend)
 */
async function getTrackUrl(trackId: string): Promise<string> {
	// 1. Check IndexedDB cache — instant blob URL
	try {
		const blobUrl = await getCachedBlobUrl(trackId);
		if (blobUrl) return blobUrl;
	} catch {
		// Cache miss — continue to network
	}

	// 2. Presigned URL
	if (usePresigned) {
		const url = await fetchPresignedUrl(trackId);
		if (url) {
			// Skip presigned URL if it would cause mixed content (HTTPS page → HTTP audio)
			if (window.location.protocol === "https:" && url.startsWith("http://")) {
				usePresigned = false;
				urlCache.clear();
				return `/api/v1/stream/${trackId}`;
			}
			return url;
		}
	}

	// 3. Proxied stream (Service Worker will cache the response)
	return `/api/v1/stream/${trackId}`;
}

/** Build HLS manifest URL for a track, passing duration hint if available. */
function getHlsManifestUrl(trackId: string, duration: number | null): string {
	const base = `/api/v1/hls/${trackId}`;
	return duration ? `${base}?duration=${duration}` : base;
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
 * Cache current track after it starts playing (if not already cached).
 * This ensures every played track gets persisted to IndexedDB.
 */
async function cacheCurrentTrackInBackground(trackId: string) {
	if (await isCached(trackId)) return;

	try {
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
	const hlsRef = useRef<Hls | null>(null);
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
	const hlsEnabled = usePlayerStore((s) => s.hlsEnabled);

	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewIsPlaying = usePreviewStore((s) => s.isPlaying);

	// Error retry counter
	const retryCountRef = useRef(0);
	const MAX_RETRIES = 2;

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
			// Destroy hls.js instance
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}
			const audio = audioRef.current;
			if (audio) {
				detachEvents(audio);
				audio.pause();
				audio.src = "";
				evictedAudio.add(audio);
			}
			// Clean up preload cache
			for (const [, a] of preloadCache) {
				evictedAudio.add(a);
				a.src = "";
			}
			preloadCache.clear();
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
	// Skipped in HLS mode: hls.js manages its own buffer; preload cache not used.
	useEffect(() => {
		if (!currentTrack || hlsEnabled) return;
		const { queue, queueIndex } = usePlayerStore.getState();

		// Immediate preload: adjacent tracks (in-memory Audio elements for instant swap)
		if (queueIndex + 1 < queue.length) {
			preloadTrack(queue[queueIndex + 1].trackId);
		}
		if (queueIndex - 1 >= 0) {
			preloadTrack(queue[queueIndex - 1].trackId);
		}

		// Background IndexedDB prefetch: next 5 + prev 2 tracks
		smartPrefetchQueue();

		// Cache current track if not already cached
		cacheCurrentTrackInBackground(currentTrack.trackId);
	}, [currentTrack, hlsEnabled]);

	// --- Load new track ---
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		if (!currentTrack) {
			// Destroy hls instance if any
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}
			audio.pause();
			audio.src = "";
			prevTrackIdRef.current = null;
			return;
		}

		if (currentTrack.trackId !== prevTrackIdRef.current) {
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

			// Destroy previous hls.js instance
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}

			// Immediately kill the old audio — hard stop, no fade
			detachEvents(audio);
			audio.pause();
			audio.src = "";
			evictedAudio.add(audio);

			prevTrackIdRef.current = currentTrack.trackId;

			const newAudio = new Audio();
			newAudio.preload = "auto";
			newAudio.crossOrigin = "anonymous";
			audioRef.current = newAudio;
			attachEvents(newAudio);

			if (hlsEnabled) {
				// HLS mode: use hls.js for byte-range segment streaming
				import("hls.js").then(({ default: HlsLib }) => {
					if (loadGenRef.current !== gen) return;

					const manifestUrl = getHlsManifestUrl(currentTrack.trackId, currentTrack.duration);

					if (HlsLib.isSupported()) {
						const hls = new HlsLib({
							enableWorker: true,
							lowLatencyMode: false,
							// Buffer enough for smooth playback without downloading the whole file
							maxBufferLength: 60,
							maxMaxBufferLength: 120,
						});
						hlsRef.current = hls;
						hls.loadSource(manifestUrl);
						hls.attachMedia(newAudio);
						hls.on(HlsLib.Events.ERROR, (_event, data) => {
							if (data.fatal && audioRef.current === newAudio) {
								hlsRef.current?.destroy();
								hlsRef.current = null;
								// Fallback to direct stream
								newAudio.src = `/api/v1/stream/${currentTrack.trackId}`;
								newAudio.load();
							}
						});
					} else if (newAudio.canPlayType("application/vnd.apple.mpegurl")) {
						// Native HLS (Safari)
						newAudio.src = manifestUrl;
						newAudio.load();
					} else {
						// HLS not supported — fall back to direct stream
						newAudio.src = `/api/v1/stream/${currentTrack.trackId}`;
						newAudio.load();
					}
				});
			} else {
				// Direct mode: IndexedDB → presigned URL → proxy
				const preloaded = preloadCache.get(currentTrack.trackId);

				if (preloaded) {
					// Swap to the preloaded element
					audioRef.current = preloaded;
					preloadCache.delete(currentTrack.trackId);
					// Detach from newAudio (unused) and attach to preloaded
					detachEvents(newAudio);
					evictedAudio.add(newAudio);
					attachEvents(preloaded);

					if (preloaded.readyState >= 2) {
						setBuffering(false);
						setDuration(preloaded.duration || 0);
						preloaded.playbackRate = usePlayerStore.getState().playbackRate;
						if (usePlayerStore.getState().isPlaying) {
							skipPlayEffectRef.current = true;
							preloaded.volume = 0;
							preloaded.play().catch(() => {});
							const targetVol = usePlayerStore.getState().volume / 100;
							adjustVolume(preloaded, targetVol, { duration: 800 });
						}
					}
				} else {
					getTrackUrl(currentTrack.trackId).then((url) => {
						if (loadGenRef.current !== gen) return;
						newAudio.src = url;
						newAudio.load();
					});
				}
			}
		}
	}, [currentTrack, hlsEnabled, attachEvents, detachEvents, setDuration]);

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
				adjustVolume(audio, targetVolume, { duration: 600 });
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
			adjustVolume(audio, targetVolume, { duration: 800 });
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

		// Preload next track at 50% progress (direct mode only — hls.js handles its own buffer)
		if (!hlsEnabled && audio.duration > 0 && audio.currentTime / audio.duration > 0.5) {
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

		// In HLS mode, fatal errors are handled inside the hls.js ERROR event listener.
		// Only handle non-fatal fallback errors here (e.g. native HLS on Safari).
		if (hlsEnabled && hlsRef.current) return;

		const src = audio.src;

		// First: try falling back from presigned URL to proxy stream
		if (usePresigned && src && !src.includes("/api/v1/stream/")) {
			usePresigned = false;
			urlCache.clear();
			for (const [, a] of preloadCache) {
				evictedAudio.add(a);
				a.src = "";
			}
			preloadCache.clear();
			audio.src = `/api/v1/stream/${currentTrack.trackId}`;
			audio.load();
			return;
		}

		// Retry up to MAX_RETRIES times
		retryCountRef.current++;
		if (retryCountRef.current <= MAX_RETRIES) {
			setTimeout(() => {
				if (audioRef.current && currentTrack) {
					audioRef.current.src = `/api/v1/stream/${currentTrack.trackId}`;
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
