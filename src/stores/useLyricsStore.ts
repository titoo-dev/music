import { create } from "zustand";
import { usePlayerStore } from "./usePlayerStore";

export interface LyricLine {
	time: number; // seconds
	text: string;
}

interface LyricsState {
	trackId: string | null;
	syncedLines: LyricLine[];
	plainLyrics: string | null;
	instrumental: boolean;
	source: string | null;
	isLoading: boolean;
	error: string | null;
	visible: boolean;

	fetchLyrics: (trackId: string, duration?: number | null) => Promise<void>;
	setVisible: (v: boolean) => void;
	toggleVisible: () => void;
	reset: () => void;
}

function parseLrc(lrc: string): LyricLine[] {
	const lines: LyricLine[] = [];
	for (const raw of lrc.split("\n")) {
		const match = raw.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s?(.*)/);
		if (!match) continue;
		const min = parseInt(match[1]);
		const sec = parseInt(match[2]);
		const ms = parseInt(match[3].padEnd(3, "0"));
		const time = min * 60 + sec + ms / 1000;
		lines.push({ time, text: match[4] });
	}
	return lines.sort((a, b) => a.time - b.time);
}

export const useLyricsStore = create<LyricsState>()((set, get) => ({
	trackId: null,
	syncedLines: [],
	plainLyrics: null,
	instrumental: false,
	source: null,
	isLoading: false,
	error: null,
	visible: false,

	fetchLyrics: async (trackId: string, duration?: number | null) => {
		if (get().trackId === trackId && !get().error) return;

		set({
			trackId,
			syncedLines: [],
			plainLyrics: null,
			instrumental: false,
			source: null,
			isLoading: true,
			error: null,
		});

		try {
			const params = duration ? `?duration=${Math.round(duration)}` : "";
			const res = await fetch(`/api/v1/lyrics/${encodeURIComponent(trackId)}${params}`);
			if (!res.ok) {
				set({ isLoading: false, error: "Failed to fetch lyrics" });
				return;
			}
			const json = await res.json();
			const data = json.data;

			if (!data.source && !data.instrumental) {
				set({ isLoading: false, error: "No lyrics available" });
				return;
			}

			set({
				isLoading: false,
				source: data.source,
				instrumental: data.instrumental,
				plainLyrics: data.plainLyrics,
				syncedLines: data.syncedLyrics ? parseLrc(data.syncedLyrics) : [],
			});
		} catch {
			set({ isLoading: false, error: "Failed to fetch lyrics" });
		}
	},

	setVisible: (visible) => set({ visible }),
	toggleVisible: () => {
		const { visible, trackId } = get();
		const newVisible = !visible;
		set({ visible: newVisible });

		// Auto-fetch when opening
		if (newVisible && !trackId) {
			const currentTrack = usePlayerStore.getState().currentTrack;
			if (currentTrack) {
				get().fetchLyrics(currentTrack.trackId, currentTrack.duration);
			}
		}
	},
	reset: () =>
		set({
			trackId: null,
			syncedLines: [],
			plainLyrics: null,
			instrumental: false,
			source: null,
			isLoading: false,
			error: null,
		}),
}));
