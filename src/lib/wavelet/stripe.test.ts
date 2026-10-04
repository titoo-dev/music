// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomBytes } from "crypto";
import {
	STRIPE_SIZE,
	BoundedTtlCache,
	coalesceChunks,
	computePad,
	createByteWindow,
	createStripeDecoder,
	isEncryptedStripe,
	parseContentLength,
	parseContentRange,
	planUpstreamWindow,
	withTimeout,
} from "./stripe";

/** Stand-in cipher: flips every bit, so "decrypted" stripes are easy to spot. */
const flip = (stripe: Uint8Array) => Buffer.from(stripe.map((b) => b ^ 0xff));

/** Reference: decode a whole buffer stripe by stripe. */
function referenceDecode(data: Buffer, firstStripeIndex = 0): Buffer {
	const out = Buffer.from(data);
	for (let off = 0, i = firstStripeIndex; off + STRIPE_SIZE <= data.length; off += STRIPE_SIZE, i++) {
		if (i % 3 === 0) flip(data.subarray(off, off + STRIPE_SIZE)).copy(out, off);
	}
	return out;
}

function chunked(data: Buffer, sizes: number[]): Buffer[] {
	const out: Buffer[] = [];
	let off = 0;
	let i = 0;
	while (off < data.length) {
		const n = sizes[i++ % sizes.length];
		out.push(data.subarray(off, off + n));
		off += n;
	}
	return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function collect(source: AsyncIterable<Buffer>): Promise<Buffer[]> {
	const out: Buffer[] = [];
	for await (const c of source) out.push(c);
	return out;
}

describe("isEncryptedStripe", () => {
	it("encrypts stripes 0, 3, 6 … of the file", () => {
		expect([0, 1, 2, 3, 4, 5, 6].map(isEncryptedStripe)).toEqual([true, false, false, true, false, false, true]);
	});
});

describe("computePad", () => {
	it("is 0 when the first byte is not zero", () => {
		expect(computePad(Buffer.from([1, 0, 0, 0]))).toBe(0);
	});

	it("counts the leading zero bytes of the first stripe", () => {
		const s = Buffer.concat([Buffer.alloc(37), Buffer.from([0xff, 0xfb, 0, 0])]);
		expect(computePad(s)).toBe(37);
	});

	it("keeps an MP4's leading zeros (ftyp at bytes 4-8)", () => {
		const s = Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from("ftypisom")]);
		expect(computePad(s)).toBe(0);
	});

	it("strips a whole zero stripe, and handles short or empty input", () => {
		expect(computePad(Buffer.alloc(STRIPE_SIZE))).toBe(STRIPE_SIZE);
		expect(computePad(Buffer.from([0, 0, 7]))).toBe(2);
		expect(computePad(Buffer.alloc(0))).toBe(0);
	});
});

describe("parseContentRange / parseContentLength", () => {
	it("parses bytes a-b/total and bytes a-b/*", () => {
		expect(parseContentRange("bytes 0-2047/3623705")).toEqual({ start: 0, end: 2047, total: 3623705 });
		expect(parseContentRange("bytes 10-20/*")).toEqual({ start: 10, end: 20, total: null });
	});

	it("rejects unsatisfied, malformed and inconsistent values", () => {
		for (const h of [undefined, null, "", "bytes */100", "items 0-1/2", "bytes 5-4/10", "bytes 0-10/10"]) {
			expect(parseContentRange(h)).toBeNull();
		}
	});

	it("parses Content-Length", () => {
		expect(parseContentLength("3623705")).toBe(3623705);
		expect(parseContentLength(undefined)).toBeNull();
		expect(parseContentLength("12abc")).toBeNull();
	});
});

describe("planUpstreamWindow", () => {
	it("maps decoded offsets to upstream offsets shifted by the pad, on stripe boundaries", () => {
		// decoded 0-99 with pad 37 = upstream 37-136 → stripe 0
		expect(planUpstreamWindow(0, 99, 37, 100_000)).toEqual({
			start: 0,
			end: STRIPE_SIZE - 1,
			firstStripeIndex: 0,
			skip: 37,
			take: 100,
		});
	});

	it("starts on the stripe holding start + pad and ends at the end of the stripe holding end + pad", () => {
		const w = planUpstreamWindow(2011, 6200, 37, 100_000); // upstream 2048 … 6237
		expect(w).toEqual({ start: 2048, end: 3 * STRIPE_SIZE + STRIPE_SIZE - 1, firstStripeIndex: 1, skip: 0, take: 4190 });
	});

	it("clamps the window to the end of the file", () => {
		const w = planUpstreamWindow(9_000, 9_962, 37, 10_000);
		expect(w.end).toBe(9_999);
		expect(w.start % STRIPE_SIZE).toBe(0);
		expect(w.skip).toBe(9_037 - w.start);
	});
});

describe("createStripeDecoder", () => {
	it("decrypts the file's stripes 0, 3, 6 … whatever the chunking, and leaves a partial tail plain", () => {
		const data = randomBytes(7 * STRIPE_SIZE + 999);
		const expected = referenceDecode(data);
		for (const sizes of [[1], [100, 5000], [STRIPE_SIZE], [65536], [3 * STRIPE_SIZE + 1]]) {
			const d = createStripeDecoder(flip, 0);
			const out = Buffer.concat([...chunked(data, sizes).map((c) => d.push(c)), d.end()]);
			expect(out.equals(expected)).toBe(true);
		}
	});

	it("counts stripes from the start of the FILE when the window starts later", () => {
		const data = randomBytes(5 * STRIPE_SIZE);
		const d = createStripeDecoder(flip, 2); // window starts at file stripe 2
		const out = Buffer.concat([d.push(data), d.end()]);
		expect(out.equals(referenceDecode(data, 2))).toBe(true);
		// file stripe 3 = window stripe 1 is the first encrypted one
		expect(out.subarray(0, STRIPE_SIZE).equals(data.subarray(0, STRIPE_SIZE))).toBe(true);
		expect(out.subarray(STRIPE_SIZE, 2 * STRIPE_SIZE).equals(flip(data.subarray(STRIPE_SIZE, 2 * STRIPE_SIZE)))).toBe(true);
	});

	it("passes bytes through when the URL is not encrypted", () => {
		const data = randomBytes(4 * STRIPE_SIZE + 10);
		const d = createStripeDecoder(null, 0);
		expect(Buffer.concat([d.push(data), d.end()]).equals(data)).toBe(true);
	});

	it("emits nothing until a stripe is complete", () => {
		const d = createStripeDecoder(flip, 0);
		expect(d.push(Buffer.alloc(100)).length).toBe(0);
		expect(d.push(Buffer.alloc(0)).length).toBe(0);
		expect(d.push(Buffer.alloc(STRIPE_SIZE - 100)).length).toBe(STRIPE_SIZE);
		expect(d.end().length).toBe(0);
	});
});

describe("createByteWindow", () => {
	it("skips the head across chunks, then lets exactly `take` bytes through", () => {
		const data = randomBytes(10_000);
		const w = createByteWindow(1234, 5000);
		const out = Buffer.concat(chunked(data, [700, 3000]).map((c) => w.push(c)));
		expect(out.equals(data.subarray(1234, 6234))).toBe(true);
		expect(w.done).toBe(true);
		expect(w.emitted).toBe(5000);
		expect(w.push(Buffer.alloc(10)).length).toBe(0);
	});

	it("has no tail limit when take is Infinity", () => {
		const w = createByteWindow(2, Infinity);
		expect(w.push(Buffer.from([1, 2, 3, 4])).equals(Buffer.from([3, 4]))).toBe(true);
		expect(w.done).toBe(false);
	});
});

describe("withTimeout", () => {
	it("settles like the promise when it is fast enough", async () => {
		await expect(withTimeout(Promise.resolve(7), 50, () => new Error("t"))).resolves.toBe(7);
		await expect(withTimeout(Promise.reject(new Error("boom")), 50, () => new Error("t"))).rejects.toThrow("boom");
	});

	it("rejects with the timeout error when the promise stalls", async () => {
		await expect(withTimeout(new Promise(() => {}), 20, () => new Error("stalled"))).rejects.toThrow("stalled");
	});

	it("is disabled by a non-positive timeout", async () => {
		const p = Promise.resolve(1);
		expect(withTimeout(p, 0, () => new Error("t"))).toBe(p);
	});
});

describe("coalesceChunks", () => {
	it("merges a fast source into ~target-sized chunks (was: one 2 KiB chunk per stripe)", async () => {
		async function* fast() {
			for (let i = 0; i < 100; i++) yield Buffer.alloc(STRIPE_SIZE, i);
		}
		const out = await collect(coalesceChunks(fast(), 16 * 1024));
		expect(Buffer.concat(out).length).toBe(100 * STRIPE_SIZE);
		expect(out.length).toBeLessThanOrEqual(13);
		for (const c of out.slice(0, -1)) expect(c.length).toBeGreaterThanOrEqual(16 * 1024);
	});

	it("does not hold bytes back while a slow source has nothing ready", async () => {
		async function* slow() {
			for (let i = 0; i < 3; i++) {
				yield Buffer.alloc(100, i);
				await sleep(15);
			}
		}
		const out = await collect(coalesceChunks(slow(), 64 * 1024));
		expect(out.map((c) => c.length)).toEqual([100, 100, 100]);
	});

	it("keeps byte order and content", async () => {
		const data = randomBytes(300_000);
		async function* src() {
			for (const c of chunked(data, [1000, 70_000, 3])) {
				yield c;
				if (c.length === 3) await sleep(1);
			}
		}
		expect(Buffer.concat(await collect(coalesceChunks(src(), 64 * 1024))).equals(data)).toBe(true);
	});

	it("propagates the source's error after flushing nothing extra", async () => {
		async function* failing() {
			yield Buffer.alloc(10);
			throw new Error("upstream died");
		}
		await expect(collect(coalesceChunks(failing()))).rejects.toThrow("upstream died");
	});

	it("closes the source when the consumer stops early", async () => {
		let closed = false;
		async function* src() {
			try {
				for (;;) {
					yield Buffer.alloc(10);
					await sleep(5);
				}
			} finally {
				closed = true;
			}
		}
		for await (const c of coalesceChunks(src())) {
			expect(c.length).toBe(10);
			break;
		}
		await sleep(20);
		expect(closed).toBe(true);
	});
});

describe("BoundedTtlCache", () => {
	it("expires entries after the TTL", () => {
		let now = 1000;
		const cache = new BoundedTtlCache<number>(10, 100, () => now);
		cache.set("a", 1);
		expect(cache.get("a")).toBe(1);
		now = 1100;
		expect(cache.get("a")).toBeUndefined();
	});

	it("evicts the least recently used entry beyond the bound", () => {
		const cache = new BoundedTtlCache<number>(2, 10_000);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.get("a");
		cache.set("c", 3);
		expect(cache.get("b")).toBeUndefined();
		expect(cache.get("a")).toBe(1);
		expect(cache.get("c")).toBe(3);
		expect(cache.size).toBe(2);
		cache.delete("a");
		cache.clear();
		expect(cache.size).toBe(0);
	});
});
