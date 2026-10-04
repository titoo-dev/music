import { describe, it, expect, vi } from "vitest";
import { waitForSeekableUrl } from "@/lib/seek";
import {
	EXPIRY_MARGIN_MS,
	FALLBACK_TTL_MS,
	createPresignedUrls,
	progressiveUrl,
	proxyUrl,
	resolveCachedSource,
	usableUntilOf,
} from "./presigned-urls";

const T0 = Date.parse("2026-10-04T10:00:00Z");

function ok(data: unknown) {
	return new Response(JSON.stringify({ success: true, data }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

function setup(responses: Array<Response | (() => Response) | Error>) {
	let t = T0;
	const queue = [...responses];
	const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
		void input;
		void init;
		const next = queue.shift();
		if (!next) throw new Error("unexpected fetch");
		if (next instanceof Error) throw next;
		return typeof next === "function" ? next() : next;
	});
	const urls = createPresignedUrls({ fetchImpl: fetchImpl as unknown as typeof fetch, now: () => t });
	return { urls, fetchImpl, advance: (ms: number) => (t += ms) };
}

describe("usableUntilOf", () => {
	it("keeps a minute of margin before the server's expiresAt (C1)", () => {
		expect(usableUntilOf("2026-10-04T11:00:00Z", T0)).toBe(T0 + 3600_000 - EXPIRY_MARGIN_MS);
	});

	it("falls back to 14 minutes when the server sends no expiresAt (pre-C1)", () => {
		expect(usableUntilOf(undefined, T0)).toBe(T0 + FALLBACK_TTL_MS);
		expect(usableUntilOf("not a date", T0)).toBe(T0 + FALLBACK_TTL_MS);
	});
});

describe("createPresignedUrls", () => {
	it("signs once and reuses the URL until shortly before its expiresAt", async () => {
		const { urls, fetchImpl, advance } = setup([
			ok({ url: "https://r2/a?sig=1", expiresAt: new Date(T0 + 3600_000).toISOString() }),
			ok({ url: "https://r2/a?sig=2", expiresAt: new Date(T0 + 7200_000).toISOString() }),
		]);
		expect(await urls.get("a")).toBe("https://r2/a?sig=1");
		advance(50 * 60_000);
		expect(await urls.get("a")).toBe("https://r2/a?sig=1");
		expect(fetchImpl).toHaveBeenCalledTimes(1);
		expect(fetchImpl.mock.calls[0][0]).toBe("/api/v1/stream-url/a");
		advance(10 * 60_000);
		expect(await urls.get("a")).toBe("https://r2/a?sig=2");
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it("shares one request between concurrent callers", async () => {
		const { urls, fetchImpl } = setup([ok({ url: "https://r2/a" })]);
		const [x, y] = await Promise.all([urls.get("a"), urls.lookup("a")]);
		expect(x).toBe("https://r2/a");
		expect(y.url).toBe("https://r2/a");
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it("reports why there is no URL, without caching the miss", async () => {
		const { urls, fetchImpl } = setup([ok({ url: null, status: "not_cached" }), ok({ url: "https://r2/a" })]);
		expect(await urls.lookup("a")).toEqual({ url: null, status: "not_cached" });
		expect(await urls.get("a")).toBe("https://r2/a");
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it("treats HTTP and network failures as an 'error' lookup", async () => {
		const { urls } = setup([new Response("{}", { status: 500 }), new TypeError("offline")]);
		expect(await urls.lookup("a")).toEqual({ url: null, status: "error" });
		expect(await urls.lookup("a")).toEqual({ url: null, status: "error" });
	});

	it("refuses presigned per track, not for the session (was: one failure disabled presigned URLs until reload)", async () => {
		const { urls } = setup([ok({ url: "https://r2/a" }), ok({ url: "https://r2/b" })]);
		await urls.get("a");
		urls.deny("a");
		expect(urls.isDenied("a")).toBe(true);
		expect(await urls.get("a")).toBeNull();
		expect(urls.peek("a")).toBeNull();
		expect(await urls.get("b")).toBe("https://r2/b");
	});

	it("knows when a URL it handed out expired, even after it left the cache (was: a 403 after a long pause)", async () => {
		const { urls, advance } = setup([
			ok({ url: "https://r2/a?1", expiresAt: new Date(T0 + 3600_000).toISOString() }),
			ok({ url: "https://r2/b" }),
		]);
		await urls.get("a");
		expect(urls.isExpired("https://r2/a?1")).toBe(false);
		expect(urls.usableUntil("https://r2/a?1")).toBe(T0 + 3600_000 - EXPIRY_MARGIN_MS);
		advance(3600_000);
		await urls.get("b"); // prunes the expired track entry
		expect(urls.peek("a")).toBeNull();
		expect(urls.isExpired("https://r2/a?1")).toBe(true);
		expect(urls.isExpired("https://elsewhere/x")).toBe(true);
		expect(urls.usableUntil("https://elsewhere/x")).toBeNull();
	});

	it("invalidate() forces a fresh signature; lookup({force}) bypasses the cache", async () => {
		const { urls, fetchImpl } = setup([ok({ url: "https://r2/1" }), ok({ url: "https://r2/2" }), ok({ url: "https://r2/3" })]);
		await urls.get("a");
		urls.invalidate("a");
		expect(await urls.get("a")).toBe("https://r2/2");
		expect((await urls.lookup("a", { force: true })).url).toBe("https://r2/3");
		expect(fetchImpl).toHaveBeenCalledTimes(3);
	});

	it("warm() signs upcoming tracks once, skipping cached, in-flight and denied ones", async () => {
		const { urls, fetchImpl } = setup([ok({ url: "https://r2/a" }), ok({ url: "https://r2/b" })]);
		urls.deny("c");
		urls.warm(["a", "b", "a", "c"]);
		await Promise.resolve();
		urls.warm(["a"]);
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		await new Promise((r) => setTimeout(r, 0));
		expect(urls.peek("a")).toBe("https://r2/a");
	});

	it("reset() forgets everything, including lookups still in flight (logout)", async () => {
		let release!: () => void;
		const gate = new Promise<void>((r) => (release = r));
		const { urls } = setup([ok({ url: "https://r2/a" })]);
		await urls.get("a");
		urls.deny("b");
		const fetchImpl = vi.fn(async () => {
			await gate;
			return ok({ url: "https://r2/late" });
		});
		const u2 = createPresignedUrls({ fetchImpl: fetchImpl as unknown as typeof fetch });
		const pending = u2.get("x");
		u2.reset();
		release();
		expect(await pending).toBe("https://r2/late");
		expect(u2.peek("x")).toBeNull();

		urls.reset();
		expect(urls.peek("a")).toBeNull();
		expect(urls.isDenied("b")).toBe(false);
	});
});

describe("URL builders", () => {
	it("builds the proxy, persisting and preview stream URLs", () => {
		expect(proxyUrl("12")).toBe("/api/v1/stream/12");
		expect(progressiveUrl("12")).toBe("/api/v1/stream-progressive/12");
		expect(progressiveUrl("12", { preview: true })).toBe("/api/v1/stream-progressive/12?preview=1");
		expect(progressiveUrl("12", { preview: true, head: true })).toBe(
			"/api/v1/stream-progressive/12?preview=1&head=1"
		);
	});
});

describe("resolveCachedSource", () => {
	it("returns the presigned URL of a cached track", async () => {
		const { urls } = setup([ok({ url: "https://r2/a" })]);
		expect(await resolveCachedSource("a", { urls })).toEqual({ url: "https://r2/a", kind: "presigned" });
	});

	it("returns null for a track the server doesn't hold, without touching the persisting stream (was: prefetch made the server download + upload the track)", async () => {
		for (const status of ["not_cached", "file_missing", "unsupported_storage"]) {
			const { urls } = setup([ok({ url: null, status })]);
			const fetchImpl = vi.fn();
			expect(await resolveCachedSource("a", { urls, fetchImpl })).toBeNull();
			expect(fetchImpl).not.toHaveBeenCalled();
		}
	});

	it("asks the proxy with ?prefetch=1 and a manual redirect when presigned URLs are disabled", async () => {
		const { urls } = setup([ok({ url: null, status: "presigned_disabled" })]);
		const cancel = vi.fn().mockResolvedValue(undefined);
		const fetchImpl = vi.fn(async () => ({ status: 206, body: { cancel } }) as unknown as Response);
		expect(await resolveCachedSource("a", { urls, fetchImpl })).toEqual({ url: "/api/v1/stream/a", kind: "proxy" });
		expect(fetchImpl).toHaveBeenCalledWith(
			"/api/v1/stream/a?prefetch=1",
			expect.objectContaining({ redirect: "manual", credentials: "include", headers: { Range: "bytes=0-0" } })
		);
		expect(cancel).toHaveBeenCalled();
	});

	it("treats the proxy's 404 NOT_CACHED (C5) and a legacy redirect as not cached", async () => {
		for (const status of [404, 0]) {
			const { urls } = setup([ok({ url: null, status: "presigned_disabled" })]);
			const fetchImpl = vi.fn(async () => ({ status, body: null }) as unknown as Response);
			expect(await resolveCachedSource("a", { urls, fetchImpl })).toBeNull();
		}
		const { urls } = setup([ok({ url: null, status: "presigned_disabled" })]);
		expect(await resolveCachedSource("a", { urls, fetchImpl: vi.fn().mockRejectedValue(new TypeError("x")) })).toBeNull();
	});

	it("uses the proxy for a track whose presigned URL was refused", async () => {
		const { urls } = setup([ok({ url: "https://r2/a" })]);
		urls.deny("a");
		const fetchImpl = vi.fn(async () => ({ status: 200, body: null }) as unknown as Response);
		expect(await resolveCachedSource("a", { urls, fetchImpl })).toEqual({ url: "/api/v1/stream/a", kind: "proxy" });
	});

	it("gives up when aborted", async () => {
		const { urls } = setup([ok({ url: "https://r2/a" })]);
		const ctl = new AbortController();
		ctl.abort();
		expect(await resolveCachedSource("a", { urls, signal: ctl.signal })).toBeNull();
	});

	it("lets a seek waiting on the live stream resume on the proxy as soon as the file is stored, with presigned URLs disabled (was: waited 60 s, then restarted at 0)", async () => {
		const { urls } = setup([
			ok({ url: null, status: "presigned_disabled" }),
			ok({ url: null, status: "presigned_disabled" }),
		]);
		const proxy = vi
			.fn()
			.mockResolvedValueOnce({ status: 404, body: null })
			.mockResolvedValueOnce({ status: 206, body: null });
		let t = 0;
		const url = await waitForSeekableUrl({
			resolve: () => resolveCachedSource("a", { urls, fetchImpl: proxy }).then((s) => s?.url ?? null),
			isCancelled: () => false,
			sleep: async (ms) => void (t += ms),
			now: () => t,
		});
		expect(url).toBe("/api/v1/stream/a");
		expect(t).toBe(1000);
	});
});
