// @vitest-environment node
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { randomBytes } from "crypto";
import http from "http";
import type { AddressInfo } from "net";
import { createRequire } from "module";
import { PassThrough, type Readable } from "stream";
import { pumpTee } from "./tee-pump";
import * as decryption from "./decryption";
import {
	clearProbeCache,
	createGotUpstreamFetcher,
	getCachedProbe,
	openDecryptedStream,
	probeTrack,
	streamTrackToReadable,
	RangeNotSatisfiableError,
	RangeNotSupportedError,
	StreamAbortedError,
	TruncatedStreamError,
	UpstreamHttpError,
	UpstreamProtocolError,
	UpstreamTimeoutError,
	type DecryptableTrack,
	type UpstreamFetcher,
	type UpstreamRequest,
} from "./decryption";
import { decryptChunk, generateBlowfishKey } from "./utils/crypto";

const require = createRequire(import.meta.url);
const Blowfish = require("./utils/blowfish.cjs");

const STRIPE = 2048;
const IV = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);
const TRACK_ID = "3135556";

// ── Synthetic Deezer CDN ────────────────────────────────────────────────────

/** Encrypts stripes 0, 3, 6 … of `plain` the way Deezer does (BF_CBC_STRIPE). */
function encryptFile(plain: Buffer, trackId = TRACK_ID): Buffer {
	const cipher = new Blowfish(generateBlowfishKey(trackId), Blowfish.MODE.CBC, Blowfish.PADDING.NULL);
	cipher.setIv(IV);
	const out = Buffer.from(plain);
	for (let off = 0, i = 0; off + STRIPE <= plain.length; off += STRIPE, i++) {
		if (i % 3 === 0) Buffer.from(cipher.encode(plain.subarray(off, off + STRIPE))).copy(out, off);
	}
	return out;
}

/** Audio-like plaintext: `pad` leading zero bytes, then random bytes starting with 0xff. */
function makePlain(length: number, pad = 0): Buffer {
	const plain = randomBytes(length);
	plain.fill(0, 0, pad);
	plain[pad] = 0xff;
	return plain;
}

function makeMp4(length: number): Buffer {
	const plain = randomBytes(length);
	Buffer.from([0, 0, 0, 0x20]).copy(plain, 0);
	Buffer.from("ftypisom").copy(plain, 4);
	return plain;
}

/**
 * The pre-S6 decoder (streamTrackToReadable's decrypter + depadder) run over
 * an in-memory file: the behavioural reference for full streams.
 */
function legacyDecode(file: Buffer, trackId = TRACK_ID, crypted = true): Buffer {
	const key = generateBlowfishKey(trackId);
	const chunks: Buffer[] = [];
	let stripeIndex = 0;
	let off = 0;
	for (; off + STRIPE <= file.length; off += STRIPE) {
		const stripe = file.subarray(off, off + STRIPE);
		chunks.push(crypted && stripeIndex === 0 ? decryptChunk(stripe, key) : stripe);
		stripeIndex = (stripeIndex + 1) % 3;
	}
	if (off < file.length) chunks.push(file.subarray(off));
	if (chunks.length && chunks[0][0] === 0 && chunks[0].slice(4, 8).toString() !== "ftyp") {
		let i = 0;
		while (i < chunks[0].length && chunks[0][i] === 0) i++;
		chunks[0] = chunks[0].slice(i);
	}
	return Buffer.concat(chunks);
}

interface FakeCdnOptions {
	/** Answer 200 + the whole file, ignoring Range. */
	ignoreRange?: boolean;
	/** Omit Content-Length (only meaningful with ignoreRange). */
	noLength?: boolean;
	/** The body ends cleanly after this many bytes of the response. */
	truncateAfter?: number;
	/** The body stops producing after this many bytes (until destroyed). */
	stallAfter?: number;
	/** Answer every request with this HTTP status. */
	status?: number;
	/** The first N requests fail with a network error. */
	failFirst?: number;
	/** The first N requests never get response headers. */
	hangFirst?: number;
	/** Body chunk sizes (cycled). */
	chunkSizes?: number[];
	/** Pause this long between body chunks. */
	chunkDelayMs?: number;
}

function fakeCdn(file: Buffer, o: FakeCdnOptions = {}) {
	const calls: UpstreamRequest[] = [];
	let destroyed = 0;
	const fetcher: UpstreamFetcher = async (req) => {
		calls.push(req);
		if (o.failFirst && calls.length <= o.failFirst) {
			throw Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
		}
		if (o.hangFirst && calls.length <= o.hangFirst) return new Promise(() => {});
		let dead = false;
		let wake: (() => void) | null = null;
		const destroy = () => {
			if (dead) return;
			dead = true;
			destroyed++;
			wake?.();
		};
		req.signal.addEventListener("abort", destroy, { once: true });
		if (o.status) {
			return { statusCode: o.status, headers: {}, body: (async function* () {})(), destroy };
		}
		const total = file.length;
		let start = 0;
		let end = total - 1;
		const headers: Record<string, string | undefined> = {};
		let statusCode = 200;
		if (!o.ignoreRange) {
			start = req.range.start;
			end = Math.min(req.range.end ?? total - 1, total - 1);
			statusCode = 206;
			headers["content-range"] = `bytes ${start}-${end}/${total}`;
		}
		if (!o.noLength) headers["content-length"] = String(end - start + 1);
		const slice = file.subarray(start, end + 1);
		const sizes = o.chunkSizes ?? [16 * 1024];
		async function* body() {
			let sent = 0;
			let i = 0;
			const limit = Math.min(o.truncateAfter ?? Infinity, slice.length);
			while (sent < limit) {
				if (dead) throw Object.assign(new Error("Premature close"), { code: "ERR_STREAM_PREMATURE_CLOSE" });
				if (o.stallAfter != null && sent >= o.stallAfter) {
					await new Promise<void>((r) => (wake = r));
					continue;
				}
				const n = Math.min(sizes[i++ % sizes.length], limit - sent);
				yield slice.subarray(sent, sent + n);
				sent += n;
				if (o.chunkDelayMs) await new Promise((r) => setTimeout(r, o.chunkDelayMs));
			}
		}
		return { statusCode, headers, body: body(), destroy };
	};
	return {
		fetcher,
		calls,
		get destroyed() {
			return destroyed;
		},
	};
}

function track(file: Buffer, extra: Partial<DecryptableTrack> = {}): DecryptableTrack {
	return {
		id: TRACK_ID,
		downloadURL: "https://cdnt-stream.dzcdn.net/media/1/abc",
		bitrate: 1,
		...extra,
	};
}

async function readAll(readable: Readable): Promise<{ data: Buffer; sizes: number[] }> {
	const parts: Buffer[] = [];
	for await (const c of readable) parts.push(c as Buffer);
	return { data: Buffer.concat(parts), sizes: parts.map((p) => p.length) };
}

async function readError(readable: Readable): Promise<unknown> {
	try {
		await readAll(readable);
	} catch (e) {
		return e;
	}
	throw new Error("expected the stream to error");
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => clearProbeCache());

// ── Tests ───────────────────────────────────────────────────────────────────

describe("decryption module surface", () => {
	it("no longer exports the dead streamTrack downloader or its unused URL helpers (was: streamTrack null-dereferenced downloadObject.isCanceled on every chunk)", () => {
		for (const name of ["streamTrack", "generateStreamURL", "reverseStreamURL", "reverseStreamPath"]) {
			expect(name in decryption).toBe(false);
		}
	});

	it("keeps generateCryptedStreamURL for getPreferredBitrate's feelingLucky fallback", () => {
		const url = decryption.generateCryptedStreamURL(3135556, "a1b2c3", 1, 1);
		expect(url).toMatch(/^https:\/\/e-cdns-proxy-a\.dzcdn\.net\/mobile\/1\/[0-9a-f]+$/);
		expect(url).toBe(decryption.generateCryptedStreamURL(3135556, "a1b2c3", 1, 1));
	});
});

describe("openDecryptedStream — full track", () => {
	it("decodes the whole track byte-identical to the pre-S6 decoder", async () => {
		const cases: Array<[string, Buffer, string?]> = [
			["no pad, partial tail", makePlain(100_000)],
			["37-byte pad", makePlain(50_000, 37)],
			["MP4 keeps its zeros", makeMp4(30_000)],
			["tail exactly on an encrypted stripe", makePlain(6 * STRIPE + 500)],
			["shorter than a stripe", makePlain(1500, 3)],
			["plain URL", makePlain(20_000, 5), "https://example.test/api/1/x"],
		];
		for (const [name, plain, url] of cases) {
			const file = url ? plain : encryptFile(plain);
			const cdn = fakeCdn(file, { chunkSizes: [1000, 7777, 16384] });
			const s = await openDecryptedStream(track(file, url ? { downloadURL: url } : {}), { fetcher: cdn.fetcher });
			const { data } = await readAll(s.readable);
			expect(data.equals(legacyDecode(file, TRACK_ID, !url)), name).toBe(true);
			expect(s.totalLength, name).toBe(data.length);
			expect(s.contentLength, name).toBe(data.length);
		}
	});

	it("strips the first stripe's zero padding and reports the decoded total length (Content-Length)", async () => {
		const plain = makePlain(40_000, 37);
		const file = encryptFile(plain);
		const cdn = fakeCdn(file);
		const s = await openDecryptedStream(track(file), { fetcher: cdn.fetcher });
		expect(s).toMatchObject({ start: 0, end: 40_000 - 37 - 1, totalLength: 40_000 - 37, upstreamLength: 40_000, rangeSupported: true });
		expect((await readAll(s.readable)).data.equals(plain.subarray(37))).toBe(true);
		expect(cdn.calls[0].range).toEqual({ start: 0 });
	});

	it("emits the first stripe alone, then ~64 KiB chunks (was: ~20k 2 KiB chunks per FLAC)", async () => {
		const plain = makePlain(1_000_000);
		const file = encryptFile(plain);
		const s = await openDecryptedStream(track(file), { fetcher: fakeCdn(file).fetcher });
		const { data, sizes } = await readAll(s.readable);
		expect(data.equals(plain)).toBe(true);
		expect(sizes[0]).toBe(STRIPE);
		for (const n of sizes.slice(1, -1)) expect(n).toBeGreaterThanOrEqual(64 * 1024);
		expect(sizes.length).toBeLessThan(20);
	});

	it("errors with TruncatedStreamError when the CDN body ends before Content-Length (was: a truncated track was tagged, uploaded and served forever)", async () => {
		const file = encryptFile(makePlain(200_000));
		const cdn = fakeCdn(file, { truncateAfter: 120_000 });
		const s = await openDecryptedStream(track(file), { fetcher: cdn.fetcher });
		const err = await readError(s.readable);
		expect(err).toBeInstanceOf(TruncatedStreamError);
		expect(err).toMatchObject({ expected: 200_000, received: 120_000 });
		expect(cdn.calls).toHaveLength(1); // never retried mid-body
		expect(cdn.destroyed).toBeGreaterThan(0);
	});

	it("errors with UpstreamTimeoutError('idle') when the CDN stalls mid-body, and closes the request (was: hung until maxDuration)", async () => {
		const file = encryptFile(makePlain(200_000));
		const cdn = fakeCdn(file, { stallAfter: 50_000 });
		const s = await openDecryptedStream(track(file), { fetcher: cdn.fetcher, idleTimeoutMs: 40 });
		const err = await readError(s.readable);
		expect(err).toBeInstanceOf(UpstreamTimeoutError);
		expect(err).toMatchObject({ phase: "idle", timeoutMs: 40 });
		expect(cdn.destroyed).toBeGreaterThan(0);
		expect(cdn.calls).toHaveLength(1);
	});

	it("does not count a paused consumer as an idle CDN", async () => {
		const plain = makePlain(300_000);
		const file = encryptFile(plain);
		const s = await openDecryptedStream(track(file), { fetcher: fakeCdn(file).fetcher, idleTimeoutMs: 20 });
		await tick(80); // nobody reads
		expect((await readAll(s.readable)).data.equals(plain)).toBe(true);
	});

	it("retries the initial request once on a network error before any byte", async () => {
		const plain = makePlain(30_000);
		const file = encryptFile(plain);
		const cdn = fakeCdn(file, { failFirst: 1 });
		const s = await openDecryptedStream(track(file), { fetcher: cdn.fetcher });
		expect((await readAll(s.readable)).data.equals(plain)).toBe(true);
		expect(cdn.calls).toHaveLength(2);
	});

	it("gives up after one retry", async () => {
		const file = encryptFile(makePlain(30_000));
		const cdn = fakeCdn(file, { failFirst: 5 });
		await expect(openDecryptedStream(track(file), { fetcher: cdn.fetcher })).rejects.toMatchObject({ code: "ECONNRESET" });
		expect(cdn.calls).toHaveLength(2);
	});

	it("retries once when the CDN stalls or truncates before the first stripe", async () => {
		const file = encryptFile(makePlain(30_000));
		const stalled = fakeCdn(file, { stallAfter: 1000, chunkSizes: [500] });
		await expect(
			openDecryptedStream(track(file), { fetcher: stalled.fetcher, idleTimeoutMs: 20 })
		).rejects.toBeInstanceOf(UpstreamTimeoutError);
		expect(stalled.calls).toHaveLength(2);
		expect(stalled.destroyed).toBe(2);

		const truncated = fakeCdn(file, { truncateAfter: 1000 });
		await expect(openDecryptedStream(track(file), { fetcher: truncated.fetcher })).rejects.toBeInstanceOf(
			TruncatedStreamError
		);
		expect(truncated.calls).toHaveLength(2);
	});

	it("times out (once retried) when the CDN never sends response headers", async () => {
		const file = encryptFile(makePlain(30_000));
		const cdn = fakeCdn(file, { hangFirst: 2 });
		await expect(
			openDecryptedStream(track(file), { fetcher: cdn.fetcher, headersTimeoutMs: 20 })
		).rejects.toMatchObject({ name: "UpstreamTimeoutError", phase: "response" });
		expect(cdn.calls).toHaveLength(2);
	});

	it("does not retry an HTTP error", async () => {
		const cdn = fakeCdn(Buffer.alloc(10), { status: 403 });
		const err = await openDecryptedStream(track(Buffer.alloc(10)), { fetcher: cdn.fetcher }).catch((e) => e);
		expect(err).toBeInstanceOf(UpstreamHttpError);
		expect(err.statusCode).toBe(403);
		expect(cdn.calls).toHaveLength(1);
	});

	it("serves a CDN that ignores Range (200) and still knows the length", async () => {
		const plain = makePlain(50_000, 11);
		const file = encryptFile(plain);
		const s = await openDecryptedStream(track(file), { fetcher: fakeCdn(file, { ignoreRange: true }).fetcher });
		expect(s.rangeSupported).toBe(false);
		expect(s.totalLength).toBe(50_000 - 11);
		expect((await readAll(s.readable)).data.equals(plain.subarray(11))).toBe(true);
		expect(getCachedProbe(track(file))).toMatchObject({ rangeSupported: false, pad: 11 });
	});

	it("streams without a length when the CDN sends none", async () => {
		const plain = makePlain(50_000);
		const file = encryptFile(plain);
		const s = await openDecryptedStream(track(file), {
			fetcher: fakeCdn(file, { ignoreRange: true, noLength: true }).fetcher,
		});
		expect(s.totalLength).toBeNull();
		expect(s.end).toBeNull();
		expect((await readAll(s.readable)).data.equals(plain)).toBe(true);
	});

	it("fills the probe cache so a later seek needs no probe request", async () => {
		const file = encryptFile(makePlain(60_000, 9));
		const s = await openDecryptedStream(track(file), { fetcher: fakeCdn(file).fetcher });
		await readAll(s.readable);
		expect(getCachedProbe(track(file))).toEqual({ upstreamLength: 60_000, pad: 9, decodedLength: 59_991, rangeSupported: true });
	});

	it("abort() closes the CDN connection and ends the readable without an error", async () => {
		const file = encryptFile(makePlain(500_000));
		const cdn = fakeCdn(file, { chunkDelayMs: 5 });
		const s = await openDecryptedStream(track(file), { fetcher: cdn.fetcher });
		let errored = false;
		s.readable.on("error", () => (errored = true));
		s.abort();
		await tick(20);
		expect(cdn.destroyed).toBe(1);
		expect(s.readable.destroyed).toBe(true);
		expect(errored).toBe(false);
	});

	it("destroying the readable closes the CDN connection right away", async () => {
		const file = encryptFile(makePlain(200_000));
		const cdn = fakeCdn(file, { stallAfter: 20_000 });
		const s = await openDecryptedStream(track(file), { fetcher: cdn.fetcher, idleTimeoutMs: 10_000 });
		s.readable.destroy();
		await tick(10);
		expect(cdn.destroyed).toBe(1);
	});

	it("rejects with StreamAbortedError when the caller's signal aborts before the stream opens", async () => {
		const file = encryptFile(makePlain(30_000));
		const cdn = fakeCdn(file, { hangFirst: 1 });
		const ac = new AbortController();
		const opening = openDecryptedStream(track(file), { fetcher: cdn.fetcher, signal: ac.signal });
		await tick(5);
		ac.abort();
		await expect(opening).rejects.toBeInstanceOf(StreamAbortedError);
		expect(cdn.calls).toHaveLength(1);

		const pre = new AbortController();
		pre.abort();
		await expect(
			openDecryptedStream(track(file), { fetcher: fakeCdn(file).fetcher, signal: pre.signal })
		).rejects.toBeInstanceOf(StreamAbortedError);
	});

	it("the caller's signal also tears down an open stream", async () => {
		const file = encryptFile(makePlain(200_000));
		const cdn = fakeCdn(file, { stallAfter: 20_000 });
		const ac = new AbortController();
		const s = await openDecryptedStream(track(file), { fetcher: cdn.fetcher, signal: ac.signal, idleTimeoutMs: 10_000 });
		ac.abort();
		await tick(10);
		expect(cdn.destroyed).toBe(1);
		expect(s.readable.destroyed).toBe(true);
	});
});

describe("openDecryptedStream — byte ranges (S10)", () => {
	for (const pad of [0, 37]) {
		it(`serves decoded ranges byte-identical to the full decode (pad ${pad})`, async () => {
			const plain = makePlain(9 * STRIPE * 3 + 1234, pad); // ends in a partial stripe
			const file = encryptFile(plain);
			const full = legacyDecode(file);
			const n = full.length;
			const ranges: Array<[number, number | undefined]> = [
				[0, 999], // head
				[0, n - 1], // everything, explicitly
				[3 * STRIPE - pad, 3 * STRIPE - pad + 99], // starts exactly on encrypted stripe 3
				[12_345, 54_321], // unaligned, many stripes
				[3 * STRIPE - pad - 10, 4 * STRIPE - pad + 10], // crosses plain→encrypted→plain
				[STRIPE - pad - 1, STRIPE - pad], // one byte each side of a stripe edge
				[n - 500, undefined], // tail, open-ended
				[n - 1, n + 10_000], // last byte, end clamped
			];
			const cdn = fakeCdn(file, { chunkSizes: [3000, 333] });
			for (const [a, b] of ranges) {
				const s = await openDecryptedStream(track(file), { start: a, end: b, fetcher: cdn.fetcher });
				const last = Math.min(b ?? n - 1, n - 1);
				const label = `${a}-${b}`;
				expect(s.start, label).toBe(a);
				expect(s.end, label).toBe(last);
				expect(s.contentLength, label).toBe(last - a + 1);
				expect(s.totalLength, label).toBe(n);
				expect(s.rangeSupported, label).toBe(true);
				const { data } = await readAll(s.readable);
				expect(data.equals(full.subarray(a, last + 1)), label).toBe(true);
				const req = cdn.calls[cdn.calls.length - 1].range;
				expect(req.start % STRIPE, label).toBe(0);
				expect(req.start, label).toBeLessThanOrEqual(a + pad);
				expect(req.end, label).toBeGreaterThanOrEqual(last + pad);
			}
			// one probe for the first range, then the cache
			expect(cdn.calls[0].range).toEqual({ start: 0, end: STRIPE - 1 });
			expect(cdn.calls).toHaveLength(ranges.length + 1);
		});
	}

	it("serves ranges of an MP4 without depadding", async () => {
		const plain = makeMp4(40_000);
		const file = encryptFile(plain);
		const cdn = fakeCdn(file);
		const s = await openDecryptedStream(track(file, { bitrate: 15 }), { start: 2, end: 9, fetcher: cdn.fetcher });
		expect(s.contentType).toBe("audio/mp4");
		expect((await readAll(s.readable)).data.equals(plain.subarray(2, 10))).toBe(true);
	});

	it("uses a probe passed by the caller instead of fetching one", async () => {
		const plain = makePlain(40_000, 5);
		const file = encryptFile(plain);
		const cdn = fakeCdn(file);
		const probe = { upstreamLength: 40_000, pad: 5, decodedLength: 39_995, rangeSupported: true };
		const s = await openDecryptedStream(track(file), { start: 100, end: 199, probe, fetcher: cdn.fetcher });
		expect((await readAll(s.readable)).data.equals(plain.subarray(105, 205))).toBe(true);
		expect(cdn.calls).toHaveLength(1);
	});

	it("rejects with RangeNotSupportedError when the CDN ignores Range (callers fall back to a full stream)", async () => {
		const file = encryptFile(makePlain(40_000));
		const cdn = fakeCdn(file, { ignoreRange: true });
		await expect(
			openDecryptedStream(track(file), { start: 1000, fetcher: cdn.fetcher })
		).rejects.toBeInstanceOf(RangeNotSupportedError);
		expect(getCachedProbe(track(file))?.rangeSupported).toBe(false);
	});

	it("remembers a CDN that stops honouring Range after the probe", async () => {
		const file = encryptFile(makePlain(40_000));
		const probe = { upstreamLength: 40_000, pad: 0, decodedLength: 40_000, rangeSupported: true };
		const cdn = fakeCdn(file, { ignoreRange: true });
		await expect(
			openDecryptedStream(track(file), { start: 1000, probe, fetcher: cdn.fetcher })
		).rejects.toBeInstanceOf(RangeNotSupportedError);
		expect(cdn.destroyed).toBe(1);
		expect(getCachedProbe(track(file))?.rangeSupported).toBe(false);
	});

	it("rejects with RangeNotSatisfiableError (carrying the total) past the end or for an inverted range", async () => {
		const file = encryptFile(makePlain(40_000, 40));
		const cdn = fakeCdn(file);
		for (const [start, end] of [
			[39_960, undefined],
			[50_000, undefined],
			[500, 100],
			[-1, 10],
		] as Array<[number, number | undefined]>) {
			const err = await openDecryptedStream(track(file), { start, end, fetcher: cdn.fetcher }).catch((e) => e);
			expect(err).toBeInstanceOf(RangeNotSatisfiableError);
			expect(err.totalLength).toBe(39_960);
		}
	});

	it("errors with TruncatedStreamError when a range body ends early", async () => {
		const file = encryptFile(makePlain(200_000));
		const cdn = fakeCdn(file, { truncateAfter: 30_000 });
		await probeTrack(track(file), { fetcher: fakeCdn(file).fetcher });
		const s = await openDecryptedStream(track(file), { start: 10_000, end: 150_000, fetcher: cdn.fetcher });
		expect(await readError(s.readable)).toBeInstanceOf(TruncatedStreamError);
	});

	it("rejects (and forgets the probe) when the file size changed since the probe", async () => {
		const file = encryptFile(makePlain(40_000));
		const probe = { upstreamLength: 41_000, pad: 0, decodedLength: 41_000, rangeSupported: true };
		await expect(
			openDecryptedStream(track(file), { start: 100, end: 200, probe, fetcher: fakeCdn(file).fetcher })
		).rejects.toBeInstanceOf(UpstreamProtocolError);
		expect(getCachedProbe(track(file))).toBeNull();
	});

	it("rejects a 206 for another window than the one asked", async () => {
		const file = encryptFile(makePlain(40_000));
		const liar: UpstreamFetcher = async () => ({
			statusCode: 206,
			headers: { "content-range": "bytes 0-2047/40000", "content-length": "2048" },
			body: (async function* () {
				yield file.subarray(0, 2048);
			})(),
			destroy: () => {},
		});
		const probe = { upstreamLength: 40_000, pad: 0, decodedLength: 40_000, rangeSupported: true };
		await expect(
			openDecryptedStream(track(file), { start: 10_000, end: 10_100, probe, fetcher: liar })
		).rejects.toBeInstanceOf(UpstreamProtocolError);
	});
});

describe("probeTrack", () => {
	it("learns length, pad and Range support from the first stripe only, and caches it", async () => {
		const file = encryptFile(makePlain(70_000, 21));
		const cdn = fakeCdn(file);
		expect(await probeTrack(track(file), { fetcher: cdn.fetcher })).toEqual({
			upstreamLength: 70_000,
			pad: 21,
			decodedLength: 69_979,
			rangeSupported: true,
		});
		expect(cdn.calls.map((c) => c.range)).toEqual([{ start: 0, end: STRIPE - 1 }]);
		await probeTrack(track(file), { fetcher: cdn.fetcher });
		expect(cdn.calls).toHaveLength(1);
		await probeTrack(track(file), { fetcher: cdn.fetcher, fresh: true });
		expect(cdn.calls).toHaveLength(2);
	});

	it("keys the cache by track id + format", async () => {
		const file = encryptFile(makePlain(70_000));
		const cdn = fakeCdn(file);
		await probeTrack(track(file), { fetcher: cdn.fetcher });
		await probeTrack(track(file, { bitrate: 3 }), { fetcher: cdn.fetcher });
		expect(cdn.calls).toHaveLength(2);
	});

	it("reports pad 0 for an MP4 and for a tiny file", async () => {
		const mp4 = encryptFile(makeMp4(10_000));
		expect((await probeTrack(track(mp4), { fetcher: fakeCdn(mp4).fetcher })).pad).toBe(0);
		clearProbeCache();
		const tiny = encryptFile(makePlain(100));
		expect(await probeTrack(track(tiny), { fetcher: fakeCdn(tiny).fetcher })).toMatchObject({
			upstreamLength: 100,
			decodedLength: 100,
		});
	});

	it("reports rangeSupported=false when the CDN answers 200, and closes the full download", async () => {
		const file = encryptFile(makePlain(500_000, 4));
		const cdn = fakeCdn(file, { ignoreRange: true });
		expect(await probeTrack(track(file), { fetcher: cdn.fetcher })).toEqual({
			upstreamLength: 500_000,
			pad: 4,
			decodedLength: 499_996,
			rangeSupported: false,
		});
		expect(cdn.destroyed).toBe(1);
	});

	it("retries once on a network error and surfaces HTTP errors", async () => {
		const file = encryptFile(makePlain(10_000));
		const flaky = fakeCdn(file, { failFirst: 1 });
		await probeTrack(track(file), { fetcher: flaky.fetcher });
		expect(flaky.calls).toHaveLength(2);
		clearProbeCache();
		await expect(
			probeTrack(track(file), { fetcher: fakeCdn(file, { status: 404 }).fetcher })
		).rejects.toBeInstanceOf(UpstreamHttpError);
	});

	it("rejects with StreamAbortedError when its signal aborts", async () => {
		const file = encryptFile(makePlain(10_000));
		const ac = new AbortController();
		const p = probeTrack(track(file), { fetcher: fakeCdn(file, { hangFirst: 1 }).fetcher, signal: ac.signal });
		await tick(5);
		ac.abort();
		await expect(p).rejects.toBeInstanceOf(StreamAbortedError);
	});
});

describe("gotUpstreamFetcher against a local HTTP server", () => {
	const plain = makePlain(120_000, 17);
	const file = encryptFile(plain);
	const seen: Array<{ url?: string; range?: string; ua?: string; acceptEncoding?: string }> = [];
	let base = "";
	const server = http.createServer((req, res) => {
		seen.push({
			url: req.url,
			range: req.headers.range,
			ua: req.headers["user-agent"],
			acceptEncoding: req.headers["accept-encoding"],
		});
		if (req.url === "/media/hang") return; // never answers
		if (req.url === "/media/forbidden") {
			res.writeHead(403);
			res.end();
			return;
		}
		if (req.url === "/media/cut") {
			res.writeHead(200, { "Content-Length": String(file.length) });
			res.write(file.subarray(0, 50_000));
			setTimeout(() => res.socket?.destroy(), 10);
			return;
		}
		const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? "");
		if (!m) {
			res.writeHead(200, { "Content-Length": String(file.length) });
			res.end(file);
			return;
		}
		const start = Number(m[1]);
		const end = m[2] ? Math.min(Number(m[2]), file.length - 1) : file.length - 1;
		res.writeHead(206, {
			"Content-Range": `bytes ${start}-${end}/${file.length}`,
			"Content-Length": String(end - start + 1),
		});
		res.end(file.subarray(start, end + 1));
	});
	const at = (path: string) => track(file, { downloadURL: base + path });

	beforeAll(async () => {
		await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
		base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	});
	afterAll(async () => {
		server.closeAllConnections();
		await new Promise((r) => server.close(r));
	});

	it("decodes full and ranged reads over got, sending Range and no Accept-Encoding", async () => {
		const full = await openDecryptedStream(at("/media/ok")); // default fetcher
		expect((await readAll(full.readable)).data.equals(plain.subarray(17))).toBe(true);
		expect(full.totalLength).toBe(120_000 - 17);
		const part = await openDecryptedStream(at("/media/ok"), { start: 7_000, end: 70_000 });
		expect((await readAll(part.readable)).data.equals(plain.subarray(7_017, 70_018))).toBe(true);
		expect(seen[0]).toMatchObject({ url: "/media/ok", range: "bytes=0-", acceptEncoding: undefined });
		expect(seen[0].ua).toMatch(/Mozilla/);
		expect(seen.at(-1)?.range).toBe("bytes=6144-71679");
	});

	it("maps a CDN error status to UpstreamHttpError", async () => {
		await expect(openDecryptedStream(at("/media/forbidden"))).rejects.toMatchObject({
			name: "UpstreamHttpError",
			statusCode: 403,
		});
	});

	it("times out (and retries once) when the CDN never answers (was: a stalled CDN hung until maxDuration)", async () => {
		const before = seen.length;
		const err = await openDecryptedStream(at("/media/hang"), {
			fetcher: createGotUpstreamFetcher({ response: 80 }),
		}).catch((e) => e);
		expect(err).toBeInstanceOf(UpstreamTimeoutError);
		expect(err.phase).toBe("response");
		expect(seen.length - before).toBe(2);
	});

	it("aborting a pending request rejects with StreamAbortedError", async () => {
		const ac = new AbortController();
		const p = openDecryptedStream(at("/media/hang"), { signal: ac.signal });
		await tick(30);
		ac.abort();
		await expect(p).rejects.toBeInstanceOf(StreamAbortedError);
	});

	it("errors the stream when the socket closes mid-body, without retrying", async () => {
		const before = seen.length;
		const s = await openDecryptedStream(at("/media/cut"));
		expect(await readError(s.readable)).toBeInstanceOf(Error);
		expect(seen.length - before).toBe(1);
	});
});

describe("streamTrackToReadable (legacy shape, delegates to openDecryptedStream)", () => {
	it("streams the same bytes as before and resolves the upstream Content-Length", async () => {
		const file = encryptFile(makePlain(80_000, 13));
		const p = streamTrackToReadable(track(file), { fetcher: fakeCdn(file).fetcher });
		expect(p.contentType).toBe("audio/mpeg");
		const { data } = await readAll(p.readable);
		expect(data.equals(legacyDecode(file))).toBe(true);
		expect(await p.contentLengthPromise).toBe(80_000);
	});

	it("still drives pumpTee: response and persist branches both get the whole decoded track", async () => {
		const file = encryptFile(makePlain(300_000, 6));
		const p = streamTrackToReadable(track(file), { fetcher: fakeCdn(file).fetcher });
		const responseBranch = new PassThrough();
		const persistBranch = new PassThrough();
		const collected = (b: PassThrough) =>
			new Promise<Buffer>((resolve, reject) => {
				const parts: Buffer[] = [];
				b.on("data", (c: Buffer) => parts.push(c));
				b.on("end", () => resolve(Buffer.concat(parts)));
				b.on("error", reject);
			});
		const [res, persisted] = await Promise.all([
			collected(responseBranch),
			collected(persistBranch),
			pumpTee({ source: p.readable, responseBranch, persistBranch, abort: p.abort }),
		]);
		const expected = legacyDecode(file);
		expect(res.equals(expected)).toBe(true);
		expect(persisted.equals(expected)).toBe(true);
	});

	it("makes pumpTee fail the persist branch on a truncated upstream (was: truncated file uploaded and served forever)", async () => {
		const file = encryptFile(makePlain(300_000));
		const p = streamTrackToReadable(track(file), { fetcher: fakeCdn(file, { truncateAfter: 150_000 }).fetcher });
		const responseBranch = new PassThrough();
		const persistBranch = new PassThrough();
		responseBranch.resume();
		responseBranch.on("error", () => {});
		const persistError = new Promise<unknown>((resolve) => {
			persistBranch.on("error", resolve);
			persistBranch.on("end", () => resolve(null));
			persistBranch.resume();
		});
		await pumpTee({ source: p.readable, responseBranch, persistBranch, abort: p.abort });
		expect(await persistError).toBeInstanceOf(TruncatedStreamError);
	});

	it("errors the readable on a truncated upstream (was: ended cleanly and got persisted)", async () => {
		const file = encryptFile(makePlain(200_000));
		const p = streamTrackToReadable(track(file), { fetcher: fakeCdn(file, { truncateAfter: 100_000 }).fetcher });
		expect(await readError(p.readable)).toBeInstanceOf(TruncatedStreamError);
	});

	it("errors the readable and resolves 0 on an HTTP error", async () => {
		const p = streamTrackToReadable(track(Buffer.alloc(1)), { fetcher: fakeCdn(Buffer.alloc(1), { status: 403 }).fetcher });
		expect(await readError(p.readable)).toBeInstanceOf(UpstreamHttpError);
		expect(await p.contentLengthPromise).toBe(0);
	});

	it("abort() closes the CDN connection", async () => {
		const file = encryptFile(makePlain(200_000));
		const cdn = fakeCdn(file, { stallAfter: 30_000 });
		const p = streamTrackToReadable(track(file), { fetcher: cdn.fetcher, idleTimeoutMs: 10_000 });
		const reader = p.readable[Symbol.asyncIterator]();
		await reader.next();
		p.abort();
		await tick(10);
		expect(cdn.destroyed).toBe(1);
		expect(p.readable.destroyed).toBe(true);
	});

	it("destroying the readable (e.g. a preview listener hanging up) closes the CDN connection", async () => {
		const file = encryptFile(makePlain(200_000));
		const cdn = fakeCdn(file, { stallAfter: 30_000 });
		const p = streamTrackToReadable(track(file), { fetcher: cdn.fetcher, idleTimeoutMs: 10_000 });
		const reader = p.readable[Symbol.asyncIterator]();
		await reader.next();
		p.readable.destroy();
		await tick(10);
		expect(cdn.destroyed).toBe(1);
	});
});
