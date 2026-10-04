// Shared HTTP policy for every request this client sends to Deezer (gw-light,
// api.deezer.com, media.deezer.com get_url, login): explicit timeouts, bounded
// retries with jittered exponential backoff, and log redaction.
//
// got has no default timeout, so without these a stalled Deezer socket held a
// request until the function's maxDuration. got's own retry is switched off
// (`retry: { limit: 0 }`) so the only retries are the bounded ones below.

import { errorSummary } from "@/lib/log-safe";
import { DeezerNetworkError } from "./errors";

/** A current desktop Chrome UA (Deezer serves the web player to it). */
export const DEEZER_USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";

/** got `timeout` option for Deezer requests, in ms. `request` caps the whole call. */
export const DEEZER_TIMEOUT = {
	lookup: 5_000,
	connect: 5_000,
	secureConnect: 5_000,
	send: 10_000,
	response: 10_000,
	request: 20_000,
} as const;

/** Spread into every got call to Deezer. */
export const DEEZER_REQUEST_OPTIONS = {
	timeout: DEEZER_TIMEOUT,
	retry: { limit: 0 },
} as const;

/** At most this many retries after the first attempt. */
export const DEEZER_MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 4_000;

/** Indirection so tests can skip the real backoff waits. */
export const deezerHttp = {
	sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
	random: () => Math.random(),
};

/** Exponential backoff with equal jitter: attempt 0 → 250-500 ms, 1 → 500-1000 ms, … */
export function backoffDelay(attempt: number, baseMs = BASE_DELAY_MS, maxMs = MAX_DELAY_MS): number {
	const ceiling = Math.min(maxMs, baseMs * 2 ** attempt);
	return Math.round(ceiling / 2 + deezerHttp.random() * (ceiling / 2));
}

const TRANSIENT_CODES = new Set([
	"ECONNABORTED",
	"ECONNREFUSED",
	"ECONNRESET",
	"ENETRESET",
	"ETIMEDOUT",
	"ESOCKETTIMEDOUT",
	"EPIPE",
	"EAI_AGAIN",
	"ENOTFOUND",
	"ENETUNREACH",
	"EHOSTUNREACH",
]);

// Failures that happen before the request leaves this process: retrying them
// can never apply a write twice.
const PRE_SEND_CODES = new Set(["ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND", "ENETUNREACH", "EHOSTUNREACH"]);
const PRE_SEND_TIMEOUT_EVENTS = new Set(["lookup", "connect", "secureConnect"]);

const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);

interface ErrorLike {
	name?: string;
	code?: string;
	event?: string;
	response?: { statusCode?: number };
}

function statusOf(e: ErrorLike): number | undefined {
	return e?.response?.statusCode;
}

/**
 * A network-level failure (reset, refused, DNS, timeout) or a gateway /
 * overload status from Deezer — worth retrying, and never proof that a
 * resource is unavailable.
 */
export function isTransientNetworkError(e: unknown): boolean {
	if (e instanceof DeezerNetworkError) return true;
	const err = e as ErrorLike;
	if (!err || typeof err !== "object") return false;
	if (err.name === "TimeoutError" || err.name === "ReadError") return true;
	if (err.code && TRANSIENT_CODES.has(err.code)) return true;
	const status = statusOf(err);
	return status !== undefined && TRANSIENT_STATUS.has(status);
}

/** True when the request provably never reached Deezer (safe to retry a write). */
export function isPreSendError(e: unknown): boolean {
	const err = e as ErrorLike;
	if (!err || typeof err !== "object") return false;
	if (err.name === "TimeoutError" && err.event && PRE_SEND_TIMEOUT_EVENTS.has(err.event)) return true;
	return !!err.code && PRE_SEND_CODES.has(err.code);
}

/**
 * Wraps a got/socket failure in a DeezerNetworkError (keeps code + status).
 * The got error itself is not kept: its enumerable `options` hold the request
 * (license_token in the JSON body, the cookie jar with the ARL), and its
 * message the full URL, so it must never reach a log line.
 */
export function toDeezerNetworkError(what: string, e: unknown): DeezerNetworkError {
	if (e instanceof DeezerNetworkError) return e;
	const err = e as ErrorLike;
	return new DeezerNetworkError(`${what}: ${errorSummary(e)}`, {
		code: err?.code,
		status: statusOf(err),
	});
}

/**
 * Runs `fn`, retrying at most `retries` times while `shouldRetry(error)` holds,
 * with jittered exponential backoff between attempts. The last error is
 * rethrown unchanged.
 */
export async function withRetry<T>(
	fn: (attempt: number) => Promise<T>,
	shouldRetry: (e: unknown) => boolean = isTransientNetworkError,
	retries = DEEZER_MAX_RETRIES
): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			return await fn(attempt);
		} catch (e) {
			if (attempt >= retries || !shouldRetry(e)) throw e;
			await deezerHttp.sleep(backoffDelay(attempt));
		}
	}
}

const SECRET_KEYS = new Set([
	"access_token",
	"api_token",
	"arl",
	"checkform",
	"checkformlogin",
	"license_token",
	"password",
	"recaptchatoken",
	"track_tokens",
	"track_token",
	"token",
	"sid",
]);

/** Copy of `value` with secret-looking keys masked, safe to log. */
export function redactForLog(value: unknown, depth = 0): unknown {
	if (value === null || typeof value !== "object" || depth > 4) return value;
	if (Array.isArray(value)) return value.map((v) => redactForLog(v, depth + 1));
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		out[k] = SECRET_KEYS.has(k.toLowerCase()) ? "[redacted]" : redactForLog(v, depth + 1);
	}
	return out;
}
