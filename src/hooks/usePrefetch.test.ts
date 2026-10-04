import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/lib/audio-cache", () => ({
	prefetchTracks: vi.fn(async () => {}),
	getCachedBlobUrl: vi.fn(async () => null),
	prefetchTrack: vi.fn(async () => false),
}));

import { prefetchTracks } from "@/lib/audio-cache";
import { cachedSourceResolver } from "@/components/audio/engine/prefetch";
import { usePrefetch } from "./usePrefetch";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	Object.defineProperty(navigator, "connection", { value: undefined, configurable: true });
});

const ids = Array.from({ length: 20 }, (_, i) => `t${i}`);

describe("usePrefetch", () => {
	it("prefetches the first 5 tracks through the cached-only resolver (was: each one made the server download and store the track)", () => {
		renderHook(() => usePrefetch(ids));
		vi.advanceTimersByTime(1500);
		expect(prefetchTracks).toHaveBeenCalledWith(
			["t0", "t1", "t2", "t3", "t4"],
			2,
			expect.objectContaining({ resolveSource: cachedSourceResolver, signal: expect.any(AbortSignal) })
		);
	});

	it("aborts the running batch when the page goes away (was: downloads kept running after leaving)", () => {
		const { unmount } = renderHook(() => usePrefetch(ids));
		vi.advanceTimersByTime(1500);
		const signal = vi.mocked(prefetchTracks).mock.calls[0][2]!.signal!;
		expect(signal.aborted).toBe(false);
		unmount();
		expect(signal.aborted).toBe(true);
	});

	it("waits for the debounce and skips a page left quickly", () => {
		const { unmount } = renderHook(() => usePrefetch(ids));
		vi.advanceTimersByTime(1000);
		unmount();
		vi.advanceTimersByTime(1000);
		expect(prefetchTracks).not.toHaveBeenCalled();
	});

	it("does nothing on Save-Data or when disabled", () => {
		Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
		renderHook(() => usePrefetch(ids));
		vi.advanceTimersByTime(1500);
		Object.defineProperty(navigator, "connection", { value: undefined, configurable: true });
		renderHook(() => usePrefetch(ids, false));
		vi.advanceTimersByTime(1500);
		expect(prefetchTracks).not.toHaveBeenCalled();
	});
});
