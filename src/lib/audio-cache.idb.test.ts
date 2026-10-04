import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { planEviction } from "./audio-cache";

// ---------------------------------------------------------------------------
// A small in-memory IndexedDB: enough of the API for audio-cache.ts, strict
// where it matters here — writes in a readonly transaction throw, requests on
// a finished transaction throw, and every transaction / getAll is logged.
// ---------------------------------------------------------------------------

type Rec = Record<string, unknown>;

class FakeRequest {
	result: unknown = undefined;
	error: unknown = null;
	onsuccess: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onupgradeneeded: (() => void) | null = null;
}

class FakeStoreData {
	rows = new Map<string, Rec>();
	indexes = new Map<string, string>();
	constructor(public keyPath: string) {}
}

class FakeTx {
	pending = 0;
	finished = false;
	error: unknown = null;
	oncomplete: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onabort: (() => void) | null = null;
	constructor(
		public db: FakeDB,
		public names: string[],
		public mode: string
	) {
		this.maybeComplete();
	}
	objectStore(name: string) {
		if (!this.names.includes(name)) throw new DOMException(name, "NotFoundError");
		return new FakeStore(this, name, this.db.stores.get(name)!);
	}
	guard(write: boolean) {
		if (this.finished) throw new DOMException("finished", "TransactionInactiveError");
		if (write && this.mode === "readonly") throw new DOMException("readonly", "ReadOnlyError");
	}
	request(op: () => unknown, write = false) {
		this.guard(write);
		const req = new FakeRequest();
		this.pending++;
		setTimeout(() => {
			req.result = op();
			req.onsuccess?.();
			this.pending--;
			this.maybeComplete();
		});
		return req;
	}
	cursor(entries: { key: unknown; primaryKey: string }[]) {
		this.guard(false);
		const req = new FakeRequest();
		let i = 0;
		this.pending++;
		const step = () =>
			setTimeout(() => {
				const e = entries[i++];
				let continued = false;
				req.result = e ? { ...e, continue: () => ((continued = true), step()) } : null;
				req.onsuccess?.();
				if (!e || !continued) {
					this.pending--;
					this.maybeComplete();
				}
			});
		step();
		return req;
	}
	maybeComplete() {
		setTimeout(() => {
			if (this.pending === 0 && !this.finished) {
				this.finished = true;
				this.oncomplete?.();
			}
		});
	}
}

class FakeStore {
	constructor(
		private tx: FakeTx,
		private name: string,
		private data: FakeStoreData
	) {}
	get(key: string) {
		return this.tx.request(() => this.data.rows.get(key));
	}
	count(key: string) {
		return this.tx.request(() => (this.data.rows.has(key) ? 1 : 0));
	}
	getAll() {
		this.tx.db.getAllCalls.push(this.name);
		return this.tx.request(() => [...this.data.rows.values()]);
	}
	put(value: Rec) {
		this.tx.db.puts.push(this.name);
		return this.tx.request(() => this.data.rows.set(String(value[this.data.keyPath]), { ...value }), true);
	}
	delete(key: string) {
		return this.tx.request(() => this.data.rows.delete(key), true);
	}
	clear() {
		return this.tx.request(() => this.data.rows.clear(), true);
	}
	createIndex(name: string, keyPath: string) {
		this.data.indexes.set(name, keyPath);
	}
	index(name: string) {
		const keyPath = this.data.indexes.get(name)!;
		return {
			openKeyCursor: () =>
				this.tx.cursor(
					[...this.data.rows.entries()]
						.map(([pk, row]) => ({ key: row[keyPath] as number, primaryKey: pk }))
						.sort((a, b) => a.key - b.key)
				),
		};
	}
}

class FakeDB {
	stores = new Map<string, FakeStoreData>();
	txLog: { names: string[]; mode: string }[] = [];
	getAllCalls: string[] = [];
	puts: string[] = [];
	upgrading: FakeTx | null = null;
	objectStoreNames = { contains: (n: string) => this.stores.has(n) };
	createObjectStore(name: string, opts: { keyPath: string }) {
		const data = new FakeStoreData(opts.keyPath);
		this.stores.set(name, data);
		return new FakeStore(this.upgrading!, name, data);
	}
	transaction(names: string | string[], mode = "readonly") {
		const list = Array.isArray(names) ? names : [names];
		this.txLog.push({ names: list, mode });
		return new FakeTx(this, list, mode);
	}
}

class FakeIDBFactory {
	db = new FakeDB();
	open() {
		const req = new FakeRequest();
		setTimeout(() => {
			req.result = this.db;
			this.db.upgrading = new FakeTx(this.db, [], "versionchange");
			req.onupgradeneeded?.();
			req.onsuccess?.();
		});
		return req;
	}
}

// ---------------------------------------------------------------------------

let now = 1_000_000;
let idb: FakeIDBFactory;

async function load() {
	vi.resetModules();
	idb = new FakeIDBFactory();
	vi.stubGlobal("indexedDB", idb);
	return import("./audio-cache");
}

const blob = (n: number) => new Blob([new Uint8Array(n)], { type: "audio/mpeg" });

beforeEach(() => {
	now = 1_000_000;
	vi.spyOn(Date, "now").mockImplementation(() => now);
	let n = 0;
	URL.createObjectURL = vi.fn(() => `blob:fake/${++n}`);
	URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("planEviction", () => {
	const e = (trackId: string, size: number, lastAccessed: number) => ({ trackId, size, lastAccessed });

	it("drops the least recently used tracks until the new one fits", () => {
		expect(planEviction([e("a", 10, 3), e("b", 10, 1), e("c", 10, 2)], { trackId: "d", size: 15 }, 30)).toEqual([
			"b",
			"c",
		]);
	});

	it("evicts nothing when there is room, and never the track being replaced", () => {
		expect(planEviction([e("a", 10, 1)], { trackId: "b", size: 10 }, 30)).toEqual([]);
		expect(planEviction([e("a", 25, 1), e("b", 5, 2)], { trackId: "a", size: 25 }, 30)).toEqual([]);
	});

	it("refuses a file bigger than the whole cache", () => {
		expect(planEviction([e("a", 1, 1)], { trackId: "b", size: 31 }, 30)).toBeNull();
	});
});

describe("IndexedDB audio cache", () => {
	it("reads a cached track in a readonly transaction and never rewrites its audio record (was: every play put the whole blob back)", async () => {
		const cache = await load();
		await cache.cacheTrack("a", blob(10));
		const putsAfterWrite = idb.db.puts.filter((s) => s === "tracks").length;
		idb.db.txLog.length = 0;

		now += 120_000;
		expect(await cache.getCachedBlobUrl("a")).toMatch(/^blob:fake\//);
		await new Promise((r) => setTimeout(r, 20));

		expect(idb.db.txLog[0]).toEqual({ names: ["tracks"], mode: "readonly" });
		expect(idb.db.txLog.filter((t) => t.mode === "readwrite")).toEqual([{ names: ["meta"], mode: "readwrite" }]);
		expect(idb.db.puts.filter((s) => s === "tracks").length).toBe(putsAfterWrite);
	});

	it("evicts and writes in a single transaction without loading every record (was: getAll() per write, eviction and write in separate transactions)", async () => {
		const cache = await load();
		cache.setCacheLimit(25);
		await cache.cacheTrack("a", blob(10));
		now += 100_000;
		await cache.cacheTrack("b", blob(10));
		now += 100_000;
		await cache.getCachedBlobUrl("a"); // a is now more recent than b
		await new Promise((r) => setTimeout(r, 20));
		idb.db.txLog.length = 0;

		now += 100_000;
		await cache.cacheTrack("c", blob(10));

		expect(idb.db.txLog).toEqual([{ names: ["tracks", "meta"], mode: "readwrite" }]);
		expect(idb.db.getAllCalls).not.toContain("tracks");
		expect(await cache.isCached("b")).toBe(false);
		expect(await cache.isCached("a")).toBe(true);
		expect(await cache.isCached("c")).toBe(true);
	});

	it("doesn't store a file bigger than the whole cache (was: it evicted everything first)", async () => {
		const cache = await load();
		cache.setCacheLimit(25);
		await cache.cacheTrack("a", blob(10));
		await cache.cacheTrack("huge", blob(30));
		expect(await cache.isCached("a")).toBe(true);
		expect(await cache.isCached("huge")).toBe(false);
	});

	it("reports stats from sizes and access times", async () => {
		const cache = await load();
		await cache.cacheTrack("a", blob(10));
		now += 1000;
		await cache.cacheTrack("b", blob(5));
		const stats = await cache.getCacheStats();
		expect(stats).toMatchObject({ trackCount: 2, totalBytes: 15 });
		expect(stats.tracks.map((t) => t.trackId)).toEqual(["b", "a"]);
		expect(idb.db.getAllCalls).not.toContain("tracks");
	});

	it("removeCached and clearCache drop the audio and its access time", async () => {
		const cache = await load();
		await cache.cacheTrack("a", blob(10));
		await cache.cacheTrack("b", blob(10));
		await cache.removeCached("a");
		expect(await cache.isCached("a")).toBe(false);
		expect(idb.db.stores.get("meta")!.rows.has("atime:a")).toBe(false);
		await cache.clearCache();
		expect(await cache.isCached("b")).toBe(false);
		expect(idb.db.stores.get("meta")!.rows.size).toBe(0);
	});
});
