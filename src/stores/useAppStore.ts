import { create } from "zustand";

interface AppState {
	previewVolume: number;
	slimSidebar: boolean;
	showBitrateTags: boolean;
	sidebarOpen: boolean;
	currentVersion: string;
	latestVersion: string | null;
	updateAvailable: boolean;
	deezerAvailable: "yes" | "no" | "no-network" | null;
	spotifyEnabled: boolean;

	setPreviewVolume: (v: number) => void;
	toggleSlimSidebar: () => void;
	toggleShowBitrateTags: () => void;
	setSidebarOpen: (v: boolean) => void;
	setVersionInfo: (current: string, latest: string | null, updateAvailable: boolean) => void;
	setDeezerAvailable: (v: "yes" | "no" | "no-network") => void;
	setSpotifyEnabled: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
	previewVolume: 80,
	slimSidebar: false,
	showBitrateTags: false,
	sidebarOpen: false,
	currentVersion: "",
	latestVersion: null,
	updateAvailable: false,
	deezerAvailable: null,
	spotifyEnabled: false,

	setPreviewVolume: (v) => set({ previewVolume: v }),
	toggleSlimSidebar: () => set((s) => ({ slimSidebar: !s.slimSidebar })),
	toggleShowBitrateTags: () => set((s) => ({ showBitrateTags: !s.showBitrateTags })),
	setSidebarOpen: (v) => set({ sidebarOpen: v }),
	setVersionInfo: (current, latest, updateAvailable) =>
		set({ currentVersion: current, latestVersion: latest, updateAvailable }),
	setDeezerAvailable: (v) => set({ deezerAvailable: v }),
	setSpotifyEnabled: (v) => set({ spotifyEnabled: v }),
}));
