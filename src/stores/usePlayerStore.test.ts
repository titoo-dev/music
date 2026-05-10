import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/utils/haptic", () => ({ haptic: vi.fn() }));

import { usePlayerStore, type PlayerTrack } from "./usePlayerStore";

const INITIAL = usePlayerStore.getState();

beforeEach(() => {
	usePlayerStore.setState(INITIAL, true);
});

function makeTrack(id: string, overrides: Partial<PlayerTrack> = {}): PlayerTrack {
	return {
		trackId: id,
		title: `Title ${id}`,
		artist: `Artist ${id}`,
		cover: null,
		duration: 200,
		...overrides,
	};
}

function makeQueue(ids: string[]): PlayerTrack[] {
	return ids.map((id) => makeTrack(id));
}

describe("usePlayerStore — play()", () => {
	it("plays a single track when no queue provided", () => {
		const t = makeTrack("a");
		usePlayerStore.getState().play(t);
		const s = usePlayerStore.getState();
		expect(s.currentTrack).toEqual(t);
		expect(s.queue).toEqual([t]);
		expect(s.queueIndex).toBe(0);
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
		expect(s.currentTime).toBe(0);
		expect(s.error).toBeNull();
	});

	it("plays a track with a queue (no shuffle): finds the matching index", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.getState().play(queue[2], queue);
		const s = usePlayerStore.getState();
		expect(s.queue).toEqual(queue);
		expect(s.queueIndex).toBe(2);
		expect(s.currentTrack?.trackId).toBe("c");
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});

	it("plays with queue but track not in queue: defaults to startIdx 0", () => {
		const queue = makeQueue(["a", "b", "c"]);
		const odd = makeTrack("z");
		usePlayerStore.getState().play(odd, queue);
		const s = usePlayerStore.getState();
		expect(s.queue).toEqual(queue);
		expect(s.queueIndex).toBe(0);
		// currentTrack is set to the tapped track even though it's not in queue.
		expect(s.currentTrack).toEqual(odd);
	});

	it("with shuffle ON places the tapped track at index 0", () => {
		usePlayerStore.setState({ shuffle: true });
		const queue = makeQueue(["a", "b", "c", "d", "e"]);
		usePlayerStore.getState().play(queue[3], queue);
		const s = usePlayerStore.getState();
		expect(s.queue.length).toBe(5);
		expect(s.queue[0].trackId).toBe("d");
		expect(s.currentTrack?.trackId).toBe("d");
		expect(s.queueIndex).toBe(0);
		// All original tracks must still be present.
		const ids = new Set(s.queue.map((t) => t.trackId));
		expect(ids).toEqual(new Set(["a", "b", "c", "d", "e"]));
	});

	it("with shuffle ON and queue length 1, just plays it", () => {
		usePlayerStore.setState({ shuffle: true });
		const queue = makeQueue(["only"]);
		usePlayerStore.getState().play(queue[0], queue);
		const s = usePlayerStore.getState();
		expect(s.queue).toEqual(queue);
		expect(s.currentTrack?.trackId).toBe("only");
		expect(s.queueIndex).toBe(0);
	});

	it("resumes when called for the same currentTrack with no queue", () => {
		const t = makeTrack("a");
		usePlayerStore.setState({
			currentTrack: t,
			queue: [t, makeTrack("b")],
			queueIndex: 0,
			isPlaying: false,
			error: "boom",
		});
		usePlayerStore.getState().play(t);
		const s = usePlayerStore.getState();
		expect(s.isPlaying).toBe(true);
		expect(s.error).toBeNull();
		// Queue should NOT be replaced.
		expect(s.queue.length).toBe(2);
		expect(s.queueIndex).toBe(0);
	});
});

describe("usePlayerStore — pause/resume/toggle/stop", () => {
	it("pause sets isPlaying false", () => {
		usePlayerStore.setState({ isPlaying: true });
		usePlayerStore.getState().pause();
		expect(usePlayerStore.getState().isPlaying).toBe(false);
	});

	it("resume sets isPlaying true", () => {
		usePlayerStore.setState({ isPlaying: false });
		usePlayerStore.getState().resume();
		expect(usePlayerStore.getState().isPlaying).toBe(true);
	});

	it("toggle flips isPlaying", () => {
		usePlayerStore.setState({ isPlaying: false });
		usePlayerStore.getState().toggle();
		expect(usePlayerStore.getState().isPlaying).toBe(true);
		usePlayerStore.getState().toggle();
		expect(usePlayerStore.getState().isPlaying).toBe(false);
	});

	it("stop wipes playback context", () => {
		const t = makeTrack("a");
		usePlayerStore.setState({
			currentTrack: t,
			queue: [t],
			queueIndex: 0,
			isPlaying: true,
			isBuffering: true,
			currentTime: 50,
			duration: 200,
			buffered: 60,
			error: "x",
			fullscreenOpen: true,
			queuePanelOpen: true,
		});
		usePlayerStore.getState().stop();
		const s = usePlayerStore.getState();
		expect(s.currentTrack).toBeNull();
		expect(s.queue).toEqual([]);
		expect(s.queueIndex).toBe(-1);
		expect(s.isPlaying).toBe(false);
		expect(s.isBuffering).toBe(false);
		expect(s.currentTime).toBe(0);
		expect(s.duration).toBe(0);
		expect(s.buffered).toBe(0);
		expect(s.error).toBeNull();
		expect(s.fullscreenOpen).toBe(false);
		expect(s.queuePanelOpen).toBe(false);
	});
});

describe("usePlayerStore — next()", () => {
	it("returns early on empty queue", () => {
		usePlayerStore.getState().next();
		const s = usePlayerStore.getState();
		expect(s.queue).toEqual([]);
		expect(s.queueIndex).toBe(-1);
	});

	it("advances queueIndex when not at end", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 0,
			currentTrack: queue[0],
			isPlaying: true,
		});
		usePlayerStore.getState().next();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("b");
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
		expect(s.currentTime).toBe(0);
	});

	it("at end with repeat=off calls stop()", () => {
		const queue = makeQueue(["a", "b"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 1,
			currentTrack: queue[1],
			repeat: "off",
			isPlaying: true,
		});
		usePlayerStore.getState().next();
		const s = usePlayerStore.getState();
		expect(s.currentTrack).toBeNull();
		expect(s.queue).toEqual([]);
		expect(s.queueIndex).toBe(-1);
		expect(s.isPlaying).toBe(false);
	});

	it("at end with repeat=all wraps to index 0", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 2,
			currentTrack: queue[2],
			repeat: "all",
			shuffle: false,
		});
		usePlayerStore.getState().next();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(0);
		expect(s.currentTrack?.trackId).toBe("a");
		expect(s.queue).toEqual(queue);
	});

	it("at end with repeat=all + shuffle reshuffles and starts at index 1", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 3,
			currentTrack: queue[3],
			repeat: "all",
			shuffle: true,
		});
		usePlayerStore.getState().next();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(1);
		// The just-finished track ("d") is parked at index 0 to avoid replay.
		expect(s.queue[0].trackId).toBe("d");
		expect(s.currentTrack?.trackId).toBe(s.queue[1].trackId);
		// All original ids preserved.
		const ids = new Set(s.queue.map((t) => t.trackId));
		expect(ids).toEqual(new Set(["a", "b", "c", "d"]));
		expect(s.queue.length).toBe(4);
	});

	it("at end with repeat=all + shuffle but queue length 1 falls through to wrap-to-0 path", () => {
		const queue = makeQueue(["only"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 0,
			currentTrack: queue[0],
			repeat: "all",
			shuffle: true,
		});
		usePlayerStore.getState().next();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(0);
		expect(s.currentTrack?.trackId).toBe("only");
	});
});

describe("usePlayerStore — prev()", () => {
	it("returns early on empty queue", () => {
		usePlayerStore.getState().prev();
		expect(usePlayerStore.getState().queueIndex).toBe(-1);
	});

	it("restarts current track when currentTime > 3", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 1,
			currentTrack: queue[1],
			currentTime: 17,
		});
		usePlayerStore.getState().prev();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("b");
		expect(s.currentTime).toBe(0);
		expect(s._seekTo).toBe(0);
	});

	it("at index 0, currentTime <= 3, repeat=all jumps to last track", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 0,
			currentTrack: queue[0],
			currentTime: 1,
			repeat: "all",
		});
		usePlayerStore.getState().prev();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(2);
		expect(s.currentTrack?.trackId).toBe("c");
	});

	it("at index 0, currentTime <= 3, repeat=off seeks to 0 (no track change)", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 0,
			currentTrack: queue[0],
			currentTime: 1,
			repeat: "off",
		});
		usePlayerStore.getState().prev();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(0);
		expect(s.currentTrack?.trackId).toBe("a");
		expect(s.currentTime).toBe(0);
		expect(s._seekTo).toBe(0);
	});

	it("middle of queue, currentTime <= 3 goes to previous track", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 2,
			currentTrack: queue[2],
			currentTime: 1,
		});
		usePlayerStore.getState().prev();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("b");
	});
});

describe("usePlayerStore — prevTrack()", () => {
	it("never restarts current even when currentTime > 3", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 2,
			currentTrack: queue[2],
			currentTime: 99,
		});
		usePlayerStore.getState().prevTrack();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("b");
	});

	it("at index 0, repeat=all jumps to last", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 0,
			currentTrack: queue[0],
			repeat: "all",
		});
		usePlayerStore.getState().prevTrack();
		expect(usePlayerStore.getState().queueIndex).toBe(2);
	});

	it("at index 0, repeat=off seeks to 0", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 0,
			currentTrack: queue[0],
			currentTime: 50,
			repeat: "off",
		});
		usePlayerStore.getState().prevTrack();
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(0);
		expect(s.currentTime).toBe(0);
		expect(s._seekTo).toBe(0);
	});

	it("returns early on empty queue", () => {
		usePlayerStore.getState().prevTrack();
		expect(usePlayerStore.getState().queueIndex).toBe(-1);
	});
});

describe("usePlayerStore — seek()", () => {
	it("clamps to [0, duration] when duration > 0", () => {
		usePlayerStore.setState({ duration: 100 });
		usePlayerStore.getState().seek(150);
		expect(usePlayerStore.getState().currentTime).toBe(100);
		expect(usePlayerStore.getState()._seekTo).toBe(100);
	});

	it("clamps negative to 0", () => {
		usePlayerStore.setState({ duration: 100 });
		usePlayerStore.getState().seek(-5);
		expect(usePlayerStore.getState().currentTime).toBe(0);
		expect(usePlayerStore.getState()._seekTo).toBe(0);
	});

	it("with duration 0, allows arbitrary positive seek (still floored at 0)", () => {
		usePlayerStore.setState({ duration: 0 });
		usePlayerStore.getState().seek(42);
		expect(usePlayerStore.getState().currentTime).toBe(42);
		expect(usePlayerStore.getState()._seekTo).toBe(42);
	});

	it("with duration 0, negative still clamps to 0", () => {
		usePlayerStore.setState({ duration: 0 });
		usePlayerStore.getState().seek(-99);
		expect(usePlayerStore.getState().currentTime).toBe(0);
		expect(usePlayerStore.getState()._seekTo).toBe(0);
	});
});

describe("usePlayerStore — retryTrack()", () => {
	it("bumps _retryLoadCount, clears error, sets isPlaying + isBuffering", () => {
		usePlayerStore.setState({
			_retryLoadCount: 3,
			error: "boom",
			isPlaying: false,
			isBuffering: false,
		});
		usePlayerStore.getState().retryTrack();
		const s = usePlayerStore.getState();
		expect(s._retryLoadCount).toBe(4);
		expect(s.error).toBeNull();
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});
});

describe("usePlayerStore — setVolume / toggleMute", () => {
	it("setVolume > 0 updates _lastNonZeroVolume", () => {
		usePlayerStore.setState({ volume: 80, _lastNonZeroVolume: 80 });
		usePlayerStore.getState().setVolume(45);
		const s = usePlayerStore.getState();
		expect(s.volume).toBe(45);
		expect(s._lastNonZeroVolume).toBe(45);
	});

	it("setVolume(0) does NOT update _lastNonZeroVolume", () => {
		usePlayerStore.setState({ volume: 80, _lastNonZeroVolume: 80 });
		usePlayerStore.getState().setVolume(0);
		const s = usePlayerStore.getState();
		expect(s.volume).toBe(0);
		expect(s._lastNonZeroVolume).toBe(80);
	});

	it("toggleMute when volume>0 sets volume=0 and saves last", () => {
		usePlayerStore.setState({ volume: 60, _lastNonZeroVolume: 60 });
		usePlayerStore.getState().toggleMute();
		const s = usePlayerStore.getState();
		expect(s.volume).toBe(0);
		expect(s._lastNonZeroVolume).toBe(60);
	});

	it("toggleMute when volume=0 restores last non-zero volume", () => {
		usePlayerStore.setState({ volume: 0, _lastNonZeroVolume: 33 });
		usePlayerStore.getState().toggleMute();
		expect(usePlayerStore.getState().volume).toBe(33);
	});

	it("toggleMute when volume=0 and last is 0 falls back to 80", () => {
		usePlayerStore.setState({ volume: 0, _lastNonZeroVolume: 0 });
		usePlayerStore.getState().toggleMute();
		expect(usePlayerStore.getState().volume).toBe(80);
	});
});

describe("usePlayerStore — toggleShuffle()", () => {
	it("turning ON with empty queue / no current track just flips the flag", () => {
		usePlayerStore.setState({ shuffle: false, queue: [], queueIndex: -1 });
		usePlayerStore.getState().toggleShuffle();
		expect(usePlayerStore.getState().shuffle).toBe(true);
		expect(usePlayerStore.getState().queue).toEqual([]);
	});

	it("turning ON shuffles only the upcoming portion (after queueIndex)", () => {
		const queue = makeQueue(["a", "b", "c", "d", "e", "f"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 1, // played: a, b — upcoming: c,d,e,f
			currentTrack: queue[1],
			shuffle: false,
		});
		usePlayerStore.getState().toggleShuffle();
		const s = usePlayerStore.getState();
		expect(s.shuffle).toBe(true);
		expect(s.queue.length).toBe(6);
		// First 2 must be untouched.
		expect(s.queue[0].trackId).toBe("a");
		expect(s.queue[1].trackId).toBe("b");
		// Remaining 4 are some permutation of c,d,e,f.
		const remaining = new Set(s.queue.slice(2).map((t) => t.trackId));
		expect(remaining).toEqual(new Set(["c", "d", "e", "f"]));
	});

	it("turning ON with queue length 1 just flips the flag", () => {
		const queue = makeQueue(["only"]);
		usePlayerStore.setState({
			queue,
			queueIndex: 0,
			currentTrack: queue[0],
			shuffle: false,
		});
		usePlayerStore.getState().toggleShuffle();
		expect(usePlayerStore.getState().shuffle).toBe(true);
		expect(usePlayerStore.getState().queue).toEqual(queue);
	});

	it("turning OFF preserves current queue order (no restore)", () => {
		const queue = makeQueue(["c", "a", "b", "d"]);
		usePlayerStore.setState({ queue, queueIndex: 0, shuffle: true });
		usePlayerStore.getState().toggleShuffle();
		const s = usePlayerStore.getState();
		expect(s.shuffle).toBe(false);
		expect(s.queue).toEqual(queue);
	});
});

describe("usePlayerStore — addNext()", () => {
	it("falls back to play() when queue is empty", () => {
		const t = makeTrack("a");
		usePlayerStore.getState().addNext(t);
		const s = usePlayerStore.getState();
		expect(s.currentTrack).toEqual(t);
		expect(s.queue).toEqual([t]);
		expect(s.queueIndex).toBe(0);
		expect(s.isPlaying).toBe(true);
	});

	it("falls back to play() when queueIndex < 0", () => {
		const t = makeTrack("a");
		usePlayerStore.setState({ queue: makeQueue(["x"]), queueIndex: -1 });
		usePlayerStore.getState().addNext(t);
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(0);
		expect(s.currentTrack).toEqual(t);
	});

	it("inserts after the current index", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		const newTrack = makeTrack("z");
		usePlayerStore.getState().addNext(newTrack);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["a", "z", "b", "c"]);
		expect(s.queueIndex).toBe(0);
	});

	it("de-dupes existing occurrence after the current index", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		// 'c' already exists at index 2 — should be removed and re-inserted at index 1.
		usePlayerStore.getState().addNext(queue[2]);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["a", "c", "b", "d"]);
		expect(s.queueIndex).toBe(0);
	});

	it("de-dupes existing occurrence BEFORE the current index and adjusts queueIndex", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.setState({ queue, queueIndex: 2, currentTrack: queue[2] });
		// Adding 'a' (at index 0, before current) — the duplicate is removed,
		// queueIndex shifts down by 1, then 'a' is inserted right after.
		usePlayerStore.getState().addNext(queue[0]);
		const s = usePlayerStore.getState();
		// Removing 'a': [b, c, d], queueIndex -> 1 (still pointing to 'c').
		// Insert 'a' at queueIndex+1 = 2: [b, c, a, d].
		expect(s.queue.map((t) => t.trackId)).toEqual(["b", "c", "a", "d"]);
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("c");
	});

	it("does NOT remove the currently-playing track when adding it as next", () => {
		const queue = makeQueue(["a", "b"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().addNext(queue[0]); // 'a' is current
		const s = usePlayerStore.getState();
		// Existing 'a' at queueIndex is preserved; another 'a' is inserted at queueIndex+1.
		expect(s.queue.map((t) => t.trackId)).toEqual(["a", "a", "b"]);
		expect(s.queueIndex).toBe(0);
	});
});

describe("usePlayerStore — addToQueue()", () => {
	it("falls back to play() when queue is empty", () => {
		const t = makeTrack("a");
		usePlayerStore.getState().addToQueue(t);
		const s = usePlayerStore.getState();
		expect(s.currentTrack).toEqual(t);
		expect(s.queue).toEqual([t]);
		expect(s.queueIndex).toBe(0);
	});

	it("appends to end of queue", () => {
		const queue = makeQueue(["a", "b"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		const z = makeTrack("z");
		usePlayerStore.getState().addToQueue(z);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["a", "b", "z"]);
		expect(s.queueIndex).toBe(0);
	});

	it("ignores duplicates", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().addToQueue(queue[1]);
		expect(usePlayerStore.getState().queue.length).toBe(3);
	});
});

describe("usePlayerStore — removeFromQueue()", () => {
	it("refuses to remove the currently-playing index", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({ queue, queueIndex: 1, currentTrack: queue[1] });
		usePlayerStore.getState().removeFromQueue(1);
		const s = usePlayerStore.getState();
		expect(s.queue.length).toBe(3);
		expect(s.queueIndex).toBe(1);
	});

	it("ignores out-of-bounds index", () => {
		const queue = makeQueue(["a", "b"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().removeFromQueue(-1);
		usePlayerStore.getState().removeFromQueue(99);
		expect(usePlayerStore.getState().queue.length).toBe(2);
	});

	it("removing an index BEFORE current decrements queueIndex", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.setState({ queue, queueIndex: 2, currentTrack: queue[2] });
		usePlayerStore.getState().removeFromQueue(0);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["b", "c", "d"]);
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("c");
	});

	it("removing an index AFTER current keeps queueIndex", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.setState({ queue, queueIndex: 1, currentTrack: queue[1] });
		usePlayerStore.getState().removeFromQueue(3);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["a", "b", "c"]);
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("b");
	});
});

describe("usePlayerStore — moveInQueue()", () => {
	it("no-op when from === to", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().moveInQueue(1, 1);
		expect(usePlayerStore.getState().queue.map((t) => t.trackId)).toEqual([
			"a",
			"b",
			"c",
		]);
	});

	it("ignores out-of-bounds indices", () => {
		const queue = makeQueue(["a", "b"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().moveInQueue(-1, 0);
		usePlayerStore.getState().moveInQueue(0, 5);
		expect(usePlayerStore.getState().queue).toEqual(queue);
	});

	it("moving the current track itself updates queueIndex to `to`", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().moveInQueue(0, 2);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["b", "c", "a", "d"]);
		expect(s.queueIndex).toBe(2);
		expect(s.currentTrack?.trackId).toBe("a");
	});

	it("moving a track from before current to after current shifts queueIndex down", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		// current = 'c' at index 2
		usePlayerStore.setState({ queue, queueIndex: 2, currentTrack: queue[2] });
		// Move 'a' (idx 0, < 2) to idx 3 (>= 2).
		usePlayerStore.getState().moveInQueue(0, 3);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["b", "c", "d", "a"]);
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("c");
	});

	it("moving a track from after current to before current shifts queueIndex up", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		// current = 'b' at index 1
		usePlayerStore.setState({ queue, queueIndex: 1, currentTrack: queue[1] });
		// Move 'd' (idx 3, > 1) to idx 0 (<= 1).
		usePlayerStore.getState().moveInQueue(3, 0);
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["d", "a", "b", "c"]);
		expect(s.queueIndex).toBe(2);
		expect(s.currentTrack?.trackId).toBe("b");
	});
});

describe("usePlayerStore — clearQueue()", () => {
	it("keeps only the current track and resets queueIndex", () => {
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.setState({ queue, queueIndex: 2, currentTrack: queue[2] });
		usePlayerStore.getState().clearQueue();
		const s = usePlayerStore.getState();
		expect(s.queue.length).toBe(1);
		expect(s.queue[0].trackId).toBe("c");
		expect(s.queueIndex).toBe(0);
	});

	it("no-op when queue length <= 1", () => {
		const queue = makeQueue(["a"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().clearQueue();
		expect(usePlayerStore.getState().queue.length).toBe(1);
		expect(usePlayerStore.getState().queueIndex).toBe(0);
	});

	it("no-op when no current track", () => {
		usePlayerStore.setState({ queue: [], queueIndex: -1, currentTrack: null });
		usePlayerStore.getState().clearQueue();
		const s = usePlayerStore.getState();
		expect(s.queue).toEqual([]);
		expect(s.queueIndex).toBe(-1);
	});
});

describe("usePlayerStore — playQueue()", () => {
	it("returns early on empty queue", () => {
		usePlayerStore.getState().playQueue([]);
		const s = usePlayerStore.getState();
		expect(s.queue).toEqual([]);
		expect(s.currentTrack).toBeNull();
	});

	it("plays at startIndex with shuffle off", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.getState().playQueue(queue, 1);
		const s = usePlayerStore.getState();
		expect(s.queue).toEqual(queue);
		expect(s.queueIndex).toBe(1);
		expect(s.currentTrack?.trackId).toBe("b");
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
	});

	it("startIndex defaults to 0", () => {
		const queue = makeQueue(["a", "b"]);
		usePlayerStore.getState().playQueue(queue);
		expect(usePlayerStore.getState().queueIndex).toBe(0);
	});

	it("with shuffle on, places the start track at index 0", () => {
		usePlayerStore.setState({ shuffle: true });
		const queue = makeQueue(["a", "b", "c", "d"]);
		usePlayerStore.getState().playQueue(queue, 2);
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(0);
		expect(s.currentTrack?.trackId).toBe("c");
		expect(s.queue[0].trackId).toBe("c");
		expect(new Set(s.queue.map((t) => t.trackId))).toEqual(new Set(["a", "b", "c", "d"]));
	});
});

describe("usePlayerStore — jumpToIndex()", () => {
	it("ignores out-of-bounds index", () => {
		const queue = makeQueue(["a", "b"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().jumpToIndex(-1);
		usePlayerStore.getState().jumpToIndex(2);
		expect(usePlayerStore.getState().queueIndex).toBe(0);
	});

	it("jumps to the given index", () => {
		const queue = makeQueue(["a", "b", "c"]);
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		usePlayerStore.getState().jumpToIndex(2);
		const s = usePlayerStore.getState();
		expect(s.queueIndex).toBe(2);
		expect(s.currentTrack?.trackId).toBe("c");
		expect(s.isPlaying).toBe(true);
		expect(s.isBuffering).toBe(true);
		expect(s.currentTime).toBe(0);
	});
});

describe("usePlayerStore — toggleRepeat()", () => {
	it("cycles off → all → one → off", () => {
		usePlayerStore.setState({ repeat: "off" });
		usePlayerStore.getState().toggleRepeat();
		expect(usePlayerStore.getState().repeat).toBe("all");
		usePlayerStore.getState().toggleRepeat();
		expect(usePlayerStore.getState().repeat).toBe("one");
		usePlayerStore.getState().toggleRepeat();
		expect(usePlayerStore.getState().repeat).toBe("off");
	});
});

describe("usePlayerStore — misc setters", () => {
	it("setError / setCurrentTime / setDuration / setBuffered / setBuffering", () => {
		const api = usePlayerStore.getState();
		api.setError("nope");
		expect(usePlayerStore.getState().error).toBe("nope");
		api.setCurrentTime(42);
		expect(usePlayerStore.getState().currentTime).toBe(42);
		api.setDuration(300);
		expect(usePlayerStore.getState().duration).toBe(300);
		api.setBuffered(50);
		expect(usePlayerStore.getState().buffered).toBe(50);
		api.setBuffering(true);
		expect(usePlayerStore.getState().isBuffering).toBe(true);
	});

	it("setFullscreenOpen / setQueuePanelOpen", () => {
		usePlayerStore.getState().setFullscreenOpen(true);
		expect(usePlayerStore.getState().fullscreenOpen).toBe(true);
		usePlayerStore.getState().setQueuePanelOpen(true);
		expect(usePlayerStore.getState().queuePanelOpen).toBe(true);
	});

	it("setCrossfadeDuration / toggleNormalization", () => {
		usePlayerStore.getState().setCrossfadeDuration(3);
		expect(usePlayerStore.getState().crossfadeDuration).toBe(3);
		const before = usePlayerStore.getState().normalizationEnabled;
		usePlayerStore.getState().toggleNormalization();
		expect(usePlayerStore.getState().normalizationEnabled).toBe(!before);
	});
});
