import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { closeOverlay, handlePopState, leaveOverlays, openOverlay, overlayEntryOnTop, resetOverlayHistory, useOverlayStack } from "./overlay-history";

beforeEach(() => {
	resetOverlayHistory();
	window.history.replaceState({ page: true }, "");
});

afterEach(() => vi.restoreAllMocks());

describe("overlay history (NAV-04)", () => {
	it("gives an opened overlay its own history entry on the same URL", () => {
		const url = window.location.href;
		const push = vi.spyOn(window.history, "pushState");
		openOverlay("fullscreen", vi.fn());
		expect(push).toHaveBeenCalledOnce();
		expect(window.location.href).toBe(url);
		expect(window.history.state).toMatchObject({ page: true });
		expect(overlayEntryOnTop()).toBe(true);
		expect(useOverlayStack.getState().ids).toEqual(["fullscreen"]);
	});

	it("Back closes the top-most overlay instead of changing the page (was: Back navigated under Now Playing)", () => {
		const closeFullscreen = vi.fn();
		const closeQueue = vi.fn();
		openOverlay("fullscreen", closeFullscreen);
		openOverlay("queue", closeQueue);
		handlePopState();
		expect(closeQueue).toHaveBeenCalledOnce();
		expect(closeFullscreen).not.toHaveBeenCalled();
		expect(useOverlayStack.getState().ids).toEqual(["fullscreen"]);
		handlePopState();
		expect(closeFullscreen).toHaveBeenCalledOnce();
	});

	it("closing an overlay from its own button drops its history entry", () => {
		const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
		openOverlay("fullscreen", vi.fn());
		closeOverlay("fullscreen");
		expect(back).toHaveBeenCalledOnce();
		expect(useOverlayStack.getState().ids).toEqual([]);
	});

	it("ignores the popstate of its own Back", () => {
		vi.spyOn(window.history, "back").mockImplementation(() => {});
		const closeQueue = vi.fn();
		const closeFullscreen = vi.fn();
		openOverlay("fullscreen", closeFullscreen);
		openOverlay("queue", closeQueue);
		closeOverlay("queue");
		handlePopState();
		expect(closeFullscreen).not.toHaveBeenCalled();
		expect(useOverlayStack.getState().ids).toEqual(["fullscreen"]);
	});

	it("leaving through a link closes every overlay without going Back (the link replaces the entry)", () => {
		const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
		openOverlay("fullscreen", vi.fn());
		leaveOverlays(() => closeOverlay("fullscreen"));
		expect(back).not.toHaveBeenCalled();
		expect(useOverlayStack.getState().ids).toEqual([]);
	});

	it("does nothing on Back when no overlay is open", () => {
		expect(() => handlePopState()).not.toThrow();
		expect(useOverlayStack.getState().ids).toEqual([]);
	});

	it("opening the same overlay twice keeps one entry", () => {
		const push = vi.spyOn(window.history, "pushState");
		openOverlay("palette", vi.fn());
		openOverlay("palette", vi.fn());
		expect(push).toHaveBeenCalledOnce();
	});
});
