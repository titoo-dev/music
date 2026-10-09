import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useCommandStore } from "@/stores/useCommandStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

const CMD = useCommandStore.getState();
const PLAYER = usePlayerStore.getState();

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
	const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
	target.dispatchEvent(e);
	return e;
}

const track = { trackId: "1", title: "t", artist: "a", cover: null, duration: 100 };

beforeEach(() => {
	useCommandStore.setState(CMD, true);
	usePlayerStore.setState(PLAYER, true);
});

describe("useKeyboardShortcuts — command palette", () => {
	it("⌘K and Ctrl+K toggle the palette", () => {
		renderHook(() => useKeyboardShortcuts());
		const e = press("k", { metaKey: true });
		expect(e.defaultPrevented).toBe(true);
		expect(useCommandStore.getState().isOpen).toBe(true);
		press("K", { ctrlKey: true });
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("⌘K works even while typing in an input", () => {
		renderHook(() => useKeyboardShortcuts());
		const input = document.createElement("input");
		document.body.appendChild(input);
		press("k", { metaKey: true }, input);
		expect(useCommandStore.getState().isOpen).toBe(true);
		input.remove();
	});

	it("'/' opens the palette outside inputs", () => {
		renderHook(() => useKeyboardShortcuts());
		press("/");
		expect(useCommandStore.getState().isOpen).toBe(true);
	});

	it("player shortcuts are ignored while the palette is open", () => {
		usePlayerStore.setState({ currentTrack: track, isPlaying: true });
		useCommandStore.setState({ isOpen: true });
		renderHook(() => useKeyboardShortcuts());
		press(" ");
		expect(usePlayerStore.getState().isPlaying).toBe(true);
	});

	it("space still toggles playback when the palette is closed", () => {
		usePlayerStore.setState({ currentTrack: track, isPlaying: true });
		renderHook(() => useKeyboardShortcuts());
		press(" ");
		expect(usePlayerStore.getState().isPlaying).toBe(false);
	});

	it("modified keys are left to the browser (was: Ctrl+Arrow skipped tracks)", () => {
		usePlayerStore.setState({ currentTrack: track, isPlaying: true, volume: 50 });
		renderHook(() => useKeyboardShortcuts());
		const e = press("ArrowUp", { altKey: true });
		expect(e.defaultPrevented).toBe(false);
		expect(usePlayerStore.getState().volume).toBe(50);
	});
});

describe("useKeyboardShortcuts — page scrolling (NAV-01)", () => {
	it("leaves Space to the browser when nothing is loaded (was: Space never scrolled the page)", () => {
		renderHook(() => useKeyboardShortcuts());
		const e = press(" ");
		expect(e.defaultPrevented).toBe(false);
	});

	it("leaves ArrowUp / ArrowDown to the browser (was: arrows changed the volume instead of scrolling)", () => {
		usePlayerStore.setState({ currentTrack: track, isPlaying: true, volume: 50 });
		renderHook(() => useKeyboardShortcuts());
		const up = press("ArrowUp");
		const down = press("ArrowDown");
		expect(up.defaultPrevented).toBe(false);
		expect(down.defaultPrevented).toBe(false);
		expect(usePlayerStore.getState().volume).toBe(50);
	});

	it("Shift+ArrowUp / Shift+ArrowDown change the volume", () => {
		usePlayerStore.setState({ currentTrack: track, isPlaying: true, volume: 50 });
		renderHook(() => useKeyboardShortcuts());
		const up = press("ArrowUp", { shiftKey: true });
		expect(up.defaultPrevented).toBe(true);
		expect(usePlayerStore.getState().volume).toBe(55);
		press("ArrowDown", { shiftKey: true });
		expect(usePlayerStore.getState().volume).toBe(50);
	});

	it("leaves ArrowLeft / ArrowRight to the browser when nothing is loaded (was: horizontal scroll blocked)", () => {
		renderHook(() => useKeyboardShortcuts());
		expect(press("ArrowLeft").defaultPrevented).toBe(false);
		expect(press("ArrowRight").defaultPrevented).toBe(false);
	});
});
