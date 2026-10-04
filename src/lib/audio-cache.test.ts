import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchCachedCopy, prefetchTrack, prefetchTracks, type CachedSource } from "./audio-cache";

afterEach(() => {
	vi.unstubAllGlobals();
});

function audio(bytes: number, headers: Record<string, string> = {}, status = 200) {
	return new Response(new Uint8Array(bytes), {
		status,
		headers: { "Content-Type": "audio/mpeg", "Content-Length": String(bytes), ...headers },
	});
}

const PRESIGNED: CachedSource = { url: "https://r2.example/tracks/1/3.mp3?X-Amz-Signature=x", kind: "presigned" };
const PROXY: CachedSource = { url: "/api/v1/stream/1", kind: "proxy" };

describe("fetchCachedCopy", () => {
	it("reads a presigned copy straight from R2, without cookies", async () => {
		const fetchImpl = vi.fn(async () => audio(10));
		const copy = await fetchCachedCopy(PRESIGNED, { fetchImpl });
		expect(copy?.blob.size).toBe(10);
		expect(copy?.contentType).toBe("audio/mpeg");
		expect(fetchImpl).toHaveBeenCalledWith(PRESIGNED.url, expect.objectContaining({ credentials: "omit", mode: "cors" }));
	});

	it("asks the proxy with ?prefetch=1 and never follows its redirect (was: the 302 opened the persisting stream)", async () => {
		const fetchImpl = vi.fn(async () => audio(4));
		await fetchCachedCopy(PROXY, { fetchImpl });
		expect(fetchImpl).toHaveBeenCalledWith(
			"/api/v1/stream/1?prefetch=1",
			expect.objectContaining({ credentials: "include", redirect: "manual" })
		);
	});

	it("caches nothing when the proxy says NOT_CACHED (C5) or redirects", async () => {
		const notCached = new Response(JSON.stringify({ success: false, error: { code: "NOT_CACHED" } }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
		expect(await fetchCachedCopy(PROXY, { fetchImpl: vi.fn(async () => notCached) })).toBeNull();
		const redirect = { status: 0, headers: new Headers(), body: null } as unknown as Response;
		expect(await fetchCachedCopy(PROXY, { fetchImpl: vi.fn(async () => redirect) })).toBeNull();
	});

	it("drops a body shorter than its Content-Length (was: truncated files were cached and replayed)", async () => {
		const short = new Response(new Uint8Array(6), {
			headers: { "Content-Type": "audio/flac", "Content-Length": "10" },
		});
		expect(await fetchCachedCopy(PRESIGNED, { fetchImpl: vi.fn(async () => short) })).toBeNull();
	});

	it("refuses an empty body or a JSON / HTML answer served with 200", async () => {
		expect(await fetchCachedCopy(PRESIGNED, { fetchImpl: vi.fn(async () => audio(0)) })).toBeNull();
		const html = new Response("<html></html>", { headers: { "Content-Type": "text/html" } });
		expect(await fetchCachedCopy(PRESIGNED, { fetchImpl: vi.fn(async () => html) })).toBeNull();
	});

	it("passes the abort signal to fetch, so a prefetch stops mid-download (was: res.blob() could not be cancelled)", async () => {
		const ctl = new AbortController();
		const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
			expect(init?.signal).toBe(ctl.signal);
			return audio(1);
		});
		await fetchCachedCopy(PRESIGNED, { fetchImpl, signal: ctl.signal });
		expect(fetchImpl).toHaveBeenCalledOnce();
	});
});

describe("prefetchTrack", () => {
	it("never fetches without a cached-source resolver (was: GET /api/v1/stream → 302 → the server downloaded and stored the track)", async () => {
		const fetchMock = vi.fn(async () => audio(1));
		vi.stubGlobal("fetch", fetchMock);
		expect(await prefetchTrack("1")).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("skips a track the server doesn't hold", async () => {
		const fetchImpl = vi.fn(async () => audio(1));
		const resolveSource = vi.fn(async () => null);
		expect(await prefetchTrack("2", { resolveSource, fetchImpl })).toBe(false);
		expect(resolveSource).toHaveBeenCalledWith("2", undefined);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("downloads the cached copy the resolver points at", async () => {
		const fetchImpl = vi.fn(async () => audio(3));
		expect(await prefetchTrack("3", { resolveSource: async () => PRESIGNED, fetchImpl })).toBe(true);
		expect(fetchImpl).toHaveBeenCalledWith(PRESIGNED.url, expect.anything());
	});

	it("does nothing once aborted", async () => {
		const ctl = new AbortController();
		ctl.abort();
		const resolveSource = vi.fn(async () => PRESIGNED);
		expect(await prefetchTrack("4", { resolveSource, signal: ctl.signal })).toBe(false);
		expect(resolveSource).not.toHaveBeenCalled();
	});

	it("reports a failed download as not cached", async () => {
		const fetchImpl = vi.fn(async () => {
			throw new TypeError("network");
		});
		expect(await prefetchTrack("5", { resolveSource: async () => PRESIGNED, fetchImpl })).toBe(false);
	});
});

describe("prefetchTracks", () => {
	it("stops picking up tracks once aborted (was: a page left kept downloading its playlist)", async () => {
		const ctl = new AbortController();
		const seen: string[] = [];
		const resolveSource = vi.fn(async (id: string) => {
			seen.push(id);
			if (id === "b") ctl.abort();
			return null;
		});
		await prefetchTracks(["a", "b", "c", "d"], 1, { resolveSource, signal: ctl.signal });
		expect(seen).toEqual(["a", "b"]);
	});
});
