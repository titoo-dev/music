"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";

// Cache presigned URLs to avoid re-fetching
const urlCache = new Map<string, { url: string; fetchedAt: number }>();
const URL_CACHE_TTL = 12 * 60 * 1000; // 12 minutes (presigned URLs valid for 15)
// Track whether direct S3 streaming works (falls back to proxy if not)
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

/**
 * Hidden <audio> element that drives full-track playback from S3.
 * Separate from AudioPreview (which handles 30s Deezer clips).
 * Also manages the Media Session API for OS-level media controls.
 */
export function AudioEngine() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const prevTrackIdRef = useRef<string | null>(null);
	const preloadedTrackIdRef = useRef<string | null>(null);

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

	// Stop preview playback when full player starts
	useEffect(() => {
		if (currentTrack && isPlaying) {
			previewStop();
		}
	}, [currentTrack, isPlaying, previewStop]);

	// Load new track — use presigned URL for direct S3 streaming
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
			prevTrackIdRef.current = currentTrack.trackId;

			// Try presigned URL for faster direct S3 streaming
			if (usePresigned) {
				const cachedUrl = urlCache.get(currentTrack.trackId);
				if (cachedUrl && Date.now() - cachedUrl.fetchedAt < URL_CACHE_TTL) {
					// Presigned URL already cached (from preloading) — use immediately
					audio.src = cachedUrl.url;
					audio.load();
				} else {
					// Fetch presigned URL, then load
					fetchPresignedUrl(currentTrack.trackId).then((url) => {
						// Make sure this track is still current
						if (prevTrackIdRef.current !== currentTrack.trackId) return;
						audio.src = url || `/api/v1/stream/${currentTrack.trackId}`;
						audio.load();
					});
				}
			} else {
				// Fallback: proxy through server
				audio.src = `/api/v1/stream/${currentTrack.trackId}`;
				audio.load();
			}
		}
	}, [currentTrack]);

	// Play / pause
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentTrack) return;

		if (isPlaying) {
			if (audio.readyState >= 2) {
				audio.play().catch(() => {});
			}
		} else {
			audio.pause();
		}
	}, [isPlaying, currentTrack]);

	// Volume
	useEffect(() => {
		const audio = audioRef.current;
		if (audio) audio.volume = volume / 100;
	}, [volume]);

	// Seek: listen for currentTime resets (prev button restart)
	const lastStoreTime = useRef(0);
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		const storeTime = usePlayerStore.getState().currentTime;
		// If store time jumped to 0 but audio is further ahead, seek
		if (storeTime === 0 && lastStoreTime.current > 3) {
			audio.currentTime = 0;
		}
		lastStoreTime.current = storeTime;
	});

	// Update position state for seek bar in OS media controls
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

	const onCanPlay = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		setDuration(audio.duration || 0);
		onPositionUpdate();
		if (usePlayerStore.getState().isPlaying) {
			audio.play().catch(() => {});
		}
	}, [setDuration, onPositionUpdate]);

	const onTimeUpdate = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		setCurrentTime(audio.currentTime);
		lastStoreTime.current = audio.currentTime;
		onPositionUpdate();

		// Preload next track's presigned URL when ~75% done
		if (
			usePresigned &&
			audio.duration > 0 &&
			audio.currentTime / audio.duration > 0.75
		) {
			const { queue, queueIndex } = usePlayerStore.getState();
			const nextIndex = queueIndex + 1;
			if (nextIndex < queue.length) {
				const nextTrack = queue[nextIndex];
				if (nextTrack && preloadedTrackIdRef.current !== nextTrack.trackId) {
					preloadedTrackIdRef.current = nextTrack.trackId;
					fetchPresignedUrl(nextTrack.trackId);
				}
			}
		}
	}, [setCurrentTime, onPositionUpdate]);

	// If presigned URL fails (CORS, network), fall back to proxy
	const onError = useCallback(() => {
		const audio = audioRef.current;
		if (!audio || !usePresigned || !currentTrack) return;

		const src = audio.src;
		// Only retry if the failed src was a presigned URL (not our proxy)
		if (src && !src.includes("/api/v1/stream/")) {
			usePresigned = false;
			urlCache.clear();
			audio.src = `/api/v1/stream/${currentTrack.trackId}`;
			audio.load();
		}
	}, [currentTrack]);

	const onEnded = useCallback(() => {
		if (repeat === "one") {
			const audio = audioRef.current;
			if (audio) {
				audio.currentTime = 0;
				audio.play().catch(() => {});
			}
		} else {
			next();
		}
	}, [repeat, next]);

	// Expose seek function via a global ref for the Player UI
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

	// Update metadata when track changes
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		if (!currentTrack) {
			navigator.mediaSession.metadata = null;
			return;
		}

		// Cover URLs follow the pattern: .../images/cover/{hash}/{size}x{size}-000000-80-0-0.jpg
		// Generate multiple sizes for OS media controls from whatever size was stored
		const artwork: MediaImage[] = currentTrack.cover
			? [
					{ src: currentTrack.cover.replace(/\/\d+x\d+-/, "/256x256-"), sizes: "256x256", type: "image/jpeg" },
					{ src: currentTrack.cover.replace(/\/\d+x\d+-/, "/512x512-"), sizes: "512x512", type: "image/jpeg" },
				]
			: [];

		navigator.mediaSession.metadata = new MediaMetadata({
			title: currentTrack.title,
			artist: currentTrack.artist,
			artwork,
		});
	}, [currentTrack]);

	// Update playback state
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = currentTrack
			? isPlaying
				? "playing"
				: "paused"
			: "none";
	}, [isPlaying, currentTrack]);

	// Register action handlers
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
						audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + offset);
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

	return (
		<audio
			ref={audioRef}
			onCanPlay={onCanPlay}
			onTimeUpdate={onTimeUpdate}
			onEnded={onEnded}
			onError={onError}
			onLoadedMetadata={() => {
				const audio = audioRef.current;
				if (audio) setDuration(audio.duration || 0);
			}}
			preload="auto"
			crossOrigin="anonymous"
			className="hidden"
		/>
	);
}
