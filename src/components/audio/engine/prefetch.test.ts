import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/audio-cache", () => ({
	getCachedBlobUrl: vi.fn(async () => null),
	prefetchTrack: vi.fn(async () => false),
}));

import { getCachedBlobUrl, prefetchTrack } from "@/lib/audio-cache";
import { presignedUrls } from "./presigned-urls";
import {
	cacheListenedTrack,
	cachedSourceResolver,
	disposePrefetchPools,
	persistInBackground,
	preloadTrack,
	queuePreloaded,
	smartPrefetchQueue,
	takePreloaded,
	warmTrack,
} from "./prefetch";

const flush = () => new Promise((r) => setTimeout(r, 0));

function setConnection(value: unknown) {
	Object.defineProperty(navigator, "connection", { value, configurable: true });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
	vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
	fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
	vi.stubGlobal("fetch", fetchMock);
	vi.mocked(getCachedBlobUrl).mockResolvedValue(null);
	vi.mocked(prefetchTrack).mockResolvedValue(false);
	presignedUrls.reset();
});

afterEach(() => {
	disposePrefetchPools();
	setConnection(undefined);
	vi.unstubAllGlobals();
});

describe("preloadTrack", () => {
	it("doesn't preload an uncached track at all (was: every queue preload opened the persisting stream — a full server download + upload)", async () => {
		vi.spyOn(presignedUrls, "get").mockResolvedValue(null);
		preloadTrack("u1");
		await flush();
		expect(queuePreloaded("u1")).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("preloads a cached track from its presigned URL", async () => {
		vi.spyOn(presignedUrls, "get").mockResolvedValue("https://r2.example/c1?sig=1");
		preloadTrack("c1");
		await flush();
		expect(queuePreloaded("c1")?.src).toBe("https://r2.example/c1?sig=1");
	});

	it("prefers the IndexedDB copy", async () => {
		vi.mocked(getCachedBlobUrl).mockResolvedValue("blob:http://localhost/abc");
		preloadTrack("b1");
		await flush();
		expect(queuePreloaded("b1")?.src).toBe("blob:http://localhost/abc");
	});

	it("buffers an uncached next track only when asked live, through the non-persisting preview stream", async () => {
		vi.spyOn(presignedUrls, "get").mockResolvedValue(null);
		preloadTrack("l1", { live: true });
		await flush();
		expect(queuePreloaded("l1")?.src).toMatch(/\/api\/v1\/stream-progressive\/l1\?preview=1$/);
	});

	it("doesn't ask again right away for a track found uncached", async () => {
		const get = vi.spyOn(presignedUrls, "get").mockResolvedValue(null);
		preloadTrack("m1");
		await flush();
		preloadTrack("m1");
		await flush();
		expect(get).toHaveBeenCalledTimes(1);
	});

	it("does nothing on Save-Data", async () => {
		setConnection({ saveData: true });
		const get = vi.spyOn(presignedUrls, "get").mockResolvedValue("https://r2.example/s?sig=1");
		preloadTrack("s1");
		await flush();
		expect(get).not.toHaveBeenCalled();
		expect(queuePreloaded("s1")).toBeNull();
	});
});

describe("takePreloaded", () => {
	it("hands out the richest element and stops the others for the same track", async () => {
		vi.spyOn(presignedUrls, "get").mockResolvedValue("https://r2.example/t?sig=1");
		preloadTrack("t1");
		warmTrack("t1", { audio: "full" });
		await flush();
		const queued = queuePreloaded("t1");
		const taken = takePreloaded("t1");
		expect(taken?.audio).toBe(queued);
		expect(taken?.head).toBe(false);
		expect(takePreloaded("t1")).toBeNull();
	});

	it("flags a head preview so the engine hands off to the full stream", async () => {
		vi.spyOn(presignedUrls, "get").mockResolvedValue(null);
		warmTrack("h1", { audio: "head" });
		await flush();
		const taken = takePreloaded("h1");
		expect(taken?.head).toBe(true);
		expect(taken?.audio.src).toMatch(/stream-progressive\/h1\?preview=1&head=1$/);
	});
});

describe("smartPrefetchQueue", () => {
	const queue = ["a", "b", "c", "d"].map((trackId) => ({ trackId }));

	it("fills IndexedDB through the cached-only resolver, abortably", async () => {
		smartPrefetchQueue(queue, 0);
		await flush();
		expect(prefetchTrack).toHaveBeenCalledWith(
			"b",
			expect.objectContaining({ resolveSource: cachedSourceResolver, signal: expect.any(AbortSignal) })
		);
	});

	it("cancels the previous batch on the next track change", async () => {
		smartPrefetchQueue(queue, 0);
		await flush();
		const first = vi.mocked(prefetchTrack).mock.calls[0][1]!.signal!;
		smartPrefetchQueue(queue, 1);
		expect(first.aborted).toBe(true);
	});

	it("does nothing on a 2G link", async () => {
		setConnection({ effectiveType: "2g" });
		smartPrefetchQueue(queue, 0);
		await flush();
		expect(prefetchTrack).not.toHaveBeenCalled();
	});
});

describe("cacheListenedTrack", () => {
	it("only reads the presigned R2 copy (was: the whole file went through the /api/v1/stream proxy a second time)", async () => {
		await cacheListenedTrack("p1");
		const resolve = vi.mocked(prefetchTrack).mock.calls[0][1]!.resolveSource!;
		vi.spyOn(presignedUrls, "get").mockResolvedValueOnce(null);
		expect(await resolve("p1")).toBeNull();
		vi.spyOn(presignedUrls, "get").mockResolvedValueOnce("https://r2.example/p1?sig=1");
		expect(await resolve("p1")).toEqual({ url: "https://r2.example/p1?sig=1", kind: "presigned" });
	});

	it("is skipped on Save-Data", async () => {
		setConnection({ saveData: true });
		expect(await cacheListenedTrack("p2")).toBe(false);
		expect(prefetchTrack).not.toHaveBeenCalled();
	});
});

describe("persistInBackground", () => {
	it("opens the persisting stream of the playing track and hangs up", async () => {
		const cancel = vi.fn(async () => {});
		fetchMock.mockResolvedValueOnce({ body: { cancel } });
		persistInBackground("x1");
		await flush();
		expect(fetchMock).toHaveBeenCalledWith("/api/v1/stream-progressive/x1", expect.objectContaining({ credentials: "include" }));
		expect(cancel).toHaveBeenCalled();
	});
});
