import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreviewState {
	currentTrack: {
		id: string;
		title: string;
		artist: string;
		cover: string;
		previewUrl: string;
	} | null;
	isPlaying: boolean;
	isBuffering: boolean;
	volume: number;

	play: (track: PreviewState["currentTrack"]) => void;
	pause: () => void;
	stop: () => void;
	toggle: (track: PreviewState["currentTrack"]) => void;
	setVolume: (v: number) => void;
	setBuffering: (b: boolean) => void;
}

export const usePreviewStore = create<PreviewState>()(
	persist(
		(set, get) => ({
			currentTrack: null,
			isPlaying: false,
			isBuffering: false,
			volume: 80,

			play: (track) => set({ currentTrack: track, isPlaying: true, isBuffering: true }),
			pause: () => set({ isPlaying: false }),
			stop: () => set({ currentTrack: null, isPlaying: false, isBuffering: false }),
			toggle: (track) => {
				const { currentTrack, isPlaying } = get();
				if (currentTrack?.id === track?.id && isPlaying) {
					set({ isPlaying: false });
				} else {
					set({ currentTrack: track, isPlaying: true, isBuffering: true });
				}
			},
			setVolume: (volume) => set({ volume }),
			setBuffering: (isBuffering) => set({ isBuffering }),
		}),
		{
			name: "deemix-preview",
			partialize: (state) => ({ volume: state.volume }),
		}
	)
);
