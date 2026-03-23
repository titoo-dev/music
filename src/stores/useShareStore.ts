import { create } from "zustand";

interface ShareInfo {
	shareId: string;
	trackId: string;
}

interface ShareState {
	/** Map of trackId → shareId for tracks the user has shared */
	shared: Map<string, string>;
	loaded: boolean;

	/** Fetch all shared tracks from API (call once on app init) */
	load: () => Promise<void>;
	/** Mark a track as shared */
	add: (trackId: string, shareId: string) => void;
	/** Remove a track from shared */
	remove: (trackId: string) => void;
	/** Check if a track is shared, returns shareId or null */
	get: (trackId: string) => string | null;
}

export const useShareStore = create<ShareState>((set, get) => ({
	shared: new Map(),
	loaded: false,

	load: async () => {
		if (get().loaded) return;
		try {
			const res = await fetch("/api/v1/shares", { credentials: "include" });
			const json = await res.json();
			if (json.success && Array.isArray(json.data)) {
				const map = new Map<string, string>();
				for (const item of json.data as ShareInfo[]) {
					map.set(item.trackId, item.shareId);
				}
				set({ shared: map, loaded: true });
			}
		} catch {
			// ignore
		}
	},

	add: (trackId, shareId) => {
		set((s) => {
			const next = new Map(s.shared);
			next.set(trackId, shareId);
			return { shared: next };
		});
	},

	remove: (trackId) => {
		set((s) => {
			const next = new Map(s.shared);
			next.delete(trackId);
			return { shared: next };
		});
	},

	get: (trackId) => {
		return get().shared.get(trackId) ?? null;
	},
}));
