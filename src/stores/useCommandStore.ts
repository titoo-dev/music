import { create } from "zustand";

// ⌘K command palette — the single entry point for search and downloads.

export type CommandView = "search" | "downloads";

interface CommandState {
	isOpen: boolean;
	query: string;
	view: CommandView;
	open: (query?: string, view?: CommandView) => void;
	close: () => void;
	toggle: () => void;
	setQuery: (q: string) => void;
	setView: (v: CommandView) => void;
	/** "See all results" from the palette — /search shows it even when its URL already matches (`seq` bumps each time). */
	searchRequest: { term: string; seq: number } | null;
	submitSearch: (term: string) => void;
}

export const useCommandStore = create<CommandState>((set, get) => ({
	isOpen: false,
	query: "",
	view: "search",
	open: (query, view = "search") =>
		set({
			isOpen: true,
			view,
			// Keep the previous query when reopening without one, so ⌘K → Esc → ⌘K
			// doesn't lose what the user typed.
			query: query ?? get().query,
		}),
	close: () => set({ isOpen: false }),
	toggle: () => (get().isOpen ? set({ isOpen: false }) : get().open()),
	setQuery: (query) => set({ query }),
	setView: (view) => set({ view }),
	searchRequest: null,
	submitSearch: (term) => set((s) => ({ searchRequest: { term, seq: (s.searchRequest?.seq ?? 0) + 1 } })),
}));
