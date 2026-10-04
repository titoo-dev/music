import got, { TimeoutError } from "got";
import { Readable } from "stream";
import { TrackFormats } from "@/lib/deezer";
import {
	_md5,
	_ecbCrypt,
	generateBlowfishKey,
	createStripeDecryptor,
	type StripeDecryptor,
} from "./utils/crypto";
import { USER_AGENT_HEADER } from "./utils/core";
import {
	STRIPE_SIZE,
	BoundedTtlCache,
	coalesceChunks,
	computePad,
	createByteWindow,
	createStripeDecoder,
	parseContentLength,
	parseContentRange,
	planUpstreamWindow,
	withTimeout,
	type StripeDecoder,
} from "./stripe";
import {
	RangeNotSatisfiableError,
	RangeNotSupportedError,
	StreamAbortedError,
	TruncatedStreamError,
	UpstreamHttpError,
	UpstreamProtocolError,
	UpstreamTimeoutError,
} from "./stream-errors";

export function generateStreamPath(sngID, md5, mediaVersion, format) {
	let urlPart = md5 + "\xA4" + format + "\xA4" + sngID + "\xA4" + mediaVersion;
	const md5val = _md5(urlPart);
	let step2 = md5val + "\xA4" + urlPart + "\xA4";
	step2 += ".".repeat(16 - (step2.length % 16));
	urlPart = _ecbCrypt("jo6aey6haid2Teih", step2);
	return urlPart;
}

export function generateCryptedStreamURL(sngID, md5, mediaVersion, format) {
	const urlPart = generateStreamPath(sngID, md5, mediaVersion, format);
	return "https://e-cdns-proxy-" + md5[0] + ".dzcdn.net/mobile/1/" + urlPart;
}

// ─────────────────────────────────────────────────────────────────────────────
// Decrypted Deezer stream: opens the CDN file (whole, or a byte range of the
// DECODED audio), decrypts BF_CBC_STRIPE on the fly and exposes the decoded
// bytes as a Node Readable, so callers can forward them to a client and
// persist them in parallel (stream-while-download). Stripe maths: ./stripe.ts.
//
// Usage (progressive-stream.ts / routes):
//   Full, persisting play
//     const s = await openDecryptedStream(track, { signal });
//     s.totalLength   → Content-Length (null when the CDN sent no length)
//     s.rangeSupported→ the CDN honours Range (Accept-Ranges: bytes)
//     s.readable      → decoded bytes; errors mid-body with TruncatedStreamError
//                       / UpstreamTimeoutError → never persist on error
//   Live byte range (seek), never persisted
//     const s = await openDecryptedStream(track, { start, end, signal });
//     206, Content-Range: bytes ${s.start}-${s.end}/${s.totalLength},
//     Content-Length: s.contentLength. RangeNotSupportedError → fall back to a
//     full 200 stream; RangeNotSatisfiableError → 416 (err.totalLength).
//   Cheap check: probeTrack(track) (cached) → { decodedLength, rangeSupported }.
// Everything thrown by openDecryptedStream happens before a byte is emitted;
// the initial request is retried once on a network error / timeout.
// ─────────────────────────────────────────────────────────────────────────────

export {
	DeezerStreamError,
	UpstreamHttpError,
	TruncatedStreamError,
	UpstreamTimeoutError,
	RangeNotSupportedError,
	RangeNotSatisfiableError,
	UpstreamProtocolError,
	StreamAbortedError,
} from "./stream-errors";
export type { UpstreamTimeoutPhase } from "./stream-errors";

export interface ProgressiveStream {
	readable: Readable;
	contentType: string;
	contentLengthPromise: Promise<number>;
	abort: () => void;
}

export function inferContentTypeFromBitrate(bitrate: number): string {
	if (bitrate === TrackFormats.FLAC) return "audio/flac";
	if (
		bitrate === TrackFormats.MP4_RA1 ||
		bitrate === TrackFormats.MP4_RA2 ||
		bitrate === TrackFormats.MP4_RA3
	) {
		return "audio/mp4";
	}
	return "audio/mpeg";
}

/** The fields of a resolved Track the decoder needs. */
export interface DecryptableTrack {
	/** Deezer track id: seeds the Blowfish key. */
	id: string | number;
	/** CDN URL of the file; "/media/" and "/mobile/" URLs are BF_CBC_STRIPE-encrypted. */
	downloadURL: string;
	/** TrackFormats value: picks the content type and keys the probe cache. */
	bitrate: string | number;
}

export interface UpstreamRequest {
	url: string;
	/** Inclusive upstream byte range, sent as "Range: bytes=start-end" (end omitted = to the end). */
	range: { start: number; end?: number };
	/** Aborted when the caller gives up: the fetcher must tear the request down. */
	signal: AbortSignal;
}

export interface UpstreamResponse {
	statusCode: number;
	/** Lower-cased names; only content-length and content-range are read. */
	headers: Record<string, string | undefined>;
	body: AsyncIterable<Uint8Array>;
	/** Tears the connection down. Idempotent. */
	destroy(): void;
}

/**
 * The HTTP seam: resolves once response headers arrive, rejects on network
 * errors / connect timeouts. Tests inject a fake; production uses got.
 */
export type UpstreamFetcher = (req: UpstreamRequest) => Promise<UpstreamResponse>;

/** got per-phase timeouts of a CDN request (before the body). */
export const CDN_TIMEOUTS_MS = {
	lookup: 5_000,
	connect: 5_000,
	secureConnect: 5_000,
	send: 5_000,
	response: 10_000,
} as const;
/** No body byte for this long while one is awaited → UpstreamTimeoutError("idle"). */
export const CDN_IDLE_TIMEOUT_MS = 15_000;
/** Backstop on any fetcher: no response headers for this long → UpstreamTimeoutError("response"). */
export const CDN_HEADERS_TIMEOUT_MS = 30_000;
/** Target size of the coalesced chunks after the first stripe. */
export const STREAM_CHUNK_BYTES = 64 * 1024;

function firstHeader(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

function fromGotError(err: unknown): unknown {
	if (err instanceof TimeoutError) {
		return new UpstreamTimeoutError(err.event === "response" ? "response" : "connect", null);
	}
	return err;
}

/**
 * got-based fetcher with per-phase timeouts (CDN_TIMEOUTS_MS, overridable)
 * and no automatic retry (openDecryptedStream retries the initial request).
 */
export function createGotUpstreamFetcher(
	timeouts: Partial<Record<keyof typeof CDN_TIMEOUTS_MS, number>> = {}
): UpstreamFetcher {
	return (req) => gotFetch(req, { ...CDN_TIMEOUTS_MS, ...timeouts });
}

function gotFetch(
	req: UpstreamRequest,
	timeouts: Record<keyof typeof CDN_TIMEOUTS_MS, number>
): Promise<UpstreamResponse> {
	return new Promise<UpstreamResponse>((resolve, reject) => {
		if (req.signal.aborted) {
			reject(new StreamAbortedError());
			return;
		}
		const { start, end } = req.range;
		const stream = got.stream(req.url, {
			headers: {
				"User-Agent": USER_AGENT_HEADER,
				Range: `bytes=${start}-${end ?? ""}`,
			},
			timeout: timeouts,
			retry: { limit: 0 },
			throwHttpErrors: false,
			// No Accept-Encoding: byte offsets must be offsets of the file itself.
			decompress: false,
		});
		let settled = false;
		const onAbort = () => {
			stream.destroy();
			if (!settled) {
				settled = true;
				reject(new StreamAbortedError());
			}
		};
		req.signal.addEventListener("abort", onAbort, { once: true });
		// Kept for the stream's lifetime: later errors surface through the body
		// iterator instead of as an unhandled 'error' event.
		stream.on("error", (err) => {
			if (settled) return;
			settled = true;
			req.signal.removeEventListener("abort", onAbort);
			reject(fromGotError(err));
		});
		stream.once("response", (res: { statusCode: number; headers: Record<string, string | string[] | undefined> }) => {
			if (settled) return;
			settled = true;
			resolve({
				statusCode: res.statusCode,
				headers: {
					"content-length": firstHeader(res.headers["content-length"]),
					"content-range": firstHeader(res.headers["content-range"]),
				},
				body: stream,
				destroy: () => stream.destroy(),
			});
		});
	});
}

/** Production fetcher (got, CDN_TIMEOUTS_MS). */
export const gotUpstreamFetcher: UpstreamFetcher = createGotUpstreamFetcher();

export function isCryptedStreamUrl(url: string): boolean {
	return url.includes("/mobile/") || url.includes("/media/");
}

export interface TrackProbe {
	/** Size of the encrypted file on the CDN; null when the CDN sent no length. */
	upstreamLength: number | null;
	/** Leading zero bytes the depadder strips from the first stripe (0 for MP4 or a non-zero first byte). */
	pad: number;
	/** Decoded size, upstreamLength - pad; null when unknown. */
	decodedLength: number | null;
	/** The CDN answered a Range request with 206. */
	rangeSupported: boolean;
}

export interface StreamTransportOptions {
	signal?: AbortSignal;
	/** HTTP layer; defaults to gotUpstreamFetcher. */
	fetcher?: UpstreamFetcher;
	/** Default CDN_IDLE_TIMEOUT_MS. */
	idleTimeoutMs?: number;
	/** Default CDN_HEADERS_TIMEOUT_MS. */
	headersTimeoutMs?: number;
}

const PROBE_CACHE_MAX_ENTRIES = 2_000;
const PROBE_CACHE_TTL_MS = 60 * 60 * 1000;
const probeCache = new BoundedTtlCache<TrackProbe>(PROBE_CACHE_MAX_ENTRIES, PROBE_CACHE_TTL_MS);

function probeKey(track: DecryptableTrack): string {
	return `${track.id}:${track.bitrate}`;
}

/** Cached probe of this track+format, if any (no network). */
export function getCachedProbe(track: DecryptableTrack): TrackProbe | null {
	return probeCache.get(probeKey(track)) ?? null;
}

/** Test hook. */
export function clearProbeCache(): void {
	probeCache.clear();
}

function makeProbe(upstreamLength: number | null, pad: number, rangeSupported: boolean): TrackProbe {
	return {
		upstreamLength,
		pad,
		decodedLength: upstreamLength == null ? null : Math.max(0, upstreamLength - pad),
		rangeSupported,
	};
}

interface Transport {
	url: string;
	decrypt: StripeDecryptor | null;
	fetcher: UpstreamFetcher;
	signal: AbortSignal;
	idleMs: number;
	headersMs: number;
}

function makeTransport(
	track: DecryptableTrack,
	opts: StreamTransportOptions,
	signal: AbortSignal
): Transport {
	return {
		url: track.downloadURL,
		decrypt: isCryptedStreamUrl(track.downloadURL)
			? createStripeDecryptor(generateBlowfishKey(String(track.id)))
			: null,
		fetcher: opts.fetcher ?? gotUpstreamFetcher,
		signal,
		idleMs: opts.idleTimeoutMs ?? CDN_IDLE_TIMEOUT_MS,
		headersMs: opts.headersTimeoutMs ?? CDN_HEADERS_TIMEOUT_MS,
	};
}

async function fetchUpstream(t: Transport, range: UpstreamRequest["range"]): Promise<UpstreamResponse> {
	if (t.signal.aborted) throw new StreamAbortedError();
	const pending = t.fetcher({ url: t.url, range, signal: t.signal });
	let onAbort: () => void = () => {};
	const aborted = new Promise<never>((_, reject) => {
		onAbort = () => reject(new StreamAbortedError());
		t.signal.addEventListener("abort", onAbort, { once: true });
	});
	aborted.catch(() => {});
	try {
		return await withTimeout(
			Promise.race([pending, aborted]),
			t.headersMs,
			() => new UpstreamTimeoutError("response", t.headersMs)
		);
	} catch (e) {
		// A response that shows up after a timeout / abort must not leak a socket.
		pending.then((res) => res.destroy(), () => {});
		throw e;
	} finally {
		t.signal.removeEventListener("abort", onAbort);
	}
}

function readIdle(t: Transport, it: AsyncIterator<Uint8Array>): Promise<IteratorResult<Uint8Array>> {
	return withTimeout(it.next(), t.idleMs, () => new UpstreamTimeoutError("idle", t.idleMs));
}

interface OpenedUpstream {
	res: UpstreamResponse;
	it: AsyncIterator<Uint8Array>;
	/** The CDN answered 206. */
	partial: boolean;
	upstreamLength: number | null;
	/** Bytes the body must deliver (Content-Length / Content-Range); null = unknown. */
	expected: number | null;
	received: number;
	decoder: StripeDecoder;
	/** Decoded bytes read so far: at least the first stripe, unless the body ended. */
	decoded: Buffer;
	ended: boolean;
}

/**
 * Sends one CDN request and reads until the window's first stripe is decoded.
 * Tears the response down on any error.
 */
async function openUpstream(
	t: Transport,
	range: UpstreamRequest["range"],
	firstStripeIndex: number,
	requirePartial: boolean
): Promise<OpenedUpstream> {
	const res = await fetchUpstream(t, range);
	try {
		let partial: boolean;
		let upstreamLength: number | null;
		let expected: number | null;
		if (res.statusCode === 206) {
			const cr = parseContentRange(res.headers["content-range"]);
			if (!cr) {
				throw new UpstreamProtocolError(
					`206 without a usable Content-Range (${res.headers["content-range"]})`
				);
			}
			if (cr.start !== range.start) {
				throw new UpstreamProtocolError(`asked for bytes from ${range.start}, got ${cr.start}`);
			}
			const lastWanted = cr.total == null ? range.end : Math.min(range.end ?? cr.total - 1, cr.total - 1);
			if (lastWanted != null && cr.end < lastWanted) {
				throw new UpstreamProtocolError(`asked for bytes up to ${lastWanted}, got ${cr.end}`);
			}
			partial = true;
			upstreamLength = cr.total;
			expected = cr.end - cr.start + 1;
		} else if (res.statusCode === 200) {
			if (requirePartial) throw new RangeNotSupportedError();
			partial = false;
			upstreamLength = parseContentLength(res.headers["content-length"]);
			expected = upstreamLength;
		} else {
			throw new UpstreamHttpError(res.statusCode);
		}

		const it = res.body[Symbol.asyncIterator]();
		const decoder = createStripeDecoder(t.decrypt, firstStripeIndex);
		const parts: Buffer[] = [];
		let decodedBytes = 0;
		let received = 0;
		let ended = false;
		while (decodedBytes < STRIPE_SIZE) {
			const r = await readIdle(t, it);
			if (r.done) {
				ended = true;
				break;
			}
			received += r.value.length;
			const out = decoder.push(r.value);
			if (out.length > 0) {
				parts.push(out);
				decodedBytes += out.length;
			}
		}
		if (ended) {
			if (expected != null && received < expected) {
				throw new TruncatedStreamError(expected, received);
			}
			const tail = decoder.end();
			if (tail.length > 0) parts.push(tail);
		}
		return {
			res,
			it,
			partial,
			upstreamLength,
			expected,
			received,
			decoder,
			decoded: Buffer.concat(parts),
			ended,
		};
	} catch (e) {
		res.destroy();
		throw e;
	}
}

function isRetryable(e: unknown): boolean {
	return !(
		e instanceof UpstreamHttpError ||
		e instanceof UpstreamProtocolError ||
		e instanceof RangeNotSupportedError ||
		e instanceof RangeNotSatisfiableError ||
		e instanceof StreamAbortedError
	);
}

/** Runs `attempt`, once more on a network error / timeout / early end (nothing emitted yet). */
async function withOneRetry<T>(t: Transport, attempt: () => Promise<T>): Promise<T> {
	try {
		return await attempt();
	} catch (e) {
		if (t.signal.aborted || !isRetryable(e)) throw e;
		return attempt();
	}
}

async function probeOnce(t: Transport): Promise<TrackProbe> {
	const up = await openUpstream(t, { start: 0, end: STRIPE_SIZE - 1 }, 0, false);
	up.res.destroy();
	return makeProbe(up.upstreamLength, computePad(up.decoded.subarray(0, STRIPE_SIZE)), up.partial);
}

/**
 * Learns the upstream size, the depad length and whether the CDN honours
 * Range, from one request for the first stripe (bytes 0-2047). Results are
 * cached in memory per trackId+format (bounded, 1 h TTL; full streams opened
 * with openDecryptedStream fill the cache too). `fresh` skips the cache.
 * Never emits audio; retries once on a network error.
 */
export async function probeTrack(
	track: DecryptableTrack,
	opts: StreamTransportOptions & { fresh?: boolean } = {}
): Promise<TrackProbe> {
	const key = probeKey(track);
	if (!opts.fresh) {
		const hit = probeCache.get(key);
		if (hit) return hit;
	}
	const t = makeTransport(track, opts, opts.signal ?? new AbortController().signal);
	try {
		const probe = await withOneRetry(t, () => probeOnce(t));
		probeCache.set(key, probe);
		return probe;
	} catch (e) {
		if (t.signal.aborted) throw new StreamAbortedError();
		throw e;
	}
}

export interface OpenDecryptedStreamOptions extends StreamTransportOptions {
	/** First decoded byte to emit (inclusive). Default 0. */
	start?: number;
	/** Last decoded byte to emit (inclusive), clamped to the end. Default: the end. */
	end?: number;
	/** Known probe of this track (skips the probe request of a range open). */
	probe?: TrackProbe;
	/** Coalesced chunk size after the first stripe. Default STREAM_CHUNK_BYTES. */
	chunkBytes?: number;
}

export interface DecryptedStream {
	/** Decoded audio. First chunk = the first stripe (fast first byte), then ~64 KiB chunks. */
	readable: Readable;
	contentType: string;
	/** First decoded byte emitted. */
	start: number;
	/** Last decoded byte emitted (inclusive); null when the length is unknown or the track is empty. */
	end: number | null;
	/** Bytes `readable` will emit; null when unknown. */
	contentLength: number | null;
	/** Decoded size of the whole track; null when unknown. */
	totalLength: number | null;
	/** Size of the encrypted file on the CDN; null when unknown. */
	upstreamLength: number | null;
	/** The CDN answered with 206 (it honours Range). */
	rangeSupported: boolean;
	/** Closes the CDN connection and destroys `readable` (no error). Idempotent. */
	abort(): void;
}

function linkAbort(signal: AbortSignal | undefined, onAbort: () => void): () => void {
	if (!signal) return () => {};
	if (signal.aborted) {
		onAbort();
		return () => {};
	}
	signal.addEventListener("abort", onAbort, { once: true });
	return () => signal.removeEventListener("abort", onAbort);
}

/**
 * Opens the decoded track, whole (no start / end) or the decoded byte range
 * [start, end]. Resolves once the CDN answered and the first stripe of the
 * window is decoded, so totalLength is known for a full stream; rejects
 * (before any byte is emitted) with UpstreamHttpError, UpstreamTimeoutError,
 * TruncatedStreamError, RangeNotSupportedError, RangeNotSatisfiableError,
 * UpstreamProtocolError, StreamAbortedError or a network error. The initial
 * request is retried once on a network error / timeout; never mid-body.
 * Mid-body, `readable` errors with TruncatedStreamError (body shorter than
 * announced) or UpstreamTimeoutError("idle").
 */
export async function openDecryptedStream(
	track: DecryptableTrack,
	opts: OpenDecryptedStreamOptions = {}
): Promise<DecryptedStream> {
	const controller = new AbortController();
	let abortedByCaller = false;
	let readable: Readable | null = null;
	const unlink = linkAbort(opts.signal, () => {
		abortedByCaller = true;
		controller.abort();
		readable?.destroy();
	});
	const t = makeTransport(track, opts, controller.signal);
	const key = probeKey(track);
	const start = opts.start ?? 0;

	let up: OpenedUpstream;
	let skip: number;
	let take: number;
	let meta: Omit<DecryptedStream, "readable" | "abort" | "contentType">;
	try {
		if (start === 0 && opts.end == null) {
			up = await withOneRetry(t, () => openUpstream(t, { start: 0 }, 0, false));
			const probe = makeProbe(
				up.upstreamLength,
				computePad(up.decoded.subarray(0, STRIPE_SIZE)),
				up.partial
			);
			if (probe.upstreamLength != null) probeCache.set(key, probe);
			skip = probe.pad;
			take = probe.decodedLength ?? Infinity;
			meta = {
				start: 0,
				end: probe.decodedLength ? probe.decodedLength - 1 : null,
				contentLength: probe.decodedLength,
				totalLength: probe.decodedLength,
				upstreamLength: probe.upstreamLength,
				rangeSupported: up.partial,
			};
		} else {
			const probe = opts.probe ?? (await probeTrack(track, { ...opts, signal: controller.signal }));
			if (!probe.rangeSupported || probe.decodedLength == null) throw new RangeNotSupportedError();
			const total = probe.decodedLength;
			const end = Math.min(opts.end ?? total - 1, total - 1);
			if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= total || end < start) {
				throw new RangeNotSatisfiableError(total);
			}
			const w = planUpstreamWindow(start, end, probe.pad, probe.upstreamLength);
			try {
				up = await withOneRetry(t, () =>
					openUpstream(t, { start: w.start, end: w.end }, w.firstStripeIndex, true)
				);
			} catch (e) {
				if (e instanceof RangeNotSupportedError) probeCache.set(key, { ...probe, rangeSupported: false });
				throw e;
			}
			if (up.upstreamLength !== probe.upstreamLength) {
				probeCache.delete(key);
				up.res.destroy();
				throw new UpstreamProtocolError(
					`file size changed since the probe (${probe.upstreamLength} → ${up.upstreamLength})`
				);
			}
			skip = w.skip;
			take = w.take;
			meta = {
				start,
				end,
				contentLength: take,
				totalLength: total,
				upstreamLength: probe.upstreamLength,
				rangeSupported: true,
			};
		}
	} catch (e) {
		controller.abort();
		unlink();
		if (abortedByCaller) throw new StreamAbortedError();
		throw e;
	}
	if (abortedByCaller) {
		up.res.destroy();
		unlink();
		throw new StreamAbortedError();
	}

	const opened = up;
	const window = createByteWindow(skip, take);
	const firstStripe = Math.min(STRIPE_SIZE, opened.decoded.length);
	const first = window.push(opened.decoded.subarray(0, firstStripe));
	const afterFirst = window.push(opened.decoded.subarray(firstStripe));
	let received = opened.received;

	const teardown = () => {
		controller.abort();
		opened.res.destroy();
		unlink();
	};

	async function* remaining(): AsyncGenerator<Buffer, void, undefined> {
		if (afterFirst.length > 0) yield afterFirst;
		if (opened.ended) return;
		while (!window.done) {
			const r = await readIdle(t, opened.it);
			if (r.done) {
				if (opened.expected != null && received < opened.expected) {
					throw new TruncatedStreamError(opened.expected, received);
				}
				const tail = window.push(opened.decoder.end());
				if (tail.length > 0) yield tail;
				break;
			}
			received += r.value.length;
			const out = window.push(opened.decoder.push(r.value));
			if (out.length > 0) yield out;
		}
		if (Number.isFinite(take) && !window.done) {
			throw new TruncatedStreamError(take, window.emitted);
		}
	}

	async function* decoded(): AsyncGenerator<Buffer, void, undefined> {
		try {
			if (first.length > 0) yield first;
			yield* coalesceChunks(remaining(), opts.chunkBytes ?? STREAM_CHUNK_BYTES);
		} finally {
			teardown();
		}
	}

	const out = Readable.from(decoded(), { highWaterMark: 4 });
	// Close the CDN connection as soon as the consumer destroys the stream,
	// not only once the pending read settles.
	const fromDestroy = out._destroy;
	out._destroy = function (err, cb) {
		teardown();
		return fromDestroy.call(this, err, cb);
	};
	readable = out;

	return {
		readable: out,
		contentType: inferContentTypeFromBitrate(Number(track.bitrate)),
		...meta,
		abort: () => {
			teardown();
			out.destroy();
		},
	};
}

/**
 * Legacy shape kept for progressive-stream.ts: opens the whole track
 * immediately and returns synchronously. Delegates to openDecryptedStream;
 * contentLengthPromise resolves with the UPSTREAM (encrypted) Content-Length,
 * or 0 when unknown / on error, as before.
 */
export function streamTrackToReadable(
	track: DecryptableTrack,
	opts: Omit<StreamTransportOptions, "signal"> = {}
): ProgressiveStream {
	const controller = new AbortController();
	const opened = openDecryptedStream(track, { ...opts, signal: controller.signal });
	const contentLengthPromise = opened.then(
		(s) => s.upstreamLength ?? 0,
		() => 0
	);

	async function* body(): AsyncGenerator<Buffer, void, undefined> {
		const s = await opened;
		yield* s.readable as AsyncIterable<Buffer>;
	}

	// The inner stream already reads ahead; keep this one shallow.
	const readable = Readable.from(body(), { highWaterMark: 1 });
	const fromDestroy = readable._destroy;
	readable._destroy = function (err, cb) {
		controller.abort();
		return fromDestroy.call(this, err, cb);
	};
	return {
		readable,
		contentType: inferContentTypeFromBitrate(Number(track.bitrate)),
		contentLengthPromise,
		abort: () => {
			controller.abort();
			readable.destroy();
		},
	};
}
