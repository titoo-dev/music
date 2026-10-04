import { describe, it, expect, vi } from "vitest";
import {
	PLAY_THRESHOLD_SECONDS,
	accumulateListened,
	advanceQueue,
	claimBackgroundPersist,
	reachedPlayThreshold,
	createTrackSession,
	shouldNotifySkip,
	startVolume,
} from "./session";

describe("claimBackgroundPersist", () => {
	const PREVIEW = "https://app/api/v1/stream-progressive/7?preview=1";

	it("asks the server to store a track playing from a preview stream once per play (was: every seek and the 30 s mark each opened a persisting stream)", () => {
		const s = createTrackSession("7");
		expect(claimBackgroundPersist(s, PREVIEW)).toBe(true);
		expect(claimBackgroundPersist(s, PREVIEW)).toBe(false);
		expect(claimBackgroundPersist(createTrackSession("7"), PREVIEW)).toBe(true);
	});

	it("never for a source that already persists or is already stored", () => {
		const s = createTrackSession("7");
		expect(claimBackgroundPersist(s, "https://app/api/v1/stream-progressive/7")).toBe(false);
		expect(claimBackgroundPersist(s, "https://r2.example/t.mp3?sig=1")).toBe(false);
		expect(claimBackgroundPersist(s, "blob:https://app/1")).toBe(false);
		expect(claimBackgroundPersist(null, PREVIEW)).toBe(false);
	});
});

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

	it("doesn't report a failed track as skipped (was: the give-up auto-skip sent a skip notification)", () => {
		const s = createTrackSession("1");
		s.failed = true;
		expect(shouldNotifySkip(s)).toBe(false);
	});

	it("doesn't report a track that only played from a preview stream (was: a skip for a play that stored nothing)", () => {
		const s = createTrackSession("1");
		s.playedFrom = "https://app/api/v1/stream-progressive/1?preview=1";
		expect(shouldNotifySkip(s)).toBe(false);
		s.playedFrom = "https://r2.example/t.mp3?sig=1";
		expect(shouldNotifySkip(s)).toBe(true);
	});
});

describe("accumulateListened", () => {
	function play(s: ReturnType<typeof createTrackSession>, from: number, to: number) {
		for (let t = from; t <= to + 1e-9; t += 0.25) accumulateListened(s, t);
	}

	it("a seek past 0:30 doesn't count as a play (was: currentTime >= 30 logged it)", () => {
		const s = createTrackSession("1");
		play(s, 0, 2);
		accumulateListened(s, 95);
		play(s, 95, 100);
		expect(s.listened).toBeCloseTo(7);
		expect(reachedPlayThreshold(s)).toBe(false);
	});

	it("counts 30 s of real playback, across seeks", () => {
		const s = createTrackSession("1");
		play(s, 0, 20);
		accumulateListened(s, 120);
		play(s, 120, 130);
		expect(reachedPlayThreshold(s)).toBe(true);
	});

	it("ignores backward jumps and long gaps", () => {
		const s = createTrackSession("1");
		accumulateListened(s, 10);
		accumulateListened(s, 2);
		accumulateListened(s, 5);
		expect(s.listened).toBe(0);
		accumulateListened(s, 6);
		expect(s.listened).toBe(1);
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
