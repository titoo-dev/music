import { create } from "zustand";
import { usePlayerStore } from "./usePlayerStore";
import { parseLrc, type LyricLine } from "@/lib/lyrics/lrc";

export type { LyricLine };

interface LyricsState {
	trackId: string | null;
	syncedLines: LyricLine[];
	plainLyrics: string | null;
	instrumental: boolean;
	source: string | null;
	isLoading: boolean;
	error: string | null;
	visible: boolean;
	immersiveOpen: boolean;

	fetchLyrics: (trackId: string, duration?: number | null) => Promise<void>;
	setVisible: (v: boolean) => void;
	toggleVisible: () => void;
	setImmersiveOpen: (v: boolean) => void;
	reset: () => void;
}

/** Query string with the playing track's metadata, so the server can match even unsaved tracks. */
function lyricsQuery(trackId: string, duration?: number | null): string {
	const qs = new URLSearchParams();
	const track = usePlayerStore.getState().currentTrack;
	if (track?.trackId === trackId) {
		if (track.title) qs.set("title", track.title);
		if (track.artist) qs.set("artist", track.artist);
	}
	const d = duration ?? (track?.trackId === trackId ? track.duration : null);
	if (d) qs.set("duration", String(Math.round(d)));
	const s = qs.toString();
	return s ? `?${s}` : "";
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
	immersiveOpen: false,

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
			const res = await fetch(`/api/v1/lyrics/${encodeURIComponent(trackId)}${lyricsQuery(trackId, duration)}`);
			// The track changed while this request was in flight — drop the stale answer.
			if (get().trackId !== trackId) return;
			if (!res.ok) {
				set({ isLoading: false, error: "Failed to fetch lyrics" });
				return;
			}
			const json = await res.json();
			if (get().trackId !== trackId) return;
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
			if (get().trackId !== trackId) return;
			set({ isLoading: false, error: "Failed to fetch lyrics" });
		}
	},

	setVisible: (visible) => set({ visible }),
	setImmersiveOpen: (immersiveOpen) => {
		set({ immersiveOpen });
		if (immersiveOpen) {
			const { trackId } = get();
			if (!trackId) {
				const currentTrack = usePlayerStore.getState().currentTrack;
				if (currentTrack) {
					get().fetchLyrics(currentTrack.trackId, currentTrack.duration);
				}
			}
		}
	},
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
