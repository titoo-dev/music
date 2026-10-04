// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import vm from "vm";

// public/sw.js is a classic worker script: run it in a sandbox with a fake
// `self` and reach its top-level functions through the sandbox globals.
function loadWorker(overrides: Record<string, unknown> = {}) {
	const code = readFileSync(path.resolve(__dirname, "../../public/sw.js"), "utf8");
	const listeners: Record<string, (e: unknown) => void> = {};
	const sandbox: Record<string, unknown> = {
		self: {
			addEventListener: (type: string, fn: (e: unknown) => void) => (listeners[type] = fn),
			location: { origin: "https://app.test" },
			skipWaiting: () => {},
			clients: { claim: () => {} },
		},
		indexedDB: { open: vi.fn(() => ({})) },
		caches: { open: vi.fn(), keys: vi.fn(async () => []), match: vi.fn() },
		fetch: vi.fn(),
		Response,
		Blob,
		URL,
		Map,
		console,
		...overrides,
	};
	vm.createContext(sandbox);
	vm.runInContext(code, sandbox);
	return { sw: sandbox as Record<string, (...args: never[]) => unknown> & Record<string, unknown>, listeners };
}

type Range = { start: number; end: number } | "unsatisfiable" | null;

describe("service worker byte ranges", () => {
	const { sw } = loadWorker();
	const parse = (h: string, total: number) => (sw.parseByteRange as (h: string, t: number) => Range)(h, total);

	it("clamps an end past the file to its last byte (was: Content-Length larger than the body)", () => {
		expect(parse("bytes=0-999999", 100)).toEqual({ start: 0, end: 99 });
		expect(parse("bytes=10-", 100)).toEqual({ start: 10, end: 99 });
		expect(parse("bytes=10-19", 100)).toEqual({ start: 10, end: 19 });
	});

	it("answers a start past the end as unsatisfiable (was: a negative Content-Length)", () => {
		expect(parse("bytes=100-", 100)).toBe("unsatisfiable");
		expect(parse("bytes=500-600", 100)).toBe("unsatisfiable");
	});

	it("supports suffix ranges and ignores what it doesn't understand", () => {
		expect(parse("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
		expect(parse("bytes=-500", 100)).toEqual({ start: 0, end: 99 });
		expect(parse("bytes=0-1,5-6", 100)).toBeNull();
		expect(parse("items=0-1", 100)).toBeNull();
		expect(parse("bytes=20-10", 100)).toBeNull();
	});

	it("serves 206 with a matching body, and 416 with Content-Range bytes */total", async () => {
		const handle = sw.handleRangeFromBlob as (b: Blob, t: string, h: string) => Response;
		const blob = new Blob([new Uint8Array(100)]);
		const partial = handle(blob, "audio/mpeg", "bytes=90-1000");
		expect(partial.status).toBe(206);
		expect(partial.headers.get("Content-Range")).toBe("bytes 90-99/100");
		expect(partial.headers.get("Content-Length")).toBe("10");
		expect((await partial.arrayBuffer()).byteLength).toBe(10);

		const refused = handle(blob, "audio/mpeg", "bytes=100-");
		expect(refused.status).toBe(416);
		expect(refused.headers.get("Content-Range")).toBe("bytes */100");
	});
});

describe("service worker audio requests", () => {
	it("passes a network response through without writing it to IndexedDB (was: every full response cached, never evicted)", async () => {
		const network = new Response(new Uint8Array(10), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
		const fetchMock = vi.fn(async () => network);
		const { sw } = loadWorker({ fetch: fetchMock });
		const open = (sw.indexedDB as unknown as { open: ReturnType<typeof vi.fn> }).open;
		sw.getCachedAudio = (async () => null) as never;

		const res = await (sw.handleAudioRequest as (r: Request, id: string) => Promise<Response>)(
			new Request("https://app.test/api/v1/stream/42"),
			"42"
		);
		expect(res).toBe(network);
		await new Promise((r) => setTimeout(r, 10));
		expect(open).not.toHaveBeenCalled();
		expect(sw.cacheAudio).toBeUndefined();
	});

	it("serves a cached copy, honouring the Range header", async () => {
		const { sw } = loadWorker();
		sw.getCachedAudio = (async () => ({ blob: new Blob([new Uint8Array(50)]), contentType: "audio/flac" })) as never;
		const res = await (sw.handleAudioRequest as (r: Request, id: string) => Promise<Response>)(
			new Request("https://app.test/api/v1/stream/42", { headers: { Range: "bytes=40-" } }),
			"42"
		);
		expect(res.status).toBe(206);
		expect(res.headers.get("Content-Range")).toBe("bytes 40-49/50");
		expect(res.headers.get("Content-Type")).toBe("audio/flac");
	});
});
