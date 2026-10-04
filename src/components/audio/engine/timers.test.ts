import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAutoSkip, createTimerBag, sameTarget } from "./timers";

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

describe("createTimerBag", () => {
	it("runs a callback after its delay", () => {
		const bag = createTimerBag();
		const fn = vi.fn();
		bag.after(1000, fn);
		expect(bag.size).toBe(1);
		vi.advanceTimersByTime(999);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(bag.size).toBe(0);
	});

	it("clear() cancels every pending callback (was: a retry scheduled for the previous track fired after a track change)", () => {
		const bag = createTimerBag();
		const a = vi.fn();
		const b = vi.fn();
		bag.after(1000, a);
		bag.after(2000, b);
		bag.clear();
		vi.advanceTimersByTime(5000);
		expect(a).not.toHaveBeenCalled();
		expect(b).not.toHaveBeenCalled();
		expect(bag.size).toBe(0);
	});

	it("returns a canceller for a single callback", () => {
		const bag = createTimerBag();
		const fn = vi.fn();
		const cancel = bag.after(100, fn);
		cancel();
		cancel();
		vi.advanceTimersByTime(200);
		expect(fn).not.toHaveBeenCalled();
	});
});

describe("sameTarget", () => {
	const el = {};
	it("only matches the same generation, element and track (was: the retry loaded the old track into the new element)", () => {
		const scheduled = { gen: 3, element: el, trackId: "a" };
		expect(sameTarget(scheduled, { gen: 3, element: el, trackId: "a" })).toBe(true);
		expect(sameTarget(scheduled, { gen: 4, element: el, trackId: "a" })).toBe(false);
		expect(sameTarget(scheduled, { gen: 3, element: {}, trackId: "a" })).toBe(false);
		expect(sameTarget(scheduled, { gen: 3, element: el, trackId: "b" })).toBe(false);
	});
});

describe("createAutoSkip", () => {
	function setup(initial: string | null = "bad") {
		let current: string | null = initial;
		const next = vi.fn((reason: string) => {
			void reason;
			current = "after";
		});
		const timers = createTimerBag();
		const skip = createAutoSkip({ timers, currentTrackId: () => current, next });
		return { skip, next, timers, setCurrent: (id: string | null) => (current = id) };
	}

	it("skips the failing track once after the delay, as an automatic advance", () => {
		const { skip, next } = setup();
		skip.arm("bad", 1500);
		expect(skip.armed).toBe(true);
		vi.advanceTimersByTime(1500);
		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith("auto");
		expect(skip.armed).toBe(false);
	});

	it("does not skip twice when the toast's Skip was clicked first (was: double skip)", () => {
		const { skip, next } = setup();
		skip.arm("bad", 1500);
		skip.skipNow("bad");
		vi.advanceTimersByTime(5000);
		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith("user");
	});

	it("does not skip after Retry cancelled it (was: skip after Retry)", () => {
		const { skip, next } = setup();
		skip.arm("bad", 1500);
		skip.cancel();
		vi.advanceTimersByTime(5000);
		expect(next).not.toHaveBeenCalled();
	});

	it("does not skip a track the user picked in the meantime (was: skipped the manually chosen track)", () => {
		const { skip, next, setCurrent } = setup();
		skip.arm("bad", 1500);
		setCurrent("picked");
		vi.advanceTimersByTime(1500);
		expect(next).not.toHaveBeenCalled();
		skip.skipNow("bad");
		expect(next).not.toHaveBeenCalled();
	});

	it("is cancelled with the rest of the bag on a track change", () => {
		const { skip, next, timers } = setup();
		skip.arm("bad", 1500);
		timers.clear();
		vi.advanceTimersByTime(1500);
		expect(next).not.toHaveBeenCalled();
	});

	it("re-arming replaces the pending skip", () => {
		const { skip, next } = setup();
		skip.arm("bad", 1500);
		skip.arm("bad", 3000);
		vi.advanceTimersByTime(1500);
		expect(next).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1500);
		expect(next).toHaveBeenCalledTimes(1);
	});
});
