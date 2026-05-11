// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "./usePlayerStore";

const INITIAL = usePlayerStore.getState();

beforeEach(() => {
	usePlayerStore.setState(INITIAL, true);
});

function track(id: string) {
	return {
		trackId: id,
		title: `Track ${id}`,
		artist: "Artist",
		cover: null,
		duration: 200,
	};
}

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

describe("usePlayerStore — karaokeMode auto-reset on track change", () => {
	it("next() turns karaoke off", () => {
		usePlayerStore.getState().play(track("A"), [track("A"), track("B")]);
		usePlayerStore.getState().setKaraokeMode(true);
		expect(usePlayerStore.getState().karaokeMode).toBe(true);

		usePlayerStore.getState().next();
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("B");
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});

	it("prev() to a different track turns karaoke off", () => {
		usePlayerStore
			.getState()
			.play(track("B"), [track("A"), track("B")]);
		usePlayerStore.getState().setKaraokeMode(true);

		usePlayerStore.getState().prev();
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("A");
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});

	it("prev() that restarts the same track keeps karaoke on", () => {
		usePlayerStore
			.getState()
			.play(track("B"), [track("A"), track("B")]);
		usePlayerStore.setState({ currentTime: 10 });
		usePlayerStore.getState().setKaraokeMode(true);

		usePlayerStore.getState().prev();
		// Same track, time reset to 0
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("B");
		expect(usePlayerStore.getState().karaokeMode).toBe(true);
	});

	it("jumpToIndex turns karaoke off", () => {
		usePlayerStore
			.getState()
			.play(track("A"), [track("A"), track("B"), track("C")]);
		usePlayerStore.getState().setKaraokeMode(true);

		usePlayerStore.getState().jumpToIndex(2);
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("C");
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});

	it("playQueue() turns karaoke off", () => {
		usePlayerStore.getState().play(track("X"));
		usePlayerStore.getState().setKaraokeMode(true);

		usePlayerStore.getState().playQueue([track("A"), track("B")], 0);
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("A");
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});

	it("play() to a brand new track turns karaoke off", () => {
		usePlayerStore.getState().play(track("A"));
		usePlayerStore.getState().setKaraokeMode(true);

		usePlayerStore.getState().play(track("B"));
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("B");
		expect(usePlayerStore.getState().karaokeMode).toBe(false);
	});

	it("play() resuming the same track keeps karaoke on", () => {
		usePlayerStore.getState().play(track("A"));
		usePlayerStore.getState().setKaraokeMode(true);
		usePlayerStore.getState().pause();

		// No queue, same trackId — this is the "resume after pause" path.
		usePlayerStore.getState().play(track("A"));
		expect(usePlayerStore.getState().karaokeMode).toBe(true);
	});

	it("play() with a queue containing the same trackId keeps karaoke on", () => {
		// "Same music" wins over "fresh queue" — the user is still on the
		// same song, even if the surrounding playback context changed.
		usePlayerStore.getState().play(track("A"));
		usePlayerStore.getState().setKaraokeMode(true);

		usePlayerStore.getState().play(track("A"), [track("A"), track("B")]);
		expect(usePlayerStore.getState().karaokeMode).toBe(true);
	});
});
