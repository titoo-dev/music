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

interface PlayerState {
	currentTrack: PlayerTrack | null;
	queue: PlayerTrack[];
	queueIndex: number;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	shuffle: boolean;
	repeat: RepeatMode;
	/** Set by prev() to signal AudioEngine to seek; AudioEngine clears it after seeking. */
	_seekTo: number | null;

	play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
	pause: () => void;
	resume: () => void;
	toggle: () => void;
	stop: () => void;
	next: () => void;
	prev: () => void;
	setVolume: (v: number) => void;
	setCurrentTime: (t: number) => void;
	setDuration: (d: number) => void;
	toggleShuffle: () => void;
	toggleRepeat: () => void;
	playQueue: (queue: PlayerTrack[], startIndex?: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
	persist(
		(set, get) => ({
			currentTrack: null,
			queue: [],
			queueIndex: -1,
			isPlaying: false,
			volume: 80,
			currentTime: 0,
			duration: 0,
			shuffle: false,
			repeat: "off" as RepeatMode,
			_seekTo: null,

			play: (track, queue) => {
				const state = get();
				if (queue) {
					const idx = queue.findIndex((t) => t.trackId === track.trackId);
					set({
						currentTrack: track,
						queue,
						queueIndex: idx >= 0 ? idx : 0,
						isPlaying: true,
						currentTime: 0,
					});
				} else if (state.currentTrack?.trackId === track.trackId) {
					set({ isPlaying: true });
				} else {
					set({
						currentTrack: track,
						queue: [track],
						queueIndex: 0,
						isPlaying: true,
						currentTime: 0,
					});
				}
			},

			pause: () => set({ isPlaying: false }),
			resume: () => set({ isPlaying: true }),
			toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
			stop: () => set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0 }),

			next: () => {
				const { queue, queueIndex, shuffle, repeat } = get();
				if (queue.length === 0) return;

				let nextIndex: number;
				if (shuffle) {
					if (queue.length === 1) {
						nextIndex = 0;
					} else {
						// Pick a random index that differs from the current one
						nextIndex = Math.floor(Math.random() * (queue.length - 1));
						if (nextIndex >= queueIndex) nextIndex++;
					}
				} else {
					nextIndex = queueIndex + 1;
				}

				if (nextIndex >= queue.length) {
					if (repeat === "all") {
						nextIndex = 0;
					} else {
						set({ isPlaying: false });
						return;
					}
				}

				set({
					currentTrack: queue[nextIndex],
					queueIndex: nextIndex,
					isPlaying: true,
					currentTime: 0,
				});
			},

			prev: () => {
				const { queue, queueIndex, currentTime, repeat } = get();
				if (queue.length === 0) return;

				// If more than 3 seconds in, restart current track
				if (currentTime > 3) {
					set({ currentTime: 0, _seekTo: 0 });
					return;
				}

				// At the start of the queue: restart current track (unless repeat-all wraps)
				if (queueIndex === 0) {
					if (repeat === "all") {
						set({
							currentTrack: queue[queue.length - 1],
							queueIndex: queue.length - 1,
							isPlaying: true,
							currentTime: 0,
						});
					} else {
						set({ currentTime: 0, _seekTo: 0 });
					}
					return;
				}

				set({
					currentTrack: queue[queueIndex - 1],
					queueIndex: queueIndex - 1,
					isPlaying: true,
					currentTime: 0,
				});
			},

			setVolume: (volume) => set({ volume }),
			setCurrentTime: (currentTime) => set({ currentTime }),
			setDuration: (duration) => set({ duration }),
			toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
			toggleRepeat: () =>
				set((s) => ({
					repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
				})),

			playQueue: (queue, startIndex = 0) => {
				if (queue.length === 0) return;
				set({
					queue,
					queueIndex: startIndex,
					currentTrack: queue[startIndex],
					isPlaying: true,
					currentTime: 0,
				});
			},
		}),
		{
			name: "deemix-player",
			partialize: (state) => ({ volume: state.volume, shuffle: state.shuffle, repeat: state.repeat }),
		}
	)
);
