import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlayerTrack {
	trackId: string;
	title: string;
	artist: string;
	cover: string | null;
	duration: number | null;
}

type RepeatMode = "off" | "all" | "one";

/** Fisher-Yates shuffle, returns a new array of indices with `startIdx` placed first. */
function buildShuffleOrder(length: number, startIdx: number): number[] {
	const indices = Array.from({ length }, (_, i) => i);
	// Place current track at position 0
	[indices[0], indices[startIdx]] = [indices[startIdx], indices[0]];
	// Shuffle the rest (indices 1..n-1)
	for (let i = length - 1; i > 1; i--) {
		const j = 1 + Math.floor(Math.random() * i); // 1..i inclusive
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}
	return indices;
}

interface PlayerState {
	currentTrack: PlayerTrack | null;
	queue: PlayerTrack[];
	queueIndex: number;
	isPlaying: boolean;
	isBuffering: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	shuffle: boolean;
	repeat: RepeatMode;
	/** Set by prev()/seek() to signal AudioEngine to seek; AudioEngine clears it after seeking. */
	_seekTo: number | null;
	/** Playback error message, null when no error. */
	error: string | null;
	fullscreenOpen: boolean;

	// P2 features
	sleepTimerEnd: number | null;
	playbackRate: number;
	crossfadeDuration: number;

	// Shuffle history (P1)
	/** Pre-computed shuffled order of queue indices. Empty when shuffle is off. */
	_shuffleOrder: number[];
	/** Current position within _shuffleOrder. */
	_shufflePos: number;

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
	setError: (error: string | null) => void;
	setVolume: (v: number) => void;
	setCurrentTime: (t: number) => void;
	setDuration: (d: number) => void;
	setBuffering: (b: boolean) => void;
	toggleShuffle: () => void;
	toggleRepeat: () => void;
	setFullscreenOpen: (v: boolean) => void;
	playQueue: (queue: PlayerTrack[], startIndex?: number) => void;
	setSleepTimer: (minutes: number | null) => void;
	setPlaybackRate: (rate: number) => void;
	setCrossfadeDuration: (seconds: number) => void;

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
		error: null,
	};
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
			currentTime: 0,
			duration: 0,
			shuffle: false,
			repeat: "off" as RepeatMode,
			_seekTo: null,
			error: null,
			fullscreenOpen: false,
			sleepTimerEnd: null,
			playbackRate: 1.0,
			crossfadeDuration: 0,
			_shuffleOrder: [],
			_shufflePos: 0,

			play: (track, queue) => {
				const state = get();
				if (queue) {
					const idx = queue.findIndex((t) => t.trackId === track.trackId);
					const qi = idx >= 0 ? idx : 0;
					const shuffleUpdate = state.shuffle
						? { _shuffleOrder: buildShuffleOrder(queue.length, qi), _shufflePos: 0 }
						: { _shuffleOrder: [], _shufflePos: 0 };
					set({
						currentTrack: track,
						queue,
						queueIndex: qi,
						isPlaying: true,
						isBuffering: true,
						currentTime: 0,
						error: null,
						...shuffleUpdate,
					});
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
						_shuffleOrder: [],
						_shufflePos: 0,
					});
				}
			},

			pause: () => set({ isPlaying: false }),
			resume: () => set({ isPlaying: true }),
			toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
			stop: () => set({
				currentTrack: null, queue: [], queueIndex: -1,
				isPlaying: false, isBuffering: false,
				currentTime: 0, duration: 0, error: null, fullscreenOpen: false,
				_shuffleOrder: [], _shufflePos: 0,
				sleepTimerEnd: null,
			}),

			next: () => {
				const { queue, queueIndex, shuffle, repeat, _shuffleOrder, _shufflePos } = get();
				if (queue.length === 0) return;

				let nextQueueIndex: number;

				if (shuffle && _shuffleOrder.length > 0) {
					const nextShufflePos = _shufflePos + 1;
					if (nextShufflePos >= _shuffleOrder.length) {
						if (repeat === "all") {
							// Re-shuffle for the next cycle
							const newOrder = buildShuffleOrder(queue.length, queueIndex);
							nextQueueIndex = newOrder[0];
							set({ _shuffleOrder: newOrder, _shufflePos: 0, ...goToIndex(nextQueueIndex, queue) });
							return;
						} else {
							set({ isPlaying: false });
							return;
						}
					}
					nextQueueIndex = _shuffleOrder[nextShufflePos];
					set({ _shufflePos: nextShufflePos, ...goToIndex(nextQueueIndex, queue) });
					return;
				}

				// Sequential mode
				nextQueueIndex = queueIndex + 1;
				if (nextQueueIndex >= queue.length) {
					if (repeat === "all") {
						nextQueueIndex = 0;
					} else {
						set({ isPlaying: false });
						return;
					}
				}

				set(goToIndex(nextQueueIndex, queue));
			},

			prev: () => {
				const { queue, queueIndex, currentTime, repeat, shuffle, _shuffleOrder, _shufflePos } = get();
				if (queue.length === 0) return;

				// If more than 3 seconds in, restart current track
				if (currentTime > 3) {
					set({ currentTime: 0, _seekTo: 0 });
					return;
				}

				if (shuffle && _shuffleOrder.length > 0) {
					const prevShufflePos = _shufflePos - 1;
					if (prevShufflePos < 0) {
						if (repeat === "all") {
							// Wrap to the end of shuffle order
							const lastPos = _shuffleOrder.length - 1;
							set({ _shufflePos: lastPos, ...goToIndex(_shuffleOrder[lastPos], queue) });
						} else {
							set({ currentTime: 0, _seekTo: 0 });
						}
						return;
					}
					set({ _shufflePos: prevShufflePos, ...goToIndex(_shuffleOrder[prevShufflePos], queue) });
					return;
				}

				// Sequential mode
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
				const { queue, queueIndex, repeat, shuffle, _shuffleOrder, _shufflePos } = get();
				if (queue.length === 0) return;

				if (shuffle && _shuffleOrder.length > 0) {
					const prevShufflePos = _shufflePos - 1;
					if (prevShufflePos < 0) {
						if (repeat === "all") {
							const lastPos = _shuffleOrder.length - 1;
							set({ _shufflePos: lastPos, ...goToIndex(_shuffleOrder[lastPos], queue) });
						} else {
							set({ currentTime: 0, _seekTo: 0 });
						}
						return;
					}
					set({ _shufflePos: prevShufflePos, ...goToIndex(_shuffleOrder[prevShufflePos], queue) });
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

			seek: (time) => {
				const { duration } = get();
				const clamped = Math.max(0, duration > 0 ? Math.min(time, duration) : time);
				set({ currentTime: clamped, _seekTo: clamped });
			},
			setError: (error) => set({ error }),
			setVolume: (volume) => set({ volume }),
			setCurrentTime: (currentTime) => set({ currentTime }),
			setDuration: (duration) => set({ duration }),
			setBuffering: (isBuffering) => set({ isBuffering }),

			toggleShuffle: () => {
				const { shuffle, queue, queueIndex } = get();
				if (!shuffle) {
					// Turning ON: build shuffle order starting from current track
					if (queue.length <= 1) {
						set({ shuffle: true });
						return;
					}
					const order = buildShuffleOrder(queue.length, queueIndex);
					set({ shuffle: true, _shuffleOrder: order, _shufflePos: 0 });
				} else {
					// Turning OFF: clear shuffle state, keep current track position
					set({ shuffle: false, _shuffleOrder: [], _shufflePos: 0 });
				}
			},

			setFullscreenOpen: (fullscreenOpen) => set({ fullscreenOpen }),
			setSleepTimer: (minutes) => {
				set({ sleepTimerEnd: minutes === null ? null : Date.now() + minutes * 60 * 1000 });
			},
			setPlaybackRate: (playbackRate) => set({ playbackRate }),
			setCrossfadeDuration: (crossfadeDuration) => set({ crossfadeDuration }),
			toggleRepeat: () =>
				set((s) => ({
					repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
				})),

			playQueue: (queue, startIndex = 0) => {
				if (queue.length === 0) return;
				const { shuffle } = get();
				const shuffleUpdate = shuffle
					? { _shuffleOrder: buildShuffleOrder(queue.length, startIndex), _shufflePos: 0 }
					: { _shuffleOrder: [] as number[], _shufflePos: 0 };
				set({
					queue,
					queueIndex: startIndex,
					currentTrack: queue[startIndex],
					isPlaying: true,
					isBuffering: true,
					currentTime: 0,
					...shuffleUpdate,
				});
			},

			// --- Queue Management (P2) ---

			addNext: (track) => {
				const { queue, queueIndex, shuffle, _shuffleOrder, _shufflePos } = get();
				// If nothing is playing, just start playing this track
				if (queue.length === 0 || queueIndex < 0) {
					get().play(track);
					return;
				}
				// Avoid duplicates: remove existing occurrence first
				const existingIdx = queue.findIndex((t) => t.trackId === track.trackId);
				let newQueue = [...queue];
				let newQueueIndex = queueIndex;
				let newShuffleOrder = [..._shuffleOrder];

				if (existingIdx >= 0 && existingIdx !== queueIndex) {
					newQueue.splice(existingIdx, 1);
					// Adjust queueIndex if removed track was before current
					if (existingIdx < newQueueIndex) newQueueIndex--;
					// Rebuild shuffle order if active
					if (shuffle) {
						newShuffleOrder = buildShuffleOrder(newQueue.length, newQueueIndex);
					}
				}

				// Insert after current track
				const insertAt = newQueueIndex + 1;
				newQueue.splice(insertAt, 0, track);

				if (shuffle && newShuffleOrder.length > 0) {
					// Rebuild shuffle to include the new track
					newShuffleOrder = buildShuffleOrder(newQueue.length, newQueueIndex);
					// Ensure the new track is next in shuffle order
					const newTrackIdx = insertAt;
					const posInShuffle = newShuffleOrder.indexOf(newTrackIdx);
					const nextPos = _shufflePos + 1;
					if (posInShuffle >= 0 && posInShuffle !== nextPos && nextPos < newShuffleOrder.length) {
						[newShuffleOrder[nextPos], newShuffleOrder[posInShuffle]] =
							[newShuffleOrder[posInShuffle], newShuffleOrder[nextPos]];
					}
				}

				set({
					queue: newQueue,
					queueIndex: newQueueIndex,
					_shuffleOrder: newShuffleOrder,
					_shufflePos: shuffle ? _shufflePos : 0,
				});
			},

			addToQueue: (track) => {
				const { queue, queueIndex, shuffle, _shuffleOrder, _shufflePos } = get();
				if (queue.length === 0 || queueIndex < 0) {
					get().play(track);
					return;
				}
				// Avoid duplicates in queue
				if (queue.some((t) => t.trackId === track.trackId)) return;

				const newQueue = [...queue, track];
				let newShuffleOrder = _shuffleOrder;

				if (shuffle) {
					// Add the new index at a random position after current shuffle position
					newShuffleOrder = [..._shuffleOrder];
					const newIdx = newQueue.length - 1;
					const insertAfter = _shufflePos + 1 + Math.floor(Math.random() * (newShuffleOrder.length - _shufflePos));
					newShuffleOrder.splice(insertAfter, 0, newIdx);
				}

				set({ queue: newQueue, _shuffleOrder: newShuffleOrder });
			},

			removeFromQueue: (index) => {
				const { queue, queueIndex, shuffle, _shuffleOrder, _shufflePos } = get();
				if (index < 0 || index >= queue.length) return;
				// Don't remove the currently playing track
				if (index === queueIndex) return;

				const newQueue = [...queue];
				newQueue.splice(index, 1);

				let newQueueIndex = queueIndex;
				if (index < queueIndex) newQueueIndex--;

				let newShuffleOrder: number[] = [];
				let newShufflePos = _shufflePos;
				if (shuffle && _shuffleOrder.length > 0) {
					// Remove the index from shuffle order and adjust all indices > removed
					newShuffleOrder = _shuffleOrder
						.filter((i) => i !== index)
						.map((i) => (i > index ? i - 1 : i));
					// Adjust shuffle position if the removed entry was before current pos
					const removedPos = _shuffleOrder.indexOf(index);
					if (removedPos >= 0 && removedPos < _shufflePos) {
						newShufflePos--;
					}
				}

				set({
					queue: newQueue,
					queueIndex: newQueueIndex,
					currentTrack: newQueue[newQueueIndex],
					_shuffleOrder: newShuffleOrder,
					_shufflePos: newShufflePos,
				});
			},

			moveInQueue: (from, to) => {
				const { queue, queueIndex, shuffle, _shuffleOrder, _shufflePos } = get();
				if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;

				const newQueue = [...queue];
				const [moved] = newQueue.splice(from, 1);
				newQueue.splice(to, 0, moved);

				// Adjust queueIndex to follow the current track
				let newQueueIndex = queueIndex;
				if (from === queueIndex) {
					newQueueIndex = to;
				} else if (from < queueIndex && to >= queueIndex) {
					newQueueIndex--;
				} else if (from > queueIndex && to <= queueIndex) {
					newQueueIndex++;
				}

				// Rebuild shuffle order since indices shifted
				const newShuffleOrder = shuffle
					? buildShuffleOrder(newQueue.length, newQueueIndex)
					: _shuffleOrder;

				set({
					queue: newQueue,
					queueIndex: newQueueIndex,
					currentTrack: newQueue[newQueueIndex],
					_shuffleOrder: newShuffleOrder,
					_shufflePos: shuffle ? 0 : _shufflePos,
				});
			},

			clearQueue: () => {
				const { currentTrack, queueIndex, queue } = get();
				if (!currentTrack || queue.length <= 1) return;
				set({
					queue: [currentTrack],
					queueIndex: 0,
					_shuffleOrder: [],
					_shufflePos: 0,
				});
			},
		}),
		{
			name: "deemix-player",
			partialize: (state) => ({
				volume: state.volume,
				shuffle: state.shuffle,
				repeat: state.repeat,
				// Persist playback context so the player bar is restored on refresh.
				// isPlaying is NOT persisted — audio never auto-starts on page load.
				queue: state.queue,
				queueIndex: state.queueIndex,
				currentTrack: state.currentTrack,
				_shuffleOrder: state._shuffleOrder,
				_shufflePos: state._shufflePos,
				playbackRate: state.playbackRate,
				crossfadeDuration: state.crossfadeDuration,
			}),
		}
	)
);
