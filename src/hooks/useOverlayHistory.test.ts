import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useCommandStore } from "@/stores/useCommandStore";
import { resetOverlayHistory, useOverlayStack } from "@/lib/overlay-history";

let pathname = "/album";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { useOverlayHistory } from "./useOverlayHistory";

let wide = false;
beforeEach(() => {
	pathname = "/album";
	wide = false;
	resetOverlayHistory();
	usePlayerStore.setState({ fullscreenOpen: false, queuePanelOpen: false });
	useLyricsStore.setState({ immersiveOpen: false });
	useCommandStore.setState({ isOpen: false });
	window.matchMedia = vi.fn().mockImplementation(() => ({ matches: wide, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
	vi.spyOn(window.history, "back").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

const popstate = () => act(() => void window.dispatchEvent(new PopStateEvent("popstate")));

describe("useOverlayHistory", () => {
	it("Back closes Now Playing instead of leaving the page (NAV-04, was: Back changed the page under the player)", () => {
		renderHook(() => useOverlayHistory());
		act(() => usePlayerStore.getState().setFullscreenOpen(true));
		expect(useOverlayStack.getState().ids).toEqual(["fullscreen"]);
		popstate();
		expect(usePlayerStore.getState().fullscreenOpen).toBe(false);
	});

	it("Back closes the immersive lyrics, then Now Playing", () => {
		renderHook(() => useOverlayHistory());
		act(() => usePlayerStore.getState().setFullscreenOpen(true));
		act(() => useLyricsStore.getState().setImmersiveOpen(true));
		popstate();
		expect(useLyricsStore.getState().immersiveOpen).toBe(false);
		expect(usePlayerStore.getState().fullscreenOpen).toBe(true);
		popstate();
		expect(usePlayerStore.getState().fullscreenOpen).toBe(false);
	});

	it("Back closes the ⌘K palette (NAV-17, was: the page changed under the open palette)", () => {
		renderHook(() => useOverlayHistory());
		act(() => useCommandStore.getState().open());
		popstate();
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("a route change closes the palette and Now Playing", () => {
		const { rerender } = renderHook(() => useOverlayHistory());
		act(() => useCommandStore.getState().open());
		act(() => usePlayerStore.getState().setFullscreenOpen(true));
		pathname = "/artist";
		rerender();
		expect(useCommandStore.getState().isOpen).toBe(false);
		expect(usePlayerStore.getState().fullscreenOpen).toBe(false);
		expect(window.history.back).not.toHaveBeenCalled();
	});

	it("never comes back to a palette left open (NAV-17, was: palette reopened after /login)", () => {
		useCommandStore.setState({ isOpen: true });
		renderHook(() => useOverlayHistory());
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("the desktop queue side panel gets no history entry", () => {
		wide = true;
		renderHook(() => useOverlayHistory());
		act(() => usePlayerStore.getState().setQueuePanelOpen(true));
		expect(useOverlayStack.getState().ids).toEqual([]);
	});

	it("the phone queue covers the page and closes on Back", () => {
		renderHook(() => useOverlayHistory());
		act(() => usePlayerStore.getState().setQueuePanelOpen(true));
		popstate();
		expect(usePlayerStore.getState().queuePanelOpen).toBe(false);
	});
});
