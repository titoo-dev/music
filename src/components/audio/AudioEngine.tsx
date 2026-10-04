"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
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
import { getCachedBlobUrl, removeCached, setCacheLimit } from "@/lib/audio-cache";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { diagnoseStreamFailure, type StreamFailureKind } from "@/lib/stream-failure";
import { canSeekInPlace, waitForSeekableUrl } from "@/lib/seek";
import {
	PLAY_THRESHOLD_SECONDS,
	advanceQueue,
	claimBackgroundPersist,
	createTrackSession,
	shouldNotifySkip,
	startVolume,
	type TrackSession,
} from "@/components/audio/engine/session";
import {
	createAutoSkip,
	createTimerBag,
	sameTarget,
	type PlaybackTarget,
	type SkipReason,
} from "@/components/audio/engine/timers";
import { presignedUrls, proxyUrl } from "@/components/audio/engine/presigned-urls";
import {
	cacheListenedTrack,
	createAudioElement,
	disposePrefetchPools,
	evictedAudio,
	persistInBackground,
	preloadTrack,
	queuePreloaded,
	smartPrefetchQueue,
	takePreloaded,
} from "@/components/audio/engine/prefetch";
import { classifySource, needsResign, planRecovery, resolvePlaybackUrl } from "@/components/audio/engine/source";

// Restore cache limit from localStorage
if (typeof window !== "undefined") {
	try {
		const saved = localStorage.getItem("wavelet-cache-limit");
		if (saved) {
			const bytes = parseInt(saved, 10);
			if (!isNaN(bytes) && bytes > 0) setCacheLimit(bytes);
		}
	} catch {}
}

// --- Presigned URLs ---
// One app-wide cache (engine/presigned-urls): reused until shortly before
// each URL's own expiresAt, refused per track after a failure — never a
// session-wide kill switch.
const fetchPresignedUrl = (trackId: string) => presignedUrls.get(trackId);

/**
 * Resolve audio URL for a track. Priority:
 * 1. IndexedDB blob URL (instant, zero network)
 * 2. Presigned R2 URL (direct browser streaming for cached tracks)
 * 3. Progressive endpoint (live decrypts from Deezer; redirects to /stream once cached)
 */
function getTrackUrl(trackId: string, opts: { skipBlob?: boolean } = {}): Promise<string> {
	return resolvePlaybackUrl(trackId, {
		urls: presignedUrls,
		blobUrl: getCachedBlobUrl,
		pageProtocol: window.location.protocol,
		skipBlob: opts.skipBlob,
	});
}

// Prefetch pools, warm levels and background fills live in engine/prefetch;
// warmTrack / preloadTrack stay importable from here.
export { warmTrack, preloadTrack, type WarmOptions } from "@/components/audio/engine/prefetch";

/**
 * Log a "real" play (≥30s of continuous playback) so the track joins the
 * user's recently-played history. Cap-aware on the server side.
 */
async function logRecentPlay(track: {
	trackId: string;
	title: string;
	artist: string;
	album?: string | null;
	albumId?: string | null;
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
				album: track.album ?? null,
				albumId: track.albumId ?? null,
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
 * threshold so its Blob file can be evicted (if no other user listened to it).
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
 * Drives full-track playback from Blob using imperatively managed Audio objects.
 * Pre-buffers adjacent tracks in the queue for instant playback.
 * Also manages the Media Session API for OS-level media controls.
 */
const RESUME_KEY = "wavelet-resume";
// How long before the end of a track an uncached next track may start
// buffering through the live preview stream.
const LIVE_PRELOAD_LEAD_S = 30;
const RESUME_TTL_MS = 24 * 60 * 60 * 1000;

export function AudioEngine() {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const prevTrackIdRef = useRef<string | null>(null);
	// Flag to skip play/pause effect when loadTrack already handled playback
	const skipPlayEffectRef = useRef(false);
	// Generation counter to cancel stale track loads on rapid switching
	const loadGenRef = useRef(0);
	// Position to seek to after the first track-load completes (refresh/HMR
	// session restore). Cleared after use or on a different track-change.
	const resumePositionRef = useRef<number | null>(null);

	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const volume = usePlayerStore((s) => s.volume);
	const repeat = usePlayerStore((s) => s.repeat);
	const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
	const setDuration = usePlayerStore((s) => s.setDuration);
	const next = usePlayerStore((s) => s.next);
	const prev = usePlayerStore((s) => s.prev);
	const router = useRouter();
	const pause = usePlayerStore((s) => s.pause);
	const resume = usePlayerStore((s) => s.resume);

	const setBuffering = usePlayerStore((s) => s.setBuffering);
	const setBuffered = usePlayerStore((s) => s.setBuffered);
	const setError = usePlayerStore((s) => s.setError);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);

	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewIsPlaying = usePreviewStore((s) => s.isPlaying);

	// Per-track state (play logging, retries, auto-advance…) — replaced as a
	// whole by beginTrack() whenever a track becomes current.
	const sessionRef = useRef<TrackSession | null>(null);
	const MAX_RETRIES = 2;
	// Consecutive track failures across the queue. If too many tracks fail
	// back-to-back, stop auto-skipping and show a clearer error so we don't
	// silently burn through the whole queue.
	const consecutiveFailuresRef = useRef(0);
	const MAX_CONSECUTIVE_FAILURES = 3;
	// Set right before the queue advances on its own (ended, auto-skip): the
	// next track starts without a fade-in.
	const autoAdvanceRef = useRef(false);

	// Retry / auto-skip timers of the current track: cleared on every track
	// change and reload, and re-checked against the current target on fire.
	const [timers] = useState(createTimerBag);
	const [autoSkip] = useState(() =>
		createAutoSkip({
			timers,
			currentTrackId: () => usePlayerStore.getState().currentTrack?.trackId ?? null,
		})
	);
	const currentTarget = useCallback(
		(): PlaybackTarget => ({
			gen: loadGenRef.current,
			element: audioRef.current,
			trackId: sessionRef.current?.trackId ?? null,
		}),
		[]
	);

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
		onProgress: () => {},
	});

	const attachEvents = useCallback((audio: HTMLAudioElement) => {
		audio.oncanplay = () => handlersRef.current.onCanPlay();
		audio.ontimeupdate = () => handlersRef.current.onTimeUpdate();
		audio.onended = () => handlersRef.current.onEnded();
		audio.onerror = () => handlersRef.current.onError();
		audio.onloadedmetadata = () => handlersRef.current.onLoadedMetadata();
		audio.onwaiting = () => handlersRef.current.onWaiting();
		audio.onplaying = () => handlersRef.current.onPlaying();
		audio.onprogress = () => handlersRef.current.onProgress();
	}, []);

	const detachEvents = useCallback((audio: HTMLAudioElement) => {
		audio.oncanplay = null;
		audio.ontimeupdate = null;
		audio.onended = null;
		audio.onerror = null;
		audio.onloadedmetadata = null;
		audio.onwaiting = null;
		audio.onplaying = null;
		audio.onprogress = null;
	}, []);

	// Element-level activation. Every element that becomes the playing one —
	// fresh load, preload hit, crossfade, head→full handoff, retry, source
	// swap — goes through here.
	const activateElement = useCallback(
		(audio: HTMLAudioElement, track: { duration: number | null } | null = null) => {
			audioRef.current = audio;
			attachEvents(audio);
			// A prefetched element fired loadedmetadata before we listened:
			// report its duration now (was: a crossfaded track kept the
			// previous track's duration).
			if (audio.readyState >= 1 && isFinite(audio.duration) && audio.duration > 0) {
				setDuration(audio.duration);
			} else if (track) {
				setDuration(track.duration ?? 0);
			}
		},
		[attachEvents, setDuration]
	);

	// First play() of an element: a user-initiated start fades in, a queue
	// advance starts at full volume.
	const startPlayback = useCallback((audio: HTMLAudioElement) => {
		const session = sessionRef.current;
		const target = usePlayerStore.getState().volume / 100;
		const { from, fadeMs } = startVolume(!!session?.autoAdvance, target);
		if (session) session.autoAdvance = false;
		audio.volume = from;
		audio.play().catch(() => {});
		// duration 0 still cancels a fade-out left running on this element
		adjustVolume(audio, target, { duration: fadeMs });
	}, []);

	const pendingSeekRef = useRef<{ target: number } | null>(null);

	// Track-level activation: ends the previous track's session (skip
	// notification) and starts a fresh one. Both paths that change the
	// current track — the load effect and the crossfade — go through here.
	const beginTrack = useCallback(
		(trackId: string) => {
			const prev = sessionRef.current;
			if (prev && prev.trackId !== trackId && shouldNotifySkip(prev)) {
				notifyTrackSkipped(prev.trackId);
			}
			sessionRef.current = createTrackSession(trackId, { autoAdvance: autoAdvanceRef.current });
			autoAdvanceRef.current = false;
			prevTrackIdRef.current = trackId;
			// Timers of the previous track must never fire on this one.
			timers.clear();
			autoSkip.cancel();
			pendingSeekRef.current = null;
			normMeasuredRef.current = false;
			resetNormGain();
			setError(null);
		},
		[timers, autoSkip, setError]
	);

	// Hand off from a head-prefetched audio element (~3s buffered) to the
	// full progressive stream so playback continues seamlessly past the head.
	// We open the full stream right after the swap and ride out the head
	// segment; once the head approaches its end we copy state, swap refs,
	// and seek the full element to the head's position.
	const handoffFullStream = useCallback(
		(headAudio: HTMLAudioElement, trackId: string, gen: number) => {
			const fullAudio = createAudioElement();
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

				activateElement(fullAudio);
				try {
					fullAudio.currentTime = seekTo;
				} catch {
					// Seek may throw if not enough buffered; the audio element
					// will handle it by re-buffering and seeking when ready.
				}
				fullAudio.volume = userVol;
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
		[activateElement, detachEvents]
	);

	// --- Restore playback position from previous session ---
	// Two paths:
	//  1. HMR / fast-refresh: the Zustand store is module-level and survives
	//     module reloads, so currentTime stays >0 if it was set.
	//  2. Full page refresh / tab close+reopen: the store rehydrates from
	//     localStorage but currentTime is not in `partialize`, so we use a
	//     dedicated localStorage entry written on pagehide.
	useEffect(() => {
		if (typeof window === "undefined") return;

		const track = usePlayerStore.getState().currentTrack;
		if (!track) return;

		const storeTime = usePlayerStore.getState().currentTime;
		if (storeTime > 1) {
			resumePositionRef.current = storeTime;
			return;
		}

		try {
			const raw = localStorage.getItem(RESUME_KEY);
			if (!raw) return;
			localStorage.removeItem(RESUME_KEY);
			const data = JSON.parse(raw) as { trackId?: string; time?: number; ts?: number };
			if (
				data?.trackId === track.trackId &&
				typeof data.time === "number" &&
				data.time > 1 &&
				Date.now() - (data.ts ?? 0) < RESUME_TTL_MS
			) {
				resumePositionRef.current = data.time;
				// Reflect in the store so SeekBar shows the right position before
				// the audio element actually loads + seeks.
				usePlayerStore.getState().setCurrentTime(data.time);
			}
		} catch {
			// Corrupt entry — ignore
		}
	}, []);

	// Save current position on pagehide / tab hide so we can resume on refresh.
	// pagehide fires reliably on close + bfcache; visibilitychange catches
	// mobile background → kill scenarios where pagehide may not run.
	useEffect(() => {
		if (typeof window === "undefined") return;
		const save = () => {
			const audio = audioRef.current;
			const track = usePlayerStore.getState().currentTrack;
			if (!audio || !track) return;
			const time = audio.currentTime;
			if (!isFinite(time) || time < 1) return;
			try {
				localStorage.setItem(
					RESUME_KEY,
					JSON.stringify({ trackId: track.trackId, time, ts: Date.now() })
				);
			} catch {
				// Quota or disabled storage — non-fatal
			}
		};
		const onVisibility = () => {
			if (document.visibilityState === "hidden") save();
		};
		window.addEventListener("pagehide", save);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			window.removeEventListener("pagehide", save);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	// --- Seeking on the live (range-less) stream ---
	// /stream-progressive is served without byte ranges: setting currentTime
	// past what the browser holds makes it restart the track from 0. Instead,
	// hang up the live stream (the server then drains Deezer at full speed into
	// Blob), wait for the persisted file and reopen it — Blob URLs support
	// Range — at the requested position. While a seek is pending, further
	// seeks only move its target (pendingSeekRef).
	const swapSource = useCallback(
		(url: string, position: number | null) => {
			const old = audioRef.current;
			++loadGenRef.current;
			timers.clear();
			if (old) {
				detachEvents(old);
				old.pause();
				old.src = "";
				evictedAudio.add(old);
			}
			resumePositionRef.current = position;
			const audio = createAudioElement();
			activateElement(audio);
			audio.src = url;
			audio.load();
		},
		[activateElement, detachEvents, timers]
	);

	// Point the current element at another URL of the same track and resume
	// where it was (error recovery). Dropped if the engine moved on while the
	// URL was being resolved.
	const reloadFrom = useCallback(
		(audio: HTMLAudioElement, url: Promise<string>, position: number) => {
			const scheduled = currentTarget();
			setBuffering(true);
			void url.then((next) => {
				if (!sameTarget(scheduled, currentTarget())) return;
				pendingSeekRef.current = null;
				resumePositionRef.current = isFinite(position) && position >= 1 ? position : null;
				audio.src = next;
				audio.load();
			});
		},
		[currentTarget, setBuffering]
	);

	const seekViaPersistedFile = useCallback(
		(audio: HTMLAudioElement, trackId: string, target: number) => {
			setCurrentTime(target);
			if (pendingSeekRef.current) {
				pendingSeekRef.current.target = target;
				return;
			}
			const pending = { target };
			pendingSeekRef.current = pending;
			const gen = loadGenRef.current;
			setBuffering(true);

			if (claimBackgroundPersist(sessionRef.current, audio.src)) persistInBackground(trackId);
			// Hang up so the server persists at network speed, not playback pace.
			// Events go first: emptying src fires an error on some browsers.
			detachEvents(audio);
			audio.pause();
			audio.src = "";

			const cancelled = () => pendingSeekRef.current !== pending || loadGenRef.current !== gen;
			void waitForSeekableUrl({
				resolve: () => fetchPresignedUrl(trackId),
				isCancelled: cancelled,
			}).then((url) => {
				if (cancelled()) return;
				pendingSeekRef.current = null;
				if (url) {
					swapSource(url, pending.target);
				} else {
					// Never persisted in time — restart the live stream rather
					// than leave the player silent.
					setCurrentTime(0);
					swapSource(`/api/v1/stream-progressive/${trackId}`, null);
				}
			});
		},
		[detachEvents, setBuffering, setCurrentTime, swapSource]
	);

	const applyResumePosition = useCallback(
		(audio: HTMLAudioElement) => {
			const resume = resumePositionRef.current;
			if (resume === null) return;
			resumePositionRef.current = null;
			const dur = audio.duration;
			if (!isFinite(dur) || dur <= 0 || resume >= dur - 1) return;
			const track = usePlayerStore.getState().currentTrack;
			if (
				track &&
				!canSeekInPlace({ src: audio.src, target: resume, seekable: audio.seekable, buffered: audio.buffered })
			) {
				seekViaPersistedFile(audio, track.trackId, resume);
				return;
			}
			try {
				audio.currentTime = resume;
				setCurrentTime(resume);
			} catch {
				// Buffer might not cover seek target yet — browser will catch up
			}
		},
		[setCurrentTime, seekViaPersistedFile]
	);

	// --- Initialize audio element (client-only) ---
	useEffect(() => {
		if (!audioRef.current) {
			const audio = createAudioElement();
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
			// Clean up preload pools and cancel background prefetch
			disposePrefetchPools();
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

		// Immediate preload of the adjacent tracks (in-memory Audio elements for
		// instant swap) — cached copies only: an uncached next track is preloaded
		// live near the end of this one (onTimeUpdate), never persisted.
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
		presignedUrls.warm(upcoming);

		// Background IndexedDB prefetch: PREFETCH_LIMIT tracks around the
		// cursor, only those the server already cached.
		smartPrefetchQueue(queue, queueIndex);
	}, [currentTrack]);

	// --- Load new track ---
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		if (!currentTrack) {
			// Stopping playback (queue cleared / explicit stop). If the last
			// track wasn't counted, it's a skip.
			if (shouldNotifySkip(sessionRef.current)) notifyTrackSkipped(sessionRef.current.trackId);
			sessionRef.current = null;
			timers.clear();
			autoSkip.cancel();
			audio.pause();
			audio.src = "";
			prevTrackIdRef.current = null;
			return;
		}

		if (currentTrack.trackId !== prevTrackIdRef.current) {
			// Drop any pending resume position when the user navigates to a
			// different track before the first one finishes loading.
			if (prevTrackIdRef.current !== null) {
				resumePositionRef.current = null;
			}
			// Ends the previous session (skip notification if it never
			// reached 30 s) and resets every per-track flag.
			beginTrack(currentTrack.trackId);

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
			const gen = ++loadGenRef.current;

			// Immediately kill the old audio — hard stop, no fade
			detachEvents(audio);
			audio.pause();
			audio.src = "";
			evictedAudio.add(audio);

			// Pick the best prefetched element, in order of buffer richness:
			//   1. queue preload (next/prev — cached copy or live preview stream)
			//   2. hover preload  (preview-mode full stream, ~30s buffered)
			//   3. head preload   (preview-mode head — ~3s buffered, must
			//                      transition to full stream when it ends)
			const taken = takePreloaded(currentTrack.trackId);
			const preloaded = taken?.audio;

			if (preloaded) {
				activateElement(preloaded, currentTrack);

				// If we swapped onto a head-prefetched element, kick off the
				// full stream now so it can take over before the head runs
				// out. The full stream goes through normal /stream-progressive
				// (no preview, persisting) — first listen, server downloads
				// from Deezer once and persists; subsequent plays hit Blob.
				if (taken.head) handoffFullStream(preloaded, currentTrack.trackId, gen);

				if (preloaded.readyState >= 2) {
					// Already buffered — play immediately
					setBuffering(false);
					applyResumePosition(preloaded);
					if (usePlayerStore.getState().isPlaying) {
						skipPlayEffectRef.current = true;
						startPlayback(preloaded);
					}
				}
				// If not ready yet, onCanPlay will fire and handle playback
			} else {
				// No preloaded data — load normally on a fresh element
				const newAudio = createAudioElement();
				activateElement(newAudio, currentTrack);

				getTrackUrl(currentTrack.trackId).then((url) => {
					if (loadGenRef.current !== gen) return;
					newAudio.src = url;
					newAudio.load();
				});
			}
		}
	}, [currentTrack, activateElement, beginTrack, startPlayback, detachEvents, applyResumePosition, timers, autoSkip, handoffFullStream, setBuffering]);

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
			// Resuming after a long pause on a presigned URL that expired (C1
			// expiresAt): sign it again and resume at the same position instead
			// of letting the next range request fail with a 403.
			if (
				audio.readyState >= 1 &&
				needsResign({
					usableUntil: presignedUrls.usableUntil(audio.src),
					now: Date.now(),
					currentTime: audio.currentTime,
					duration: audio.duration,
					buffered: audio.buffered,
				})
			) {
				const trackId = currentTrack.trackId;
				presignedUrls.invalidate(trackId);
				reloadFrom(
					audio,
					presignedUrls.get(trackId).then((url) => url ?? proxyUrl(trackId)),
					audio.currentTime
				);
				return;
			}
			if (audio.readyState >= 2) startPlayback(audio);
		} else {
			adjustVolume(audio, 0, { duration: 500 }).then(() => {
				if (!usePlayerStore.getState().isPlaying) {
					audio.pause();
				}
			});
		}
	}, [isPlaying, currentTrack, startPlayback, reloadFrom]);

	// Volume — smooth transition
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !isPlaying) return;
		adjustVolume(audio, volume / 100, { duration: 300 });
	}, [volume, isPlaying]);

	// Normalization toggle — reset gain when turned off
	useEffect(() => {
		if (!normalizationEnabled) {
			normMeasuredRef.current = false;
			resetNormGain();
		}
	}, [normalizationEnabled]);

	// Retry: bumped by retryTrack() — reload the current track from scratch.
	// We preserve the current playback position across the reload so the
	// user stays on the same timeline instead of jumping back to 0.
	// applyResumePosition picks the captured time up on canplay.
	const retryLoadCount = usePlayerStore((s) => s._retryLoadCount);
	const prevRetryRef = useRef(retryLoadCount);
	useEffect(() => {
		if (retryLoadCount === prevRetryRef.current) return;
		prevRetryRef.current = retryLoadCount;
		const track = currentTrack;
		const audio = audioRef.current;
		if (!track || !audio) return;

		// Capture position before tearing the old element down. Anything <1s
		// is treated as "near the start" and skipped — that's the recovery
		// case where there's nothing to preserve.
		const liveTime = pendingSeekRef.current?.target ?? audio.currentTime;
		pendingSeekRef.current = null;
		if (isFinite(liveTime) && liveTime >= 1) {
			resumePositionRef.current = liveTime;
		}

		// Same track, fresh attempt: drop its retry budget and any pending
		// retry / auto-skip timer (was: "Retry" in the toast was followed by
		// the auto-skip that was still armed).
		if (sessionRef.current) sessionRef.current.retryCount = 0;
		timers.clear();
		autoSkip.cancel();
		setError(null);
		setBuffering(true);
		// Force a clean reload — new audio element to drop any error state.
		const gen = ++loadGenRef.current;
		detachEvents(audio);
		audio.pause();
		audio.src = "";
		evictedAudio.add(audio);
		const newAudio = createAudioElement();
		activateElement(newAudio);
		getTrackUrl(track.trackId).then((url) => {
			if (loadGenRef.current !== gen) return;
			newAudio.src = url;
			newAudio.load();
		});
	}, [retryLoadCount, currentTrack, activateElement, detachEvents, setBuffering, setError, timers, autoSkip]);

	// Seek: respond to _seekTo signal from prev() restart or seek()
	const seekTo = usePlayerStore((s) => s._seekTo);
	useEffect(() => {
		if (seekTo === null) return;
		const audio = audioRef.current;
		const track = usePlayerStore.getState().currentTrack;
		if (audio && track && pendingSeekRef.current) {
			seekViaPersistedFile(audio, track.trackId, seekTo);
		} else if (audio) {
			if (
				track &&
				audio.readyState >= 1 &&
				!canSeekInPlace({ src: audio.src, target: seekTo, seekable: audio.seekable, buffered: audio.buffered })
			) {
				seekViaPersistedFile(audio, track.trackId, seekTo);
			} else if (audio.readyState >= 1 && isFinite(audio.duration) && audio.duration > 0) {
				try {
					audio.currentTime = seekTo;
				} catch {
					// Buffer not yet covering the seek target — fall through to
					// queue it for after canplay/loadedmetadata.
					resumePositionRef.current = seekTo;
				}
			} else {
				// Audio metadata isn't loaded yet — defer the seek to canplay.
				resumePositionRef.current = seekTo;
			}
		}
		// Clear the signal so it doesn't re-fire
		usePlayerStore.setState({ _seekTo: null });
	}, [seekTo, seekViaPersistedFile]);

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

	// --- Event handlers (always point to the latest closures) ---
	// Assigned after every commit rather than during render: refs must not
	// be written while rendering.
	useEffect(() => {
		handlersRef.current.onCanPlay = () => {
			const audio = audioRef.current;
			if (!audio) return;
			setBuffering(false);
			setDuration(audio.duration || 0);
			applyResumePosition(audio);
			onPositionUpdate();
			if (usePlayerStore.getState().isPlaying) {
				// Only start (and fade in) if not already playing — prevents a
				// double fade when canplay fires after we already started the element.
				if (audio.paused) startPlayback(audio);
				else adjustVolume(audio, usePlayerStore.getState().volume / 100, { duration: 200 });
			}
		};

		handlersRef.current.onTimeUpdate = () => {
			const audio = audioRef.current;
			if (!audio) return;
			// Don't write timeUpdates back to the store while a seek is pending —
			// audio.currentTime may briefly be the pre-seek value, which would
			// rubber-band the SeekBar visually after the user releases.
			if (usePlayerStore.getState()._seekTo !== null || pendingSeekRef.current) {
				onPositionUpdate();
				return;
			}
			// Throttle store writes to ~4Hz to avoid excessive re-renders
			const now = audio.currentTime;
			const last = usePlayerStore.getState().currentTime;
			if (Math.abs(now - last) >= 0.25) {
				setCurrentTime(now);
			}
			onPositionUpdate();

			// Spotify rule: count a real play once playback crosses 30s.
			// This is the moment the track "joins" the user's recently-played
			// history and its Blob file is locked from eviction-on-skip.
			const track = usePlayerStore.getState().currentTrack;
			const session = sessionRef.current;
			if (
				track &&
				session &&
				!session.logged &&
				session.trackId === track.trackId &&
				audio.currentTime >= PLAY_THRESHOLD_SECONDS
			) {
				session.logged = true;
				void logRecentPlay({
					trackId: track.trackId,
					title: track.title,
					artist: track.artist,
					album: track.album,
					albumId: track.albumId,
					cover: track.cover,
					duration: track.duration,
				});

				// If this track is playing from a preview-mode prefetch, the server
				// didn't persist it — start a persisting stream in the background
				// (once per play).
				if (claimBackgroundPersist(session, audio.src || "")) persistInBackground(track.trackId);
				// A track really listened to is worth keeping in IndexedDB: read
				// from its presigned R2 URL, not a second trip through the server.
				if (classifySource(audio.src) !== "blob") void cacheListenedTrack(track.trackId);
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

			// Preload the next track: a cached copy from halfway through; an
			// uncached one only through the live preview stream, and only close
			// to the end so it neither persists nor idles on a server function.
			if (audio.duration > 0) {
				const left = audio.duration - audio.currentTime;
				const live = left <= Math.max(LIVE_PRELOAD_LEAD_S, crossfadeDuration + 10);
				if (live || audio.currentTime / audio.duration > 0.5) {
					const { queue, queueIndex } = usePlayerStore.getState();
					if (queueIndex + 1 < queue.length) preloadTrack(queue[queueIndex + 1].trackId, { live });
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
				const { queue, queueIndex, repeat: rep } = usePlayerStore.getState();

				// Determine next queue index (mirrors next() logic). The queue is
				// already in physical play order — shuffle just reorders it ahead
				// of time — so plain queueIndex+1 covers both modes.
				let nextQueueIndex = -1;
				if (queueIndex + 1 < queue.length) nextQueueIndex = queueIndex + 1;
				else if (rep === "all") nextQueueIndex = 0;

				if (nextQueueIndex >= 0) {
					const nextTrack = queue[nextQueueIndex];
					const preloaded = queuePreloaded(nextTrack.trackId);

					if (preloaded && preloaded.readyState >= 3) {
						crossfadeActiveRef.current = true;
						const fadeDuration = timeLeft * 1000;

						// Detach events from outgoing audio so its onended doesn't trigger next()
						const outgoing = audio;
						detachEvents(outgoing);
						outgoingAudioRef.current = outgoing;

						// Swap to incoming audio. beginTrack runs the same per-track
						// reset as the load effect, which next() below then skips
						// (was: plays via crossfade were never logged, the duration,
						// retry budget and normalisation stayed the previous track's).
						takePreloaded(nextTrack.trackId);
						autoAdvanceRef.current = true;
						beginTrack(nextTrack.trackId);
						activateElement(preloaded, nextTrack);
						skipPlayEffectRef.current = true;

						preloaded.volume = 0;
						preloaded.currentTime = 0;
						preloaded.play().catch(() => {});

						const targetVol = usePlayerStore.getState().volume / 100;
						adjustVolume(outgoing, 0, { duration: fadeDuration });
						adjustVolume(preloaded, targetVol, { duration: fadeDuration });

						// Advance store state to next track
						usePlayerStore.getState().next();
						// next() flags the new track as buffering; this one is already playing.
						setBuffering(false);

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
				// Queue advance: the next track starts without a fade-in.
				advanceQueue(autoAdvanceRef, true, usePlayerStore);
			}
		};

		handlersRef.current.onError = () => {
			const audio = audioRef.current;
			if (!audio || !currentTrack) return;
			const src = audio.src;
			const mediaErr = audio.error;
			const session = sessionRef.current;
			const source = classifySource(src, window.location.origin);
			console.warn("[AudioEngine] playback error", {
				trackId: currentTrack.trackId,
				title: currentTrack.title,
				src,
				source,
				currentSrc: audio.currentSrc,
				retryCount: session?.retryCount,
				mediaErrorCode: mediaErr?.code,
				mediaErrorMessage: mediaErr?.message,
				networkState: audio.networkState,
				readyState: audio.readyState,
			});

			// A signed-out session gets the same 401 on every retry — go straight
			// to the diagnosis instead of burning the retry budget.
			const { isAuthenticated, isLoading: authLoading } = useAuthStore.getState();
			const knownGuest = !authLoading && !isAuthenticated;
			const trackId = currentTrack.trackId;
			const position = pendingSeekRef.current?.target ?? audio.currentTime;
			const recovery = planRecovery({
				source,
				resigned: !!session?.resigned,
				urlExpired: presignedUrls.isExpired(src),
				retryCount: session?.retryCount ?? MAX_RETRIES,
				maxRetries: MAX_RETRIES,
				knownGuest,
			});

			switch (recovery.action) {
				case "evict-blob":
					// Corrupt IndexedDB copy: remove it and play from the network
					// (was: a bad blob disabled presigned URLs and stayed cached).
					void removeCached(trackId);
					reloadFrom(audio, getTrackUrl(trackId, { skipBlob: true }), position);
					return;
				case "resign":
					// The presigned URL most likely expired during a long pause:
					// sign it again once and resume at the same position.
					if (session) session.resigned = true;
					presignedUrls.invalidate(trackId);
					reloadFrom(
						audio,
						presignedUrls.get(trackId).then((url) => url ?? proxyUrl(trackId)),
						position
					);
					return;
				case "proxy":
					// Presigned playback failed for this track: refuse it for this
					// track only (was: a session-wide kill switch) and resume on the
					// range-capable proxy.
					presignedUrls.deny(trackId);
					reloadFrom(audio, Promise.resolve(proxyUrl(trackId)), position);
					return;
				case "retry": {
					// The timer is bound to this element and this track: a track
					// change, a reload or a manual retry clears it, and it re-checks
					// on fire (was: the retry loaded the old track's stream into the
					// next track's element).
					if (session) session.retryCount++;
					const scheduled = currentTarget();
					timers.after(recovery.delayMs, () => {
						if (!sameTarget(scheduled, currentTarget())) return;
						audio.src = `/api/v1/stream-progressive/${trackId}`;
						audio.load();
					});
					return;
				}
			}

			// All retries exhausted — fetch the route once with credentials so we
			// can surface the server's actual error (the <audio> element only sees
			// "Format error") and react to account-wide failures.
			const failingTrack = currentTrack;
			void diagnoseStreamFailure(`/api/v1/stream-progressive/${failingTrack.trackId}`).then(
				(diagnosis) => {
					if (diagnosis.error) {
						console.error("[AudioEngine] giving up — fetch failed", diagnosis.error);
					} else if (diagnosis.status && diagnosis.status >= 400) {
						console.error(`[AudioEngine] giving up — server says ${diagnosis.status}`, {
							trackId: failingTrack.trackId,
							finalUrl: diagnosis.url,
							errorCode: diagnosis.code,
							errorMessage: diagnosis.message,
							body: diagnosis.body,
						});
					}
					// The user moved on while we were probing — nothing to report.
					if (usePlayerStore.getState().currentTrack?.trackId !== failingTrack.trackId) return;
					handleGiveUp(failingTrack, diagnosis.kind);
				}
			);
		};

		const skipTo = (reason: SkipReason) => advanceQueue(autoAdvanceRef, reason === "auto", usePlayerStore);

		const handleGiveUp = (failingTrack: PlayerTrack, kind: StreamFailureKind) => {
			// Auth / Deezer problems fail every track the same way: stop here
			// instead of skipping through the queue with "Can't play".
			if (kind === "auth" || kind === "deezer") {
				consecutiveFailuresRef.current = 0;
				pause();
				const signIn = kind === "auth";
				const title = signIn ? "Sign in to play full tracks" : "Connect your Deezer account";
				setError(title);
				toast.error(title, {
					id: "stream-account-error",
					description: signIn
						? "Your session has expired or you're not signed in."
						: "Add a valid Deezer ARL in Settings to stream tracks.",
					duration: 10000,
					action: {
						label: signIn ? "Sign in" : "Settings",
						// Client-side navigation: a full load would stop playback and reset the app.
						onClick: () => router.push(signIn ? "/login" : "/settings"),
					},
				});
				return;
			}

			// Count this as a queue-wide failure
			consecutiveFailuresRef.current++;

			if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
				// Multiple tracks failing back-to-back almost always means a
				// network/auth problem, not isolated bad files. Stop auto-skipping
				// so we don't silently chew through the queue.
				setError(`Multiple tracks failed to load. Check your connection.`);
				pause();
				toast.error("Multiple tracks failed to load", {
					description: "Check your connection and try again.",
					duration: 8000,
					action: {
						label: "Retry",
						onClick: () => {
							consecutiveFailuresRef.current = 0;
							usePlayerStore.getState().retryTrack();
						},
					},
				});
				return;
			}

			setError(`Can't play "${failingTrack.title}"`);
			const { queue, queueIndex } = usePlayerStore.getState();
			const hasNext = queueIndex + 1 < queue.length;

			// The auto-skip only ever skips the failing track, once: "Skip",
			// "Retry" or a manual track change cancel it (was: an unconditional
			// setTimeout(next) skipped twice after "Skip", skipped after "Retry"
			// and skipped a track picked by hand in the meantime).
			toast.error(`Can't play "${failingTrack.title}"`, {
				description: failingTrack.artist,
				duration: hasNext ? 5000 : 8000,
				action: {
					label: "Retry",
					onClick: () => {
						autoSkip.cancel();
						usePlayerStore.getState().retryTrack();
					},
				},
				cancel: hasNext
					? {
							label: "Skip",
							onClick: () => autoSkip.skipNow(failingTrack.trackId, skipTo),
						}
					: undefined,
			});

			if (hasNext) {
				autoSkip.arm(failingTrack.trackId, 1500, skipTo);
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
			// Successful playback resets the consecutive-failure streak.
			consecutiveFailuresRef.current = 0;
		};

		handlersRef.current.onProgress = () => {
			const audio = audioRef.current;
			if (!audio) return;
			const ranges = audio.buffered;
			if (ranges.length === 0) {
				setBuffered(0);
				return;
			}
			// Use the end of the last range — for HLS-like progressive streams this
			// reflects how much the browser has buffered ahead of currentTime.
			setBuffered(ranges.end(ranges.length - 1));
		};
	});

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
