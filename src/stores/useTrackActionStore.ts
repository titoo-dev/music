import { create } from "zustand";

export interface TrackActionInfo {
	id: string;
	title: string;
	artist: string;
	cover?: string | null;
	duration?: number | null;
	albumId?: string | null;
	albumTitle?: string | null;
	artistId?: string | null;
	previewUrl?: string | null;
}

export interface TrackActionCallbacks {
	onDownload?: () => void;
	onDelete?: () => void;
}

interface TrackActionState {
	open: boolean;
	track: TrackActionInfo | null;
	callbacks: TrackActionCallbacks;
	openSheet: (track: TrackActionInfo, callbacks?: TrackActionCallbacks) => void;
	closeSheet: () => void;
}

export const useTrackActionStore = create<TrackActionState>((set) => ({
	open: false,
	track: null,
	callbacks: {},
	openSheet: (track, callbacks = {}) => set({ open: true, track, callbacks }),
	closeSheet: () => set({ open: false }),
}));
