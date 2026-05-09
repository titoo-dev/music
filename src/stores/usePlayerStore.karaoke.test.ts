// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "./usePlayerStore";

const INITIAL = usePlayerStore.getState();

beforeEach(() => {
	usePlayerStore.setState(INITIAL, true);
});

describe("usePlayerStore — karaokeMode", () => {
	it("defaults to false", () => {
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});

	it("setKaraokeMode sets the value", () => {
		usePlayerStore.getState().setKaraokeMode(true);
		expect(usePlayerStore.getState().karaokeMode).toBe(true);
		usePlayerStore.getState().setKaraokeMode(false);
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});

	it("toggleKaraokeMode flips the value", () => {
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
		usePlayerStore.getState().toggleKaraokeMode();
		expect(usePlayerStore.getState().karaokeMode).toBe(true);
		usePlayerStore.getState().toggleKaraokeMode();
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});
});
