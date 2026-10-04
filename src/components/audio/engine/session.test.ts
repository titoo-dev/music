import { describe, it, expect, vi } from "vitest";
import {
	PLAY_THRESHOLD_SECONDS,
	advanceQueue,
	createTrackSession,
	shouldNotifySkip,
	startVolume,
} from "./session";

describe("createTrackSession", () => {
	it("starts every per-track flag over (was: crossfade kept the previous track's play flag, retries and norm state)", () => {
		const s = createTrackSession("42");
		expect(s).toMatchObject({ trackId: "42", logged: false, retryCount: 0, autoAdvance: false });
		expect(createTrackSession("43", { autoAdvance: true }).autoAdvance).toBe(true);
		expect(PLAY_THRESHOLD_SECONDS).toBe(30);
	});
});

describe("shouldNotifySkip", () => {
	it("notifies a track left before its play was logged", () => {
		expect(shouldNotifySkip(createTrackSession("1"))).toBe(true);
	});

	it("never notifies a logged play or a missing session", () => {
		const s = createTrackSession("1");
		s.logged = true;
		expect(shouldNotifySkip(s)).toBe(false);
		expect(shouldNotifySkip(null)).toBe(false);
	});
});

describe("startVolume", () => {
	it("fades a user-initiated start in from silence", () => {
		expect(startVolume(false, 0.8)).toEqual({ from: 0, fadeMs: 200 });
	});

	it("starts a queue advance at full volume (was: every track faded in from 0, a dip between tracks)", () => {
		expect(startVolume(true, 0.8)).toEqual({ from: 0.8, fadeMs: 0 });
	});
});

describe("advanceQueue", () => {
	function store(tracks: (object | null)[]) {
		let i = 0;
		const state = {
			get currentTrack() {
				return tracks[i];
			},
			next: vi.fn(() => {
				i = Math.min(i + 1, tracks.length - 1);
			}),
		};
		return { getState: () => state, state };
	}

	it("flags an automatic advance to another track", () => {
		const flag = { current: false };
		const s = store([{ id: 1 }, { id: 2 }]);
		advanceQueue(flag, true, s);
		expect(s.state.next).toHaveBeenCalledTimes(1);
		expect(flag.current).toBe(true);
	});

	it("drops the flag when the queue ended instead (no stale 'no fade' on the next user play)", () => {
		const flag = { current: false };
		advanceQueue(flag, true, store([{ id: 1 }, null]));
		expect(flag.current).toBe(false);
		const same = { id: 1 };
		advanceQueue(flag, true, store([same, same]));
		expect(flag.current).toBe(false);
	});

	it("keeps a user skip unflagged", () => {
		const flag = { current: true };
		advanceQueue(flag, false, store([{ id: 1 }, { id: 2 }]));
		expect(flag.current).toBe(false);
	});
});
