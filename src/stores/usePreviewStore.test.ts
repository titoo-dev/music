import { describe, it, expect, beforeEach } from "vitest";
import { usePreviewStore } from "./usePreviewStore";

const INITIAL = usePreviewStore.getState();

beforeEach(() => {
	usePreviewStore.setState(INITIAL, true);
});

type PreviewTrack = NonNullable<ReturnType<typeof usePreviewStore.getState>["currentTrack"]>;

function makeTrack(id: string, overrides: Partial<PreviewTrack> = {}): PreviewTrack {
	return {
		id,
		title: `Title ${id}`,
		artist: `Artist ${id}`,
		cover: "",
		previewUrl: `https://example.test/preview/${id}.mp3`,
		...overrides,
	};
}

describe("usePreviewStore — initial state", () => {
	it("has expected defaults", () => {
		const s = usePreviewStore.getState();
		expect(s.currentTrack).toBeNull();
		expect(s.isPlaying).toBe(false);
		expect(s.isBuffering).toBe(false);
		expect(s.volume).toBe(80);
		expect(s._mainWasPlaying).toBe(false);
	});
});

describe("usePreviewStore — play()", () => {
	it("sets currentTrack, marks playing + buffering", () => {
		const t = makeTrack("a");
		usePreviewStore.getState().play(t);
		const s = usePreviewStore.getState();
		expect(s.currentTrack).toEqual(t);
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});

	it("replaces an existing track", () => {
		usePreviewStore.getState().play(makeTrack("a"));
		usePreviewStore.getState().play(makeTrack("b"));
		expect(usePreviewStore.getState().currentTrack?.id).toBe("b");
		expect(usePreviewStore.getState().isPlaying).toBe(true);
	});
});

describe("usePreviewStore — pause()", () => {
	it("flips isPlaying to false but keeps currentTrack", () => {
		const t = makeTrack("a");
		usePreviewStore.getState().play(t);
		usePreviewStore.getState().pause();
		const s = usePreviewStore.getState();
		expect(s.isPlaying).toBe(false);
		expect(s.currentTrack).toEqual(t);
	});
});

describe("usePreviewStore — stop()", () => {
	it("clears currentTrack and resets play/buffer flags", () => {
		usePreviewStore.getState().play(makeTrack("a"));
		usePreviewStore.getState().stop();
		const s = usePreviewStore.getState();
		expect(s.currentTrack).toBeNull();
		expect(s.isPlaying).toBe(false);
		expect(s.isBuffering).toBe(false);
	});
});

describe("usePreviewStore — toggle()", () => {
	it("starts playback when nothing is playing", () => {
		const t = makeTrack("a");
		usePreviewStore.getState().toggle(t);
		const s = usePreviewStore.getState();
		expect(s.currentTrack).toEqual(t);
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});

	it("pauses when toggling the same track that is currently playing", () => {
		const t = makeTrack("a");
		usePreviewStore.getState().play(t);
		usePreviewStore.getState().toggle(t);
		const s = usePreviewStore.getState();
		expect(s.isPlaying).toBe(false);
		// currentTrack still set (not cleared).
		expect(s.currentTrack?.id).toBe("a");
	});

	it("resumes (re-plays) when toggling a paused track", () => {
		const t = makeTrack("a");
		usePreviewStore.getState().play(t);
		usePreviewStore.getState().pause();
		usePreviewStore.getState().toggle(t);
		const s = usePreviewStore.getState();
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});

	it("switches to a different track when toggling another id", () => {
		const a = makeTrack("a");
		const b = makeTrack("b");
		usePreviewStore.getState().play(a);
		usePreviewStore.getState().toggle(b);
		const s = usePreviewStore.getState();
		expect(s.currentTrack?.id).toBe("b");
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});

	it("toggle(null) when no current is playing sets currentTrack=null and flips isPlaying on", () => {
		// Both ids resolve to undefined and undefined === undefined, but only if isPlaying.
		// Initial state: currentTrack is null, isPlaying is false → should hit the else branch.
		usePreviewStore.getState().toggle(null);
		const s = usePreviewStore.getState();
		expect(s.currentTrack).toBeNull();
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});
});

describe("usePreviewStore — setters", () => {
	it("setVolume", () => {
		usePreviewStore.getState().setVolume(33);
		expect(usePreviewStore.getState().volume).toBe(33);
	});

	it("setBuffering", () => {
		usePreviewStore.getState().setBuffering(true);
		expect(usePreviewStore.getState().isBuffering).toBe(true);
		usePreviewStore.getState().setBuffering(false);
		expect(usePreviewStore.getState().isBuffering).toBe(false);
	});

	it("setMainWasPlaying", () => {
		usePreviewStore.getState().setMainWasPlaying(true);
		expect(usePreviewStore.getState()._mainWasPlaying).toBe(true);
		usePreviewStore.getState().setMainWasPlaying(false);
		expect(usePreviewStore.getState()._mainWasPlaying).toBe(false);
	});
});
