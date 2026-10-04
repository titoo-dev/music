// Typed failures of the decrypted Deezer stream (decryption.ts). Callers map
// them to HTTP answers: anything thrown by openDecryptedStream / probeTrack
// happens before a byte was emitted, anything the readable errors with
// happens mid-body (the response is already committed — just tear down and
// never persist a partial file).

/** Base class of every error raised by the decrypted-stream layer. */
export class DeezerStreamError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DeezerStreamError";
	}
}

/** The CDN answered with a non-2xx status (403 expired token, 404, 416, 5xx). Never retried. */
export class UpstreamHttpError extends DeezerStreamError {
	readonly statusCode: number;
	constructor(statusCode: number) {
		super(`Deezer CDN answered HTTP ${statusCode}`);
		this.name = "UpstreamHttpError";
		this.statusCode = statusCode;
	}
}

/**
 * The upstream body ended before every byte announced by Content-Length /
 * Content-Range arrived. The decoded output is incomplete: never persist it.
 */
export class TruncatedStreamError extends DeezerStreamError {
	readonly expected: number;
	readonly received: number;
	constructor(expected: number, received: number) {
		super(`Deezer CDN stream ended after ${received} of ${expected} bytes`);
		this.name = "TruncatedStreamError";
		this.expected = expected;
		this.received = received;
	}
}

export type UpstreamTimeoutPhase = "connect" | "response" | "idle";

/**
 * The CDN went silent: "connect" (DNS / TCP / TLS / request write),
 * "response" (no response headers), or "idle" (no body byte while one was
 * awaited for `timeoutMs`).
 */
export class UpstreamTimeoutError extends DeezerStreamError {
	readonly phase: UpstreamTimeoutPhase;
	readonly timeoutMs: number | null;
	constructor(phase: UpstreamTimeoutPhase, timeoutMs: number | null) {
		super(
			timeoutMs == null
				? `Deezer CDN timed out (${phase})`
				: `Deezer CDN timed out (${phase}, ${timeoutMs} ms)`
		);
		this.name = "UpstreamTimeoutError";
		this.phase = phase;
		this.timeoutMs = timeoutMs;
	}
}

/** The CDN ignored a Range request (200 + whole file). Fall back to a full stream. */
export class RangeNotSupportedError extends DeezerStreamError {
	constructor() {
		super("Deezer CDN does not honour Range requests for this file");
		this.name = "RangeNotSupportedError";
	}
}

/**
 * The requested decoded range is empty or starts at / past the end of the
 * track. `totalLength` is the decoded size, for "Content-Range: bytes * /total".
 */
export class RangeNotSatisfiableError extends DeezerStreamError {
	readonly totalLength: number | null;
	constructor(totalLength: number | null) {
		super("Requested range is not satisfiable");
		this.name = "RangeNotSatisfiableError";
		this.totalLength = totalLength;
	}
}

/** The CDN's answer does not match the request (another window, changed size, no length). Never retried. */
export class UpstreamProtocolError extends DeezerStreamError {
	constructor(message: string) {
		super(message);
		this.name = "UpstreamProtocolError";
	}
}

/** The caller aborted (abort() or its AbortSignal) before the stream was open. */
export class StreamAbortedError extends DeezerStreamError {
	constructor() {
		super("Deezer stream aborted");
		this.name = "StreamAbortedError";
	}
}
