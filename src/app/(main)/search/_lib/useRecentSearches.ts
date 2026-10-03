"use client";

import { useSyncExternalStore } from "react";
import { parseRecent, pushRecent, removeRecent } from "./search-model";

/**
 * Recent search terms, kept per browser (localStorage) and shared by every
 * subscriber. Storage failures (private mode, blocked storage) just mean the
 * list lives in memory for this tab.
 */
const KEY = "wavelet-recent-searches";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let memory: string[] | null = null;

function read(): string[] {
	if (memory) return memory;
	try {
		memory = parseRecent(localStorage.getItem(KEY));
	} catch {
		memory = [];
	}
	return memory;
}

function write(next: string[]) {
	memory = next;
	try {
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		// keep the in-memory copy
	}
	listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
	listeners.add(l);
	return () => listeners.delete(l);
}

export const recentSearches = {
	add: (term: string) => {
		const next = pushRecent(read(), term);
		if (next.join("\u0000") !== read().join("\u0000")) write(next);
	},
	remove: (term: string) => write(removeRecent(read(), term)),
	clear: () => write([]),
};

export function useRecentSearches(): string[] {
	return useSyncExternalStore(subscribe, read, () => EMPTY);
}
