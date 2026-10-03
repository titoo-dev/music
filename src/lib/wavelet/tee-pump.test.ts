import { describe, it, expect, vi } from "vitest";
import { PassThrough } from "stream";
import { pumpTee } from "./tee-pump";

const CHUNK = 64 * 1024;

async function* chunks(count: number, size = CHUNK) {
	for (let i = 0; i < count; i++) yield Buffer.alloc(size, i % 256);
}

/** Collect everything written to a branch; resolves on end. */
function drainAll(stream: PassThrough): Promise<number> {
	return new Promise((resolve, reject) => {
		let total = 0;
		stream.on("data", (c: Buffer) => (total += c.length));
		stream.on("end", () => resolve(total));
		stream.on("error", reject);
	});
}

function withTimeout<T>(p: Promise<T>, ms = 2000): Promise<T | "timeout"> {
	return Promise.race([p, new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms))]);
}

describe("pumpTee", () => {
	it("persists the whole track while the listener is paused (was: stuck buffering after pause + reload)", async () => {
		// A paused <audio> stops reading the response: nobody consumes
		// responseBranch. The persist branch must still get every byte so
		// the R2 upload finishes and the next play gets a seekable file.
		const responseBranch = new PassThrough();
		const persistBranch = new PassThrough();
		const persisted = drainAll(persistBranch);

		const pump = pumpTee({
			source: chunks(200), // ~12.5 MB, far past the stream's highWaterMark
			responseBranch,
			persistBranch,
			abort: vi.fn(),
		});

		expect(await withTimeout(persisted)).toBe(200 * CHUNK);
		await pump;
	});

	it("still hands the listener every byte once it resumes reading", async () => {
		const responseBranch = new PassThrough();
		const persistBranch = new PassThrough();
		persistBranch.resume();

		await withTimeout(
			pumpTee({ source: chunks(50), responseBranch, persistBranch, abort: vi.fn() })
		);
		expect(await withTimeout(drainAll(responseBranch))).toBe(50 * CHUNK);
	});

	it("keeps persisting after the listener hangs up", async () => {
		const responseBranch = new PassThrough();
		const persistBranch = new PassThrough();
		const persisted = drainAll(persistBranch);
		responseBranch.destroy();

		await pumpTee({ source: chunks(20), responseBranch, persistBranch, abort: vi.fn() });
		expect(await withTimeout(persisted)).toBe(20 * CHUNK);
	});

	it("preview mode follows the listener's pace instead of pulling the whole track", async () => {
		const responseBranch = new PassThrough();
		let pulled = 0;
		async function* counting() {
			for (let i = 0; i < 200; i++) {
				pulled++;
				yield Buffer.alloc(CHUNK);
			}
		}

		const pump = pumpTee({
			source: counting(),
			responseBranch,
			persistBranch: null,
			abort: vi.fn(),
		});
		await new Promise((r) => setTimeout(r, 50));
		expect(pulled).toBeLessThan(10);

		responseBranch.destroy();
		responseBranch.emit("drain");
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

		await pumpTee({ source: counting(), responseBranch, persistBranch: null, abort });
		expect(pulled).toBe(1);
	});

	it("head mode caps the response at maxBytes and aborts upstream", async () => {
		const responseBranch = new PassThrough();
		const abort = vi.fn();
		const received = drainAll(responseBranch);

		await pumpTee({
			source: chunks(10),
			responseBranch,
			persistBranch: null,
			maxBytes: CHUNK + 100,
			abort,
		});
		expect(await withTimeout(received)).toBe(CHUNK + 100);
		expect(abort).toHaveBeenCalledOnce();
	});

	it("tears both branches down when the Deezer stream fails", async () => {
		const responseBranch = new PassThrough();
		const persistBranch = new PassThrough();
		const abort = vi.fn();
		const responseErr = new Promise((r) => responseBranch.on("error", r));
		const persistErr = new Promise((r) => persistBranch.on("error", r));
		async function* failing() {
			yield Buffer.alloc(10);
			throw new Error("deezer reset");
		}

		await pumpTee({ source: failing(), responseBranch, persistBranch, abort });
		expect(abort).toHaveBeenCalledOnce();
		expect(await withTimeout(persistErr)).toBeInstanceOf(Error);
		expect(await withTimeout(responseErr)).toBeInstanceOf(Error);
	});
});
