import { describe, it, expect, vi } from "vitest";
import {
	canSeekInPlace,
	inRanges,
	isPreviewSource,
	isRangelessSource,
	waitForSeekableUrl,
	type TimeRangesLike,
} from "./seek";

function ranges(...pairs: [number, number][]): TimeRangesLike {
	return {
		length: pairs.length,
		start: (i) => pairs[i][0],
		end: (i) => pairs[i][1],
	};
}

const PROGRESSIVE = "https://wavelet.titosy.dev/api/v1/stream-progressive/3395056761";
const PRESIGNED = "https://store.private.blob.vercel-storage.com/music/Album/CD1/T.flac?token=x";

describe("isRangelessSource / isPreviewSource", () => {
	it("flags the live progressive stream only", () => {
		expect(isRangelessSource(PROGRESSIVE)).toBe(true);
		expect(isRangelessSource(`${PROGRESSIVE}?preview=1&head=1`)).toBe(true);
		expect(isRangelessSource("/api/v1/stream/3395056761")).toBe(false);
		expect(isRangelessSource(PRESIGNED)).toBe(false);
		expect(isRangelessSource("blob:https://wavelet.titosy.dev/1234")).toBe(false);
	});

	it("detects preview streams, which never persist on their own", () => {
		expect(isPreviewSource(`${PROGRESSIVE}?preview=1`)).toBe(true);
		expect(isPreviewSource(`${PROGRESSIVE}?preview=1&head=1`)).toBe(true);
		expect(isPreviewSource(PROGRESSIVE)).toBe(false);
		expect(isPreviewSource(`${PRESIGNED}&preview=1`)).toBe(false);
	});
});

describe("inRanges", () => {
	it("checks every range, bounds inclusive", () => {
		const r = ranges([0, 10], [20, 30]);
		expect(inRanges(0, r)).toBe(true);
		expect(inRanges(10, r)).toBe(true);
		expect(inRanges(15, r)).toBe(false);
		expect(inRanges(25, r)).toBe(true);
		expect(inRanges(31, r)).toBe(false);
		expect(inRanges(0, ranges())).toBe(false);
	});
});

describe("canSeekInPlace", () => {
	it("refuses a seek past the buffer on the live stream (was: seeking always jumped back to the start of the song)", () => {
		expect(
			canSeekInPlace({ src: PROGRESSIVE, target: 120, seekable: ranges([0, 200]), buffered: ranges([0, 40]) })
		).toBe(false);
	});

	it("refuses any seek on the live stream when the browser reports nothing seekable", () => {
		expect(
			canSeekInPlace({ src: PROGRESSIVE, target: 5, seekable: ranges(), buffered: ranges([0, 40]) })
		).toBe(false);
	});

	it("allows a seek inside what the live stream already buffered", () => {
		expect(
			canSeekInPlace({ src: PROGRESSIVE, target: 30, seekable: ranges([0, 40]), buffered: ranges([0, 40]) })
		).toBe(true);
	});

	it("always allows range-capable sources", () => {
		expect(canSeekInPlace({ src: PRESIGNED, target: 120, seekable: ranges(), buffered: ranges() })).toBe(true);
	});
});

describe("waitForSeekableUrl", () => {
	function clock() {
		let t = 0;
		return {
			now: () => t,
			sleep: vi.fn(async (ms: number) => {
				t += ms;
			}),
		};
	}

	it("polls until the persisted URL shows up", async () => {
		const c = clock();
		const resolve = vi
			.fn<() => Promise<string | null>>()
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(PRESIGNED);
		const url = await waitForSeekableUrl({ resolve, isCancelled: () => false, intervalMs: 1000, ...c });
		expect(url).toBe(PRESIGNED);
		expect(resolve).toHaveBeenCalledTimes(3);
		expect(c.sleep).toHaveBeenCalledTimes(2);
	});

	it("gives up after the timeout", async () => {
		const c = clock();
		const resolve = vi.fn(async () => null);
		const url = await waitForSeekableUrl({ resolve, isCancelled: () => false, intervalMs: 1000, timeoutMs: 3000, ...c });
		expect(url).toBeNull();
		expect(resolve).toHaveBeenCalledTimes(4);
	});

	it("treats a failing lookup as not ready yet", async () => {
		const c = clock();
		const resolve = vi
			.fn<() => Promise<string | null>>()
			.mockRejectedValueOnce(new Error("network"))
			.mockResolvedValueOnce(PRESIGNED);
		expect(await waitForSeekableUrl({ resolve, isCancelled: () => false, ...c })).toBe(PRESIGNED);
	});

	it("stops as soon as it is cancelled, even with a URL in flight", async () => {
		const c = clock();
		let cancelled = false;
		const resolve = vi.fn(async () => {
			cancelled = true;
			return PRESIGNED;
		});
		expect(await waitForSeekableUrl({ resolve, isCancelled: () => cancelled, ...c })).toBeNull();
		expect(await waitForSeekableUrl({ resolve, isCancelled: () => true, ...c })).toBeNull();
		expect(resolve).toHaveBeenCalledTimes(1);
	});

	it("defaults to real timers", async () => {
		vi.useFakeTimers();
		try {
			const resolve = vi
				.fn<() => Promise<string | null>>()
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(PRESIGNED);
			const p = waitForSeekableUrl({ resolve, isCancelled: () => false });
			await vi.advanceTimersByTimeAsync(1000);
			expect(await p).toBe(PRESIGNED);
		} finally {
			vi.useRealTimers();
		}
	});
});
