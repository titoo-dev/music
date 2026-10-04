// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { PassThrough, Readable } from "stream";
import fs from "fs";
import os from "os";
import path from "path";
import {
	pumpTee,
	pumpToSpool,
	sweepStaleSpools,
	toWebStream,
	TrackSpool,
	SPOOL_READ_BYTES,
} from "./tee-pump";

const CHUNK = 64 * 1024;

async function* chunks(count: number, size = CHUNK) {
	for (let i = 0; i < count; i++) yield Buffer.alloc(size, i % 256);
}

function expected(count: number, size = CHUNK) {
	return Buffer.concat(Array.from({ length: count }, (_, i) => Buffer.alloc(size, i % 256)));
}

/** Collect everything written to a stream; resolves on end. */
function readAll(stream: Readable): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const parts: Buffer[] = [];
		stream.on("data", (c: Buffer) => parts.push(c));
		stream.on("end", () => resolve(Buffer.concat(parts)));
		stream.on("error", reject);
	});
}

function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T | "timeout"> {
	return Promise.race([p, new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms))]);
}

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

const spools: TrackSpool[] = [];
async function newSpool(dir?: string) {
	const s = await TrackSpool.create(dir);
	spools.push(s);
	return s;
}

afterEach(async () => {
	for (const s of spools.splice(0)) {
		s.dispose();
		await fs.promises.rm(s.path, { force: true });
	}
});

describe("persisting plays: disk-first spool", () => {
	it("persists the whole track while the listener is paused (was: stuck buffering after pause + reload)", async () => {
		// A paused <audio> stops reading the response. The writer must still
		// get every byte to disk so the R2 upload finishes.
		const spool = await newSpool();
		const listener = spool.createReader()!;
		listener.pause();

		await withTimeout(pumpToSpool({ source: chunks(200), spool, abort: vi.fn() }));
		expect(await withTimeout(spool.done)).toBe(200 * CHUNK);
		expect(fs.statSync(spool.path).size).toBe(200 * CHUNK);
		listener.destroy();
	});

	it("never holds the unread remainder in memory while the listener is paused (was: the whole track stayed buffered in the response PassThrough)", async () => {
		const spool = await newSpool();
		const listener = spool.createReader()!;
		listener.on("data", () => {});
		listener.pause();

		await pumpToSpool({ source: chunks(200), spool, abort: vi.fn() });
		await tick();
		// Read-ahead is bounded by the reader's highWaterMark (one chunk or two),
		// not by the 12.5 MB that were written.
		expect(listener.readableLength).toBeLessThanOrEqual(2 * SPOOL_READ_BYTES);
		listener.destroy();
	});

	it("still hands the listener every byte, in order, once it resumes reading", async () => {
		const spool = await newSpool();
		const listener = spool.createReader()!;
		await pumpToSpool({ source: chunks(50), spool, abort: vi.fn() });

		const got = await withTimeout(readAll(listener));
		expect(Buffer.compare(got as Buffer, expected(50))).toBe(0);
	});

	it("tails a spool that is still being written and ends when the writer finishes", async () => {
		const spool = await newSpool();
		const listener = spool.createReader()!;
		const received = readAll(listener);
		async function* slow() {
			for (let i = 0; i < 6; i++) {
				await tick(5);
				yield Buffer.alloc(1000, i);
			}
		}

		await pumpToSpool({ source: slow(), spool, abort: vi.fn() });
		const got = (await withTimeout(received)) as Buffer;
		expect(Buffer.compare(got, Buffer.concat(Array.from({ length: 6 }, (_, i) => Buffer.alloc(1000, i))))).toBe(0);
	});

	it("keeps persisting after the listener hangs up", async () => {
		const spool = await newSpool();
		spool.createReader()!.destroy();

		await pumpToSpool({ source: chunks(20), spool, abort: vi.fn() });
		expect(await spool.done).toBe(20 * CHUNK);
		expect((await spool.readAll()).length).toBe(20 * CHUNK);
	});

	it("serves a follower that attaches mid-stream from its own offset", async () => {
		const spool = await newSpool();
		await spool.write(Buffer.from("hello "));
		const follower = spool.createReader(3)!;
		const got = readAll(follower);
		await spool.write(Buffer.from("world"));
		await spool.finish();
		expect((await withTimeout(got)).toString()).toBe("lo world");
	});

	it("fails the spool, errors every reader and closes upstream when the Deezer stream fails", async () => {
		const spool = await newSpool();
		const listener = spool.createReader()!;
		const listenerErr = new Promise((r) => listener.on("error", r));
		listener.resume();
		const abort = vi.fn();
		async function* failing() {
			yield Buffer.alloc(10);
			throw new Error("deezer reset");
		}

		await pumpToSpool({ source: failing(), spool, abort });
		expect(abort).toHaveBeenCalledOnce();
		await expect(spool.done).rejects.toThrow("deezer reset");
		expect(spool.failed).toBe(true);
		expect(await withTimeout(listenerErr)).toBeInstanceOf(Error);
	});

	it("errors a reader that attaches after the spool failed", async () => {
		const spool = await newSpool();
		await spool.fail(new Error("truncated"));
		const late = spool.createReader()!;
		const failed = new Promise((r) => late.on("error", r));
		late.resume();
		const err = await withTimeout(failed);
		expect((err as Error).message).toBe("truncated");
		await expect(spool.write(Buffer.from("x"))).rejects.toThrow("truncated");
	});

	it("removes the temp file once disposed and the last reader closed (was: /tmp files leaked when tagging failed after the rename)", async () => {
		const spool = await newSpool();
		const listener = spool.createReader()!;
		await pumpToSpool({ source: chunks(2), spool, abort: vi.fn() });

		spool.dispose();
		await tick();
		expect(fs.existsSync(spool.path)).toBe(true);
		listener.destroy();
		await tick(50);
		expect(fs.existsSync(spool.path)).toBe(false);
		expect(spool.removedFromDisk).toBe(true);
		expect(spool.createReader()).toBeNull();
	});

	it("disposing an open spool fails it so the writer stops", async () => {
		const spool = await newSpool();
		spool.dispose();
		await expect(spool.done).rejects.toThrow("spool disposed");
		await tick(50);
		expect(fs.existsSync(spool.path)).toBe(false);
	});

	it("finish and fail are idempotent", async () => {
		const spool = await newSpool();
		await spool.write(Buffer.from("ab"));
		expect(await spool.finish()).toBe(2);
		expect(await spool.finish()).toBe(2);
		await spool.fail(new Error("late"));
		expect(spool.complete).toBe(true);
		expect(spool.error).toBeNull();
	});

	it("sweeps spool files left behind by killed invocations", async () => {
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "spool-sweep-"));
		const old = path.join(dir, "old.part");
		const fresh = path.join(dir, "fresh.part");
		const other = path.join(dir, "keep.txt");
		for (const f of [old, fresh, other]) await fs.promises.writeFile(f, "x");
		const hourAgo = (Date.now() - 2 * 60 * 60 * 1000) / 1000;
		await fs.promises.utimes(old, hourAgo, hourAgo);
		await fs.promises.utimes(other, hourAgo, hourAgo);

		expect(await sweepStaleSpools(dir)).toBe(1);
		expect(fs.existsSync(old)).toBe(false);
		expect(fs.existsSync(fresh)).toBe(true);
		expect(fs.existsSync(other)).toBe(true);
		expect(await sweepStaleSpools(path.join(dir, "missing"))).toBe(0);
		await fs.promises.rm(dir, { recursive: true, force: true });
	});
});

describe("live-only streams: pumpTee keeps backpressure", () => {
	it("preview mode follows the listener's pace instead of pulling the whole track", async () => {
		const responseBranch = new PassThrough();
		let pulled = 0;
		async function* counting() {
			for (let i = 0; i < 200; i++) {
				pulled++;
				yield Buffer.alloc(CHUNK);
			}
		}

		const pump = pumpTee({ source: counting(), responseBranch, abort: vi.fn() });
		await tick(50);
		expect(pulled).toBeLessThan(10);

		responseBranch.destroy();
		await withTimeout(pump);
	});

	it("preview mode stops pulling from Deezer once the listener hangs up", async () => {
		const responseBranch = new PassThrough();
		const abort = vi.fn();
		responseBranch.destroy();
		let pulled = 0;
		async function* counting() {
			for (let i = 0; i < 100; i++) {
				pulled++;
				yield Buffer.alloc(CHUNK);
			}
		}

		await pumpTee({ source: counting(), responseBranch, abort });
		expect(pulled).toBe(1);
		expect(abort).toHaveBeenCalledOnce();
	});

	it("hands the listener every byte when it reads", async () => {
		const responseBranch = new PassThrough();
		const received = readAll(responseBranch);
		await pumpTee({ source: chunks(20), responseBranch, abort: vi.fn() });
		expect((await withTimeout(received)) as Buffer).toHaveLength(20 * CHUNK);
	});

	it("head mode caps the response at maxBytes and aborts upstream", async () => {
		const responseBranch = new PassThrough();
		const abort = vi.fn();
		const received = readAll(responseBranch);

		await pumpTee({ source: chunks(10), responseBranch, maxBytes: CHUNK + 100, abort });
		expect(((await withTimeout(received)) as Buffer).length).toBe(CHUNK + 100);
		expect(abort).toHaveBeenCalledOnce();
	});

	it("tears the response down when the Deezer stream fails", async () => {
		const responseBranch = new PassThrough();
		const abort = vi.fn();
		const responseErr = new Promise((r) => responseBranch.on("error", r));
		async function* failing() {
			yield Buffer.alloc(10);
			throw new Error("deezer reset");
		}

		await pumpTee({ source: failing(), responseBranch, abort });
		expect(abort).toHaveBeenCalledOnce();
		expect(await withTimeout(responseErr)).toBeInstanceOf(Error);
	});
});

describe("toWebStream", () => {
	it("enqueues views of the source chunks instead of copies (was: new Uint8Array(chunk) copied every chunk)", async () => {
		const chunk = Buffer.from("abcdef");
		const source = Readable.from([chunk], { objectMode: false });
		const reader = toWebStream(source).getReader();
		const { value } = await reader.read();
		expect(value!.buffer).toBe(chunk.buffer);
		expect(Buffer.from(value!).toString()).toBe("abcdef");
		expect((await reader.read()).done).toBe(true);
	});

	it("pauses the source while the client is not reading, resumes on pull", async () => {
		const source = new PassThrough();
		const reader = toWebStream(source).getReader();
		source.write(Buffer.alloc(10));
		source.write(Buffer.alloc(10));
		await tick();
		expect(source.isPaused()).toBe(true);
		await reader.read();
		await reader.read();
		expect(source.isPaused()).toBe(false);
		source.end();
		expect((await reader.read()).done).toBe(true);
	});

	it("destroys the source when the client cancels", async () => {
		const source = new PassThrough();
		const stream = toWebStream(source);
		await stream.cancel();
		expect(source.destroyed).toBe(true);
	});

	it("errors the body when the source fails", async () => {
		const source = new PassThrough();
		const reader = toWebStream(source).getReader();
		source.destroy(new Error("cdn reset"));
		await expect(reader.read()).rejects.toThrow("cdn reset");
	});

	it("ends the body cleanly when the source closes without end", async () => {
		const source = new PassThrough();
		const reader = toWebStream(source).getReader();
		source.destroy();
		expect((await reader.read()).done).toBe(true);
	});
});
