import { describe, it, expect, beforeEach } from "vitest";
import { useStemsStore } from "./useStemsStore";

const INITIAL = useStemsStore.getState();

beforeEach(() => {
	useStemsStore.setState(INITIAL, true);
});

describe("useStemsStore — initial state", () => {
	it("has expected defaults", () => {
		const s = useStemsStore.getState();
		expect(s.mode).toBe("off");
		expect(s.volumes).toEqual({});
		expect(s.muted).toEqual({});
	});
});

describe("useStemsStore — setMode", () => {
	it("flips the playback mode", () => {
		useStemsStore.getState().setMode("karaoke");
		expect(useStemsStore.getState().mode).toBe("karaoke");
		useStemsStore.getState().setMode("custom");
		expect(useStemsStore.getState().mode).toBe("custom");
	});
});

describe("useStemsStore — setVolume", () => {
	it("clamps to [0, 100] and rounds", () => {
		useStemsStore.getState().setVolume("vocals", 42.7);
		expect(useStemsStore.getState().volumes.vocals).toBe(43);

		useStemsStore.getState().setVolume("vocals", -10);
		expect(useStemsStore.getState().volumes.vocals).toBe(0);

		useStemsStore.getState().setVolume("vocals", 200);
		expect(useStemsStore.getState().volumes.vocals).toBe(100);
	});

	it("falls back to 100 for non-finite input", () => {
		useStemsStore.getState().setVolume("drums", NaN);
		expect(useStemsStore.getState().volumes.drums).toBe(100);
	});

	it("preserves untouched stems", () => {
		useStemsStore.getState().setVolume("vocals", 50);
		useStemsStore.getState().setVolume("drums", 20);
		const v = useStemsStore.getState().volumes;
		expect(v.vocals).toBe(50);
		expect(v.drums).toBe(20);
	});
});

describe("useStemsStore — toggleMute", () => {
	it("flips mute and is independent across stems", () => {
		useStemsStore.getState().toggleMute("vocals");
		expect(useStemsStore.getState().muted.vocals).toBe(true);
		expect(useStemsStore.getState().muted.drums).toBeUndefined();

		useStemsStore.getState().toggleMute("vocals");
		expect(useStemsStore.getState().muted.vocals).toBe(false);
	});
});

describe("useStemsStore — resetMixer", () => {
	it("clears volumes, mutes, and resets mode", () => {
		useStemsStore.getState().setVolume("vocals", 30);
		useStemsStore.getState().toggleMute("drums");
		useStemsStore.getState().setMode("karaoke");
		useStemsStore.getState().resetMixer();
		const s = useStemsStore.getState();
		expect(s.volumes).toEqual({});
		expect(s.muted).toEqual({});
		expect(s.mode).toBe("off");
	});
});

describe("useStemsStore — effectiveVolume", () => {
	it("returns 100 by default", () => {
		expect(useStemsStore.getState().effectiveVolume("vocals")).toBe(100);
	});

	it("returns the dialed value when set", () => {
		useStemsStore.getState().setVolume("drums", 30);
		expect(useStemsStore.getState().effectiveVolume("drums")).toBe(30);
	});

	it("returns 0 when muted, regardless of volume", () => {
		useStemsStore.getState().setVolume("bass", 80);
		useStemsStore.getState().toggleMute("bass");
		expect(useStemsStore.getState().effectiveVolume("bass")).toBe(0);
	});

	it("hard-mutes vocals in karaoke mode without erasing the stored volume", () => {
		useStemsStore.getState().setVolume("vocals", 70);
		useStemsStore.getState().setMode("karaoke");
		expect(useStemsStore.getState().effectiveVolume("vocals")).toBe(0);
		// Switching back to custom restores the dialed level.
		useStemsStore.getState().setMode("custom");
		expect(useStemsStore.getState().effectiveVolume("vocals")).toBe(70);
	});

	it("does not affect non-vocal stems in karaoke mode", () => {
		useStemsStore.getState().setVolume("drums", 60);
		useStemsStore.getState().setMode("karaoke");
		expect(useStemsStore.getState().effectiveVolume("drums")).toBe(60);
	});
});
