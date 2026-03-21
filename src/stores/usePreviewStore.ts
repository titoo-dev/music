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
	volume: number;

	play: (track: PreviewState["currentTrack"]) => void;
	pause: () => void;
	stop: () => void;
	toggle: (track: PreviewState["currentTrack"]) => void;
	setVolume: (v: number) => void;
}

export const usePreviewStore = create<PreviewState>()(
	persist(
		(set, get) => ({
			currentTrack: null,
			isPlaying: false,
			volume: 80,

			play: (track) => set({ currentTrack: track, isPlaying: true }),
			pause: () => set({ isPlaying: false }),
			stop: () => set({ currentTrack: null, isPlaying: false }),
			toggle: (track) => {
				const { currentTrack, isPlaying } = get();
				if (currentTrack?.id === track?.id && isPlaying) {
					set({ isPlaying: false });
				} else {
					set({ currentTrack: track, isPlaying: true });
				}
			},
			setVolume: (volume) => set({ volume }),
		}),
		{
			name: "deemix-preview",
			partialize: (state) => ({ volume: state.volume }),
		}
	)
);
