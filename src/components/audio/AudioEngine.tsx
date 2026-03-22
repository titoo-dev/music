"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { adjustVolume } from "@/utils/adjust-volume";

// --- URL Cache ---
const urlCache = new Map<string, { url: string; fetchedAt: number }>();
const URL_CACHE_TTL = 12 * 60 * 1000; // 12 minutes (presigned URLs valid for 15)
let usePresigned = true;

async function fetchPresignedUrl(trackId: string): Promise<string | null> {
	const cached = urlCache.get(trackId);
	if (cached && Date.now() - cached.fetchedAt < URL_CACHE_TTL) {
		return cached.url;
	}

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

async function getTrackUrl(trackId: string): Promise<string> {
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
	return `/api/v1/stream/${trackId}`;
}

// --- Audio Preload Cache ---
// Stores pre-buffered Audio elements so playback starts instantly
const preloadCache = new Map<string, HTMLAudioElement>();
const MAX_PRELOADED = 6;
// Tracks elements that were evicted or abandoned — prevents stale URL resolutions
// from setting src on elements that are no longer needed.
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
		// Only skip if the element was explicitly evicted/abandoned.
		// When AudioEngine adopts an element (removes from cache), we still
		// want the URL to be set so the audio can load.
		if (evictedAudio.has(audio)) return;
		audio.src = url;
		audio.load();
	});
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

	const previewStop = usePreviewStore((s) => s.stop);
	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewIsPlaying = usePreviewStore((s) => s.isPlaying);

	// --- Stable event handler delegation via refs ---
	// Audio element event handlers always call the latest callback through this ref
	const handlersRef = useRef({
		onCanPlay: () => {},
		onTimeUpdate: () => {},
		onEnded: () => {},
		onError: () => {},
		onLoadedMetadata: () => {},
	});

	const attachEvents = useCallback((audio: HTMLAudioElement) => {
		audio.oncanplay = () => handlersRef.current.onCanPlay();
		audio.ontimeupdate = () => handlersRef.current.onTimeUpdate();
		audio.onended = () => handlersRef.current.onEnded();
		audio.onerror = () => handlersRef.current.onError();
		audio.onloadedmetadata = () => handlersRef.current.onLoadedMetadata();
	}, []);

	const detachEvents = useCallback((audio: HTMLAudioElement) => {
		audio.oncanplay = null;
		audio.ontimeupdate = null;
		audio.onended = null;
		audio.onerror = null;
		audio.onloadedmetadata = null;
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
		};
	}, [attachEvents, detachEvents]);

	// Stop preview when full player starts
	useEffect(() => {
		if (currentTrack && isPlaying) previewStop();
	}, [currentTrack, isPlaying, previewStop]);

	// Stop stream player when preview starts
	useEffect(() => {
		if (previewTrack && previewIsPlaying) {
			const audio = audioRef.current;
			if (audio) {
				audio.pause();
				audio.src = "";
			}
			prevTrackIdRef.current = null;
			usePlayerStore.getState().stop();
		}
	}, [previewTrack, previewIsPlaying]);

	// --- Preload adjacent tracks when queue position changes ---
	useEffect(() => {
		if (!currentTrack) return;
		const { queue, queueIndex } = usePlayerStore.getState();
		if (queueIndex + 1 < queue.length) {
			preloadTrack(queue[queueIndex + 1].trackId);
		}
		if (queueIndex - 1 >= 0) {
			preloadTrack(queue[queueIndex - 1].trackId);
		}
	}, [currentTrack]);

	// --- Load new track ---
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		if (!currentTrack) {
			audio.pause();
			audio.src = "";
			prevTrackIdRef.current = null;
			return;
		}

		if (currentTrack.trackId !== prevTrackIdRef.current) {
			const gen = ++loadGenRef.current;
			// Prevent the play/pause effect from re-starting the old audio
			skipPlayEffectRef.current = true;

			// Immediately kill the old audio — hard stop, no fade
			detachEvents(audio);
			audio.pause();
			audio.src = "";
			evictedAudio.add(audio);

			prevTrackIdRef.current = currentTrack.trackId;

			const preloaded = preloadCache.get(currentTrack.trackId);

			if (preloaded) {
				// Swap to the preloaded element (its buffer has the audio data)
				audioRef.current = preloaded;
				preloadCache.delete(currentTrack.trackId);
				attachEvents(preloaded);

				if (preloaded.readyState >= 2) {
					// Already buffered — play immediately
					setDuration(preloaded.duration || 0);
					if (usePlayerStore.getState().isPlaying) {
						skipPlayEffectRef.current = true;
						preloaded.volume = 0;
						preloaded.play().catch(() => {});
						const targetVol = usePlayerStore.getState().volume / 100;
						adjustVolume(preloaded, targetVol, { duration: 800 });
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

	// Seek: respond to _seekTo signal from prev() restart
	const seekTo = usePlayerStore((s) => s._seekTo);
	useEffect(() => {
		if (seekTo === null) return;
		const audio = audioRef.current;
		if (audio) {
			audio.currentTime = seekTo;
			setCurrentTime(seekTo);
		}
		// Clear the signal so it doesn't re-fire
		usePlayerStore.setState({ _seekTo: null });
	}, [seekTo, setCurrentTime]);

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
		setDuration(audio.duration || 0);
		onPositionUpdate();
		if (usePlayerStore.getState().isPlaying) {
			audio.volume = 0;
			audio.play().catch(() => {});
			const targetVolume = usePlayerStore.getState().volume / 100;
			adjustVolume(audio, targetVolume, { duration: 800 });
		}
	};

	handlersRef.current.onTimeUpdate = () => {
		const audio = audioRef.current;
		if (!audio) return;
		setCurrentTime(audio.currentTime);
		onPositionUpdate();

		// Preload next track at 50% progress
		if (audio.duration > 0 && audio.currentTime / audio.duration > 0.5) {
			const { queue, queueIndex } = usePlayerStore.getState();
			if (queueIndex + 1 < queue.length) {
				preloadTrack(queue[queueIndex + 1].trackId);
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
		if (!audio || !usePresigned || !currentTrack) return;
		const src = audio.src;
		if (src && !src.includes("/api/v1/stream/")) {
			usePresigned = false;
			urlCache.clear();
			// Invalidate preloaded elements (presigned URLs are now invalid)
			for (const [, a] of preloadCache) {
				evictedAudio.add(a);
				a.src = "";
			}
			preloadCache.clear();
			audio.src = `/api/v1/stream/${currentTrack.trackId}`;
			audio.load();
		}
	};

	handlersRef.current.onLoadedMetadata = () => {
		const audio = audioRef.current;
		if (audio) setDuration(audio.duration || 0);
	};

	// Expose seek function for Player UI
	useEffect(() => {
		(window as any).__deemixAudioSeek = (time: number) => {
			const audio = audioRef.current;
			if (audio) {
				audio.currentTime = time;
				setCurrentTime(time);
			}
		};
		return () => {
			delete (window as any).__deemixAudioSeek;
		};
	}, [setCurrentTime]);

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
					const audio = audioRef.current;
					if (audio && details.seekTime != null) {
						audio.currentTime = details.seekTime;
						setCurrentTime(details.seekTime);
					}
				},
			],
			[
				"seekbackward",
				(details) => {
					const audio = audioRef.current;
					if (audio) {
						const offset = details.seekOffset ?? 10;
						audio.currentTime = Math.max(0, audio.currentTime - offset);
						setCurrentTime(audio.currentTime);
					}
				},
			],
			[
				"seekforward",
				(details) => {
					const audio = audioRef.current;
					if (audio) {
						const offset = details.seekOffset ?? 10;
						audio.currentTime = Math.min(
							audio.duration || 0,
							audio.currentTime + offset,
						);
						setCurrentTime(audio.currentTime);
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
	}, [pause, resume, prev, next, setCurrentTime]);

	// No JSX audio element — all managed imperatively for preload swapping
	return null;
}
