// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import http from "http";
import type { AddressInfo } from "net";
import { TtlLru, cachedMetadata, clearMetadataCache, fetchCoverImage } from "./metadata-cache";

describe("TtlLru", () => {
	it("expires entries after the TTL and evicts the least recently used", () => {
		vi.useFakeTimers();
		try {
			const lru = new TtlLru<number>(2, 1000);
			lru.set("a", 1);
			lru.set("b", 2);
			expect(lru.get("a")).toBe(1); // a is now the most recent
			lru.set("c", 3); // evicts b
			expect(lru.get("b")).toBeUndefined();
			expect(lru.size).toBe(2);
			vi.advanceTimersByTime(1001);
			expect(lru.get("a")).toBeUndefined();
			lru.set("d", 4);
			lru.delete("d");
			expect(lru.get("d")).toBeUndefined();
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("cachedMetadata", () => {
	beforeEach(() => clearMetadataCache());

	it("loads once per key, shares in-flight lookups and returns copies", async () => {
		const load = vi.fn(async () => ({ list: [1] }));
		const [a, b] = await Promise.all([cachedMetadata("k", load), cachedMetadata("k", load)]);
		a.list.push(2);
		const c = await cachedMetadata("k", load);
		expect(load).toHaveBeenCalledTimes(1);
		expect(b.list).toEqual([1]);
		expect(c.list).toEqual([1]);
	});

	it("does not cache failures", async () => {
		const load = vi.fn().mockRejectedValueOnce(new Error("blip")).mockResolvedValueOnce("ok");
		await expect(cachedMetadata("k", load)).rejects.toThrow("blip");
		await expect(cachedMetadata("k", load)).resolves.toBe("ok");
		expect(load).toHaveBeenCalledTimes(2);
	});
});

describe("fetchCoverImage", () => {
	let server: http.Server;
	let base = "";
	let hits = 0;

	beforeAll(async () => {
		server = http.createServer((req, res) => {
			hits++;
			if (req.url === "/cover.jpg") {
				res.writeHead(200, { "content-type": "image/jpeg" });
				res.end(Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]));
			} else if (req.url === "/empty.jpg") {
				res.writeHead(200);
				res.end();
			} else {
				res.writeHead(404);
				res.end();
			}
		});
		await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
		base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	});

	afterAll(() => new Promise<void>((r) => server.close(() => r())));
	beforeEach(() => {
		clearMetadataCache();
		hits = 0;
	});

	it("keeps the cover in memory instead of /tmp (was: /tmp/wavelet-imgs covers were never cleaned)", async () => {
		const first = await fetchCoverImage(`${base}/cover.jpg`);
		const second = await fetchCoverImage(`${base}/cover.jpg`);
		expect([...first!]).toEqual([0xff, 0xd8, 0xff, 1, 2, 3]);
		expect(second).toBe(first);
		expect(hits).toBe(1);
	});

	it("returns null on a missing or empty cover", async () => {
		expect(await fetchCoverImage(`${base}/missing.jpg`)).toBeNull();
		expect(await fetchCoverImage(`${base}/empty.jpg`)).toBeNull();
	});
});
