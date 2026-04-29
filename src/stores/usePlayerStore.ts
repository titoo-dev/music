import { create } from "zustand";
import { persist } from "zustand/middleware";
import { haptic } from "@/utils/haptic";

export interface PlayerTrack {
	trackId: string;
	title: string;
	artist: string;
	cover: string | null;
	duration: number | null;
}

type RepeatMode = "off" | "all" | "one";

/**
 * Fisher-Yates shuffle, returns a new array. Pure helper — does not mutate.
 */
function shuffleArray<T>(arr: T[]): T[] {
	const out = arr.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

interface PlayerState {
	currentTrack: PlayerTrack | null;
	queue: PlayerTrack[];
	queueIndex: number;
	isPlaying: boolean;
	isBuffering: boolean;
	volume: number;
	/** Last volume > 0, used by toggleMute to restore. */
	_lastNonZeroVolume: number;
	currentTime: number;
	duration: number;
	/** Last buffered end position (seconds) reported by the audio element. */
	buffered: number;
	shuffle: boolean;
	repeat: RepeatMode;
	/** Set by prev()/seek() to signal AudioEngine to seek; AudioEngine clears it after seeking. */
	_seekTo: number | null;
	/** Counter bumped by retryTrack() — AudioEngine watches it to force a reload. */
	_retryLoadCount: number;
	/** Playback error message, null when no error. */
	error: string | null;
	fullscreenOpen: boolean;
	/** Whether the "Up Next" queue panel is open. */
	queuePanelOpen: boolean;

	// P2 features
	sleepTimerEnd: number | null;
	playbackRate: number;
	crossfadeDuration: number;
	normalizationEnabled: boolean;

	play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
	pause: () => void;
	resume: () => void;
	toggle: () => void;
	stop: () => void;
	next: () => void;
	prev: () => void;
	/** Like prev() but always goes to previous track (no restart-if->3s). Used by fullscreen swipe. */
	prevTrack: () => void;
	/** Seek to a specific time (seconds). Updates currentTime immediately and signals AudioEngine. */
	seek: (time: number) => void;
	/** Force a reload of the current track (after a playback failure). */
	retryTrack: () => void;
	setError: (error: string | null) => void;
	setVolume: (v: number) => void;
	/** Toggle mute: 0 → last non-zero volume, anything else → 0. */
	toggleMute: () => void;
	setCurrentTime: (t: number) => void;
	setDuration: (d: number) => void;
	setBuffered: (b: number) => void;
	setBuffering: (b: boolean) => void;
	toggleShuffle: () => void;
	toggleRepeat: () => void;
	setFullscreenOpen: (v: boolean) => void;
	setQueuePanelOpen: (v: boolean) => void;
	/** Jump directly to a queue index (used by Queue panel click-to-play). */
	jumpToIndex: (index: number) => void;
	playQueue: (queue: PlayerTrack[], startIndex?: number) => void;
	setSleepTimer: (minutes: number | null) => void;
	setPlaybackRate: (rate: number) => void;
	setCrossfadeDuration: (seconds: number) => void;
	toggleNormalization: () => void;

	// Queue management (P2)
	/** Insert a track right after the current track ("Play Next"). */
	addNext: (track: PlayerTrack) => void;
	/** Append a track to the end of the queue ("Add to Queue"). */
	addToQueue: (track: PlayerTrack) => void;
	/** Remove a track from the queue by its queue index. */
	removeFromQueue: (index: number) => void;
	/** Move a track within the queue (drag-reorder). */
	moveInQueue: (from: number, to: number) => void;
	/** Clear the queue except the currently playing track. */
	clearQueue: () => void;
}

/** Navigate to a queue index, setting it as the current track. */
function goToIndex(queueIndex: number, queue: PlayerTrack[]): Partial<PlayerState> {
	return {
		currentTrack: queue[queueIndex],
		queueIndex,
		isPlaying: true,
		isBuffering: true,
		currentTime: 0,
		buffered: 0,
		error: null,
	};
}

/**
 * Build a queue with `start` placed at index 0 and the rest shuffled.
 * Used when starting playback with shuffle ON — the tapped track plays first,
 * then everything else plays in randomised order.
 */
function shuffleAround(queue: PlayerTrack[], startIndex: number): PlayerTrack[] {
	if (queue.length <= 1) return queue.slice();
	const start = queue[startIndex];
	const rest = queue.filter((_, i) => i !== startIndex);
	return [start, ...shuffleArray(rest)];
}

export const usePlayerStore = create<PlayerState>()(
	persist(
		(set, get) => ({
			currentTrack: null,
			queue: [],
			queueIndex: -1,
			isPlaying: false,
			isBuffering: false,
			volume: 80,
			_lastNonZeroVolume: 80,
			currentTime: 0,
			duration: 0,
			buffered: 0,
			shuffle: false,
			repeat: "off" as RepeatMode,
			_seekTo: null,
			_retryLoadCount: 0,
			error: null,
			fullscreenOpen: false,
			queuePanelOpen: false,
			sleepTimerEnd: null,
			playbackRate: 1.0,
			crossfadeDuration: 0,
			normalizationEnabled: false,

			play: (track, queue) => {
				const state = get();
				if (queue) {
					const idx = queue.findIndex((t) => t.trackId === track.trackId);
					const startIdx = idx >= 0 ? idx : 0;
					if (state.shuffle && queue.length > 1) {
						const shuffled = shuffleAround(queue, startIdx);
						set({
							currentTrack: shuffled[0],
							queue: shuffled,
							queueIndex: 0,
							isPlaying: true,
							isBuffering: true,
							currentTime: 0,
							error: null,
						});
					} else {
						set({
							currentTrack: track,
							queue,
							queueIndex: startIdx,
							isPlaying: true,
							isBuffering: true,
							currentTime: 0,
							error: null,
						});
					}
				} else if (state.currentTrack?.trackId === track.trackId) {
					set({ isPlaying: true, error: null });
				} else {
					set({
						currentTrack: track,
						queue: [track],
						queueIndex: 0,
						isPlaying: true,
						isBuffering: true,
						currentTime: 0,
						error: null,
					});
				}
			},

			pause: () => set({ isPlaying: false }),
			resume: () => set({ isPlaying: true }),
			toggle: () => {
				haptic(8);
				set((s) => ({ isPlaying: !s.isPlaying }));
			},
			stop: () => set({
				currentTrack: null, queue: [], queueIndex: -1,
				isPlaying: false, isBuffering: false,
				currentTime: 0, duration: 0, buffered: 0, error: null,
				fullscreenOpen: false, queuePanelOpen: false,
				sleepTimerEnd: null,
			}),

			next: () => {
				const { queue, queueIndex, shuffle, repeat } = get();
				if (queue.length === 0) return;

				const nextQueueIndex = queueIndex + 1;
				if (nextQueueIndex >= queue.length) {
					if (repeat === "all") {
						if (shuffle && queue.length > 1) {
							// Re-shuffle for the next cycle. Place the just-finished
							// track at index 0 to avoid replaying it back-to-back.
							const reshuffled = shuffleAround(queue, queue.length - 1);
							// Now queueIndex moves to 1 (skip the just-played one at 0).
							// But if the user explicitly hit next we should advance: jump to index 1.
							set({ queue: reshuffled, ...goToIndex(1, reshuffled) });
							return;
						}
						set(goToIndex(0, queue));
						return;
					}
					// Queue exhausted — close the player.
					get().stop();
					return;
				}

				set(goToIndex(nextQueueIndex, queue));
			},

			prev: () => {
				const { queue, queueIndex, currentTime, repeat } = get();
				if (queue.length === 0) return;

				// If more than 3 seconds in, restart current track
				if (currentTime > 3) {
					set({ currentTime: 0, _seekTo: 0 });
					return;
				}

				if (queueIndex === 0) {
					if (repeat === "all") {
						set(goToIndex(queue.length - 1, queue));
					} else {
						set({ currentTime: 0, _seekTo: 0 });
					}
					return;
				}

				set(goToIndex(queueIndex - 1, queue));
			},

			prevTrack: () => {
				const { queue, queueIndex, repeat } = get();
				if (queue.length === 0) return;

				if (queueIndex === 0) {
					if (repeat === "all") {
						set(goToIndex(queue.length - 1, queue));
					} else {
						set({ currentTime: 0, _seekTo: 0 });
					}
					return;
				}

				set(goToIndex(queueIndex - 1, queue));
			},

			seek: (time) => {
				const { duration } = get();
				const clamped = Math.max(0, duration > 0 ? Math.min(time, duration) : time);
				set({ currentTime: clamped, _seekTo: clamped });
			},
			retryTrack: () => {
				set((s) => ({
					_retryLoadCount: s._retryLoadCount + 1,
					error: null,
					isPlaying: true,
					isBuffering: true,
				}));
			},
			setError: (error) => set({ error }),
			setVolume: (volume) => {
				// Remember last non-zero volume so mute toggle can restore it
				if (volume > 0) {
					set({ volume, _lastNonZeroVolume: volume });
				} else {
					set({ volume });
				}
			},
			toggleMute: () => {
				haptic(6);
				const { volume, _lastNonZeroVolume } = get();
				if (volume > 0) {
					set({ volume: 0, _lastNonZeroVolume: volume });
				} else {
					set({ volume: _lastNonZeroVolume > 0 ? _lastNonZeroVolume : 80 });
				}
			},
			setCurrentTime: (currentTime) => set({ currentTime }),
			setDuration: (duration) => set({ duration }),
			setBuffered: (buffered) => set({ buffered }),
			setBuffering: (isBuffering) => set({ isBuffering }),

			toggleShuffle: () => {
				const { shuffle, queue, queueIndex } = get();
				if (!shuffle) {
					// Turning ON: shuffle the upcoming tracks. Played tracks and the
					// current track keep their position so history stays coherent.
					if (queue.length <= 1 || queueIndex < 0) {
						set({ shuffle: true });
						return;
					}
					const before = queue.slice(0, queueIndex + 1);
					const after = queue.slice(queueIndex + 1);
					set({
						shuffle: true,
						queue: [...before, ...shuffleArray(after)],
					});
				} else {
					// Turning OFF: keep the current queue order — don't try to restore
					// the original order, which we no longer track.
					set({ shuffle: false });
				}
			},

			setFullscreenOpen: (fullscreenOpen) => set({ fullscreenOpen }),
			setQueuePanelOpen: (queuePanelOpen) => set({ queuePanelOpen }),

			jumpToIndex: (index) => {
				const { queue } = get();
				if (index < 0 || index >= queue.length) return;
				set(goToIndex(index, queue));
			},

			setSleepTimer: (minutes) => {
				set({ sleepTimerEnd: minutes === null ? null : Date.now() + minutes * 60 * 1000 });
			},
			setPlaybackRate: (playbackRate) => set({ playbackRate }),
			setCrossfadeDuration: (crossfadeDuration) => set({ crossfadeDuration }),
			toggleNormalization: () => set((s) => ({ normalizationEnabled: !s.normalizationEnabled })),
			toggleRepeat: () =>
				set((s) => ({
					repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
				})),

			playQueue: (queue, startIndex = 0) => {
				if (queue.length === 0) return;
				const { shuffle } = get();
				if (shuffle && queue.length > 1) {
					const shuffled = shuffleAround(queue, startIndex);
					set({
						queue: shuffled,
						queueIndex: 0,
						currentTrack: shuffled[0],
						isPlaying: true,
						isBuffering: true,
						currentTime: 0,
					});
				} else {
					set({
						queue,
						queueIndex: startIndex,
						currentTrack: queue[startIndex],
						isPlaying: true,
						isBuffering: true,
						currentTime: 0,
					});
				}
			},

			// --- Queue Management (P2) ---

			addNext: (track) => {
				const { queue, queueIndex } = get();
				// If nothing is playing, just start playing this track
				if (queue.length === 0 || queueIndex < 0) {
					get().play(track);
					return;
				}
				// Avoid duplicates: remove existing occurrence first
				const existingIdx = queue.findIndex((t) => t.trackId === track.trackId);
				const newQueue = [...queue];
				let newQueueIndex = queueIndex;

				if (existingIdx >= 0 && existingIdx !== queueIndex) {
					newQueue.splice(existingIdx, 1);
					if (existingIdx < newQueueIndex) newQueueIndex--;
				}

				const insertAt = newQueueIndex + 1;
				newQueue.splice(insertAt, 0, track);

				set({ queue: newQueue, queueIndex: newQueueIndex });
			},

			addToQueue: (track) => {
				const { queue, queueIndex } = get();
				if (queue.length === 0 || queueIndex < 0) {
					get().play(track);
					return;
				}
				if (queue.some((t) => t.trackId === track.trackId)) return;
				set({ queue: [...queue, track] });
			},

			removeFromQueue: (index) => {
				const { queue, queueIndex } = get();
				if (index < 0 || index >= queue.length) return;
				if (index === queueIndex) return;

				const newQueue = [...queue];
				newQueue.splice(index, 1);

				let newQueueIndex = queueIndex;
				if (index < queueIndex) newQueueIndex--;

				set({
					queue: newQueue,
					queueIndex: newQueueIndex,
					currentTrack: newQueue[newQueueIndex],
				});
			},

			moveInQueue: (from, to) => {
				const { queue, queueIndex } = get();
				if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;

				const newQueue = [...queue];
				const [moved] = newQueue.splice(from, 1);
				newQueue.splice(to, 0, moved);

				let newQueueIndex = queueIndex;
				if (from === queueIndex) {
					newQueueIndex = to;
				} else if (from < queueIndex && to >= queueIndex) {
					newQueueIndex--;
				} else if (from > queueIndex && to <= queueIndex) {
					newQueueIndex++;
				}

				set({
					queue: newQueue,
					queueIndex: newQueueIndex,
					currentTrack: newQueue[newQueueIndex],
				});
			},

			clearQueue: () => {
				const { currentTrack, queue } = get();
				if (!currentTrack || queue.length <= 1) return;
				set({
					queue: [currentTrack],
					queueIndex: 0,
				});
			},
		}),
		{
			name: "deemix-player",
			partialize: (state) => ({
				volume: state.volume,
				_lastNonZeroVolume: state._lastNonZeroVolume,
				shuffle: state.shuffle,
				repeat: state.repeat,
				// Persist playback context so the player bar is restored on refresh.
				// isPlaying is NOT persisted — audio never auto-starts on page load.
				queue: state.queue,
				queueIndex: state.queueIndex,
				currentTrack: state.currentTrack,
				playbackRate: state.playbackRate,
				crossfadeDuration: state.crossfadeDuration,
				normalizationEnabled: state.normalizationEnabled,
			}),
		}
	)
);
