// Pure building blocks of the Deezer BF_CBC_STRIPE decoder (decryption.ts).
// No network, no Deezer imports: everything here is unit-tested offline.
//
// Format: the upstream file is cut into 2048-byte stripes counted from the
// START of the file; stripes 0, 3, 6, ... are Blowfish-CBC encrypted (each
// one independently, from a fixed IV), the others and a trailing partial
// stripe are plain. The decoded stream drops the leading zero bytes of the
// first stripe ("pad") unless the file is MP4 ("ftyp" at bytes 4-8), so a
// decoded offset d lives at upstream offset d + pad.

import { setImmediate } from "timers";
import type { StripeDecryptor } from "./utils/crypto";

export const STRIPE_SIZE = 2048;

/** Whether the stripe at this index (counted from the start of the file) is encrypted. */
export function isEncryptedStripe(index: number): boolean {
	return index % 3 === 0;
}

/**
 * Number of leading bytes the depadder strips from the first decoded stripe:
 * every leading zero byte, unless the first byte is non-zero or the file is
 * an MP4 ("ftyp" at bytes 4-8). Same rule as the original depadder.
 */
export function computePad(firstStripe: Uint8Array): number {
	if (firstStripe.length === 0 || firstStripe[0] !== 0) return 0;
	if (
		firstStripe[4] === 0x66 &&
		firstStripe[5] === 0x74 &&
		firstStripe[6] === 0x79 &&
		firstStripe[7] === 0x70
	) {
		return 0;
	}
	let i = 0;
	while (i < firstStripe.length && firstStripe[i] === 0) i++;
	return i;
}

export interface ContentRange {
	start: number;
	end: number;
	/** null for "bytes a-b/*". */
	total: number | null;
}

/** Parses "bytes a-b/total" (or "/*"). Returns null for anything else, including "bytes * /total". */
export function parseContentRange(header: string | null | undefined): ContentRange | null {
	if (!header) return null;
	const m = /^\s*bytes\s+(\d+)-(\d+)\/(\d+|\*)\s*$/i.exec(header);
	if (!m) return null;
	const start = Number(m[1]);
	const end = Number(m[2]);
	const total = m[3] === "*" ? null : Number(m[3]);
	if (end < start || (total != null && end >= total)) return null;
	return { start, end, total };
}

/** Parses a Content-Length header; null when absent or malformed. */
export function parseContentLength(header: string | null | undefined): number | null {
	if (header == null || !/^\s*\d+\s*$/.test(header)) return null;
	return Number(header);
}

export interface UpstreamWindow {
	/** First upstream byte to request (stripe-aligned). */
	start: number;
	/** Last upstream byte to request (inclusive; end of a stripe or of the file). */
	end: number;
	/** Index of the stripe at `start`, counted from the start of the file. */
	firstStripeIndex: number;
	/** Decoded bytes of the window to drop before the requested range. */
	skip: number;
	/** Decoded bytes to emit. */
	take: number;
}

/**
 * Maps the decoded byte range [start, end] (inclusive, already clamped to the
 * decoded length) to the upstream window to request. The window starts on the
 * stripe holding upstream byte start + pad and runs to the end of the stripe
 * holding end + pad, so every encrypted stripe in it is complete.
 */
export function planUpstreamWindow(
	start: number,
	end: number,
	pad: number,
	upstreamLength: number
): UpstreamWindow {
	const upStart = start + pad;
	const upEnd = end + pad;
	const alignedStart = Math.floor(upStart / STRIPE_SIZE) * STRIPE_SIZE;
	const alignedEnd = Math.min(
		(Math.floor(upEnd / STRIPE_SIZE) + 1) * STRIPE_SIZE - 1,
		upstreamLength - 1
	);
	return {
		start: alignedStart,
		end: alignedEnd,
		firstStripeIndex: alignedStart / STRIPE_SIZE,
		skip: upStart - alignedStart,
		take: end - start + 1,
	};
}

export interface StripeDecoder {
	/** Feeds upstream bytes; returns the decoded bytes of every stripe completed so far (may be empty). */
	push(chunk: Uint8Array): Buffer;
	/** Returns the trailing partial stripe, which Deezer leaves unencrypted. */
	end(): Buffer;
}

const EMPTY = Buffer.alloc(0);

/**
 * Stateful stripe decoder for an upstream window that starts on a stripe
 * boundary. `firstStripeIndex` is the index of the window's first stripe in
 * the whole file, so the encrypted ones stay the file's stripes 0, 3, 6, ...
 * `decrypt` null = plain (non-encrypted) URL, bytes pass through.
 */
export function createStripeDecoder(
	decrypt: StripeDecryptor | null,
	firstStripeIndex = 0
): StripeDecoder {
	let index = firstStripeIndex;
	let pending: Buffer = EMPTY;

	return {
		push(chunk) {
			if (chunk.length === 0) return EMPTY;
			const input: Buffer =
				pending.length === 0
					? Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
					: Buffer.concat([pending, chunk]);
			const full = input.length - (input.length % STRIPE_SIZE);
			if (full === 0) {
				pending = Buffer.from(input);
				return EMPTY;
			}
			const out = Buffer.allocUnsafe(full);
			for (let off = 0; off < full; off += STRIPE_SIZE) {
				const stripe = input.subarray(off, off + STRIPE_SIZE);
				if (decrypt && isEncryptedStripe(index)) {
					decrypt(stripe).copy(out, off);
				} else {
					stripe.copy(out, off);
				}
				index++;
			}
			// Copy the remainder so the (possibly large) input chunk can be freed.
			pending = full === input.length ? EMPTY : Buffer.from(input.subarray(full));
			return out;
		},
		end() {
			const tail = pending;
			pending = EMPTY;
			return tail;
		},
	};
}

export interface ByteWindow {
	/** Drops the first `skip` bytes overall, then lets through at most `take` bytes. */
	push(buf: Buffer): Buffer;
	/** True once `take` bytes went through. */
	readonly done: boolean;
	/** Bytes let through so far. */
	readonly emitted: number;
}

/** Head/tail trimmer over a byte stream. `take` may be Infinity (unknown length). */
export function createByteWindow(skip: number, take: number): ByteWindow {
	let toSkip = skip;
	let emitted = 0;
	return {
		push(buf) {
			if (emitted >= take || buf.length === 0) return EMPTY;
			let out = buf;
			if (toSkip > 0) {
				const n = Math.min(toSkip, out.length);
				toSkip -= n;
				out = out.subarray(n);
			}
			const room = take - emitted;
			if (out.length > room) out = out.subarray(0, room);
			emitted += out.length;
			return out;
		},
		get done() {
			return emitted >= take;
		},
		get emitted() {
			return emitted;
		},
	};
}

/**
 * Settles like `promise`, or rejects with `onTimeout()` when it has not
 * settled within `ms` (no timeout when ms is not a positive finite number).
 * A late rejection of `promise` is swallowed — its owner tears it down.
 */
export function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	onTimeout: () => Error
): Promise<T> {
	if (!(ms > 0) || !Number.isFinite(ms)) return promise;
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(onTimeout()), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(err) => {
				clearTimeout(timer);
				reject(err);
			}
		);
	});
}

const NOTHING_READY = Symbol("nothing-ready");

function nextMacrotask(): Promise<typeof NOTHING_READY> {
	return new Promise((resolve) => setImmediate(() => resolve(NOTHING_READY)));
}

/**
 * Coalesces a byte stream into chunks of about `target` bytes. A chunk is
 * emitted as soon as `target` bytes are buffered, or earlier whenever the
 * source has nothing more ready right now (its next value does not arrive
 * before the next macrotask) — so a slow source adds no latency while a fast
 * one yields few large chunks instead of thousands of 2 KiB stripes.
 */
export async function* coalesceChunks(
	source: AsyncIterable<Buffer>,
	target = 64 * 1024
): AsyncGenerator<Buffer, void, undefined> {
	const it = source[Symbol.asyncIterator]();
	let pending: Promise<IteratorResult<Buffer>> | null = null;
	let parts: Buffer[] = [];
	let size = 0;
	const flush = (): Buffer => {
		const out = parts.length === 1 ? parts[0] : Buffer.concat(parts, size);
		parts = [];
		size = 0;
		return out;
	};

	let completed = false;
	try {
		for (;;) {
			pending ??= it.next();
			const r = size === 0 ? await pending : await Promise.race([pending, nextMacrotask()]);
			if (r === NOTHING_READY) {
				yield flush();
				continue;
			}
			pending = null;
			if (r.done) break;
			if (r.value.length === 0) continue;
			parts.push(r.value);
			size += r.value.length;
			if (size >= target) yield flush();
		}
		completed = true;
		if (size > 0) yield flush();
	} finally {
		if (pending) pending.catch(() => {});
		if (!completed) {
			const ret = it.return?.();
			if (ret) ret.catch(() => {});
		}
	}
}

/** Small LRU map with a per-entry TTL and a size bound. */
export class BoundedTtlCache<V> {
	private readonly store = new Map<string, { value: V; expiresAt: number }>();

	constructor(
		private readonly maxEntries: number,
		private readonly ttlMs: number,
		private readonly now: () => number = Date.now
	) {}

	get(key: string): V | undefined {
		const entry = this.store.get(key);
		if (!entry) return undefined;
		if (this.now() >= entry.expiresAt) {
			this.store.delete(key);
			return undefined;
		}
		this.store.delete(key);
		this.store.set(key, entry);
		return entry.value;
	}

	set(key: string, value: V): void {
		this.store.delete(key);
		while (this.store.size >= this.maxEntries) {
			const oldest = this.store.keys().next().value;
			if (oldest === undefined) break;
			this.store.delete(oldest);
		}
		this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
	}

	delete(key: string): void {
		this.store.delete(key);
	}

	clear(): void {
		this.store.clear();
	}

	get size(): number {
		return this.store.size;
	}
}
