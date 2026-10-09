"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useCommandStore } from "@/stores/useCommandStore";
import { closeOverlay, handlePopState, leaveOverlays, openOverlay, resetOverlayHistory, useOverlayStack } from "@/lib/overlay-history";

type Source = {
	id: string;
	subscribe: (fn: (open: boolean, wasOpen: boolean) => void) => () => void;
	close: () => void;
	/** Only overlays that cover the page get a history entry (the desktop queue is a side panel). */
	covers?: () => boolean;
};

const isPhone = () => !window.matchMedia("(min-width: 768px)").matches;

const SOURCES: Source[] = [
	{
		id: "fullscreen",
		subscribe: (fn) => usePlayerStore.subscribe((s, p) => fn(s.fullscreenOpen, p.fullscreenOpen)),
		close: () => usePlayerStore.getState().setFullscreenOpen(false),
	},
	{
		id: "queue",
		subscribe: (fn) => usePlayerStore.subscribe((s, p) => fn(s.queuePanelOpen, p.queuePanelOpen)),
		close: () => usePlayerStore.getState().setQueuePanelOpen(false),
		covers: isPhone,
	},
	{
		id: "lyrics",
		subscribe: (fn) => useLyricsStore.subscribe((s, p) => fn(s.immersiveOpen, p.immersiveOpen)),
		close: () => useLyricsStore.getState().setImmersiveOpen(false),
	},
	{
		id: "palette",
		subscribe: (fn) => useCommandStore.subscribe((s, p) => fn(s.isOpen, p.isOpen)),
		close: () => useCommandStore.getState().close(),
	},
];

/** Closes every overlay that owns a history entry, for a navigation. */
export function closeOverlaysForNavigation() {
	leaveOverlays(() => SOURCES.forEach((s) => s.close()));
}

/**
 * Back closes the top-most overlay (Now Playing, immersive lyrics, the phone
 * queue, ⌘K) instead of changing the page under it, and any route change
 * closes them. Mounted once, in the main layout.
 */
export function useOverlayHistory() {
	useEffect(() => {
		// The palette store outlives this layout (e.g. a trip to /login): never come back to it already open.
		useCommandStore.getState().close();
		const unsubs = SOURCES.map((src) =>
			src.subscribe((open, wasOpen) => {
				if (open && !wasOpen && (src.covers?.() ?? true)) openOverlay(src.id, src.close);
				else if (!open && wasOpen) closeOverlay(src.id);
			})
		);
		window.addEventListener("popstate", handlePopState);
		return () => {
			unsubs.forEach((u) => u());
			window.removeEventListener("popstate", handlePopState);
			resetOverlayHistory();
		};
	}, []);

	// A route change behind an open overlay (a link, ⌘K, the player pill) closes it.
	const pathname = usePathname();
	const first = useRef(true);
	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		if (useOverlayStack.getState().ids.length) closeOverlaysForNavigation();
	}, [pathname]);
}
