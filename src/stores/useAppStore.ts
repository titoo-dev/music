import { create } from "zustand";

interface AppState {
	previewVolume: number;
	slimSidebar: boolean;
	slimDownloads: boolean;
	showBitrateTags: boolean;
	sidebarOpen: boolean;
	downloadsOpen: boolean;
	currentVersion: string;
	latestVersion: string | null;
	updateAvailable: boolean;
	deezerAvailable: "yes" | "no" | "no-network" | null;
	spotifyEnabled: boolean;

	setPreviewVolume: (v: number) => void;
	toggleSlimSidebar: () => void;
	toggleSlimDownloads: () => void;
	toggleShowBitrateTags: () => void;
	setSidebarOpen: (v: boolean) => void;
	setDownloadsOpen: (v: boolean) => void;
	setVersionInfo: (current: string, latest: string | null, updateAvailable: boolean) => void;
	setDeezerAvailable: (v: "yes" | "no" | "no-network") => void;
	setSpotifyEnabled: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
	previewVolume: 80,
	slimSidebar: false,
	slimDownloads: false,
	showBitrateTags: false,
	sidebarOpen: false,
	downloadsOpen: false,
	currentVersion: "",
	latestVersion: null,
	updateAvailable: false,
	deezerAvailable: null,
	spotifyEnabled: false,

	setPreviewVolume: (v) => set({ previewVolume: v }),
	toggleSlimSidebar: () => set((s) => ({ slimSidebar: !s.slimSidebar })),
	toggleSlimDownloads: () => set((s) => ({ slimDownloads: !s.slimDownloads })),
	toggleShowBitrateTags: () => set((s) => ({ showBitrateTags: !s.showBitrateTags })),
	setSidebarOpen: (v) => set({ sidebarOpen: v }),
	setDownloadsOpen: (v) => set({ downloadsOpen: v }),
	setVersionInfo: (current, latest, updateAvailable) =>
		set({ currentVersion: current, latestVersion: latest, updateAvailable }),
	setDeezerAvailable: (v) => set({ deezerAvailable: v }),
	setSpotifyEnabled: (v) => set({ spotifyEnabled: v }),
}));
