// Cloudflare R2 over its S3 API, signed with aws4fetch (fetch-based, no SDK).
// Every failure is normalized to StorageNotFoundError / StorageUnavailableError
// so callers can decide between "drop the stale row" and "fall back to live".

import { AwsClient } from "aws4fetch";
import { StorageNotFoundError, StorageUnavailableError } from "./objects";

export interface R2Config {
	accountId: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
}

export function readR2Config(env: NodeJS.ProcessEnv = process.env): R2Config | null {
	const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
	if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
	return {
		accountId: R2_ACCOUNT_ID,
		bucket: R2_BUCKET,
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY,
	};
}

let cached: { signature: string; aws: AwsClient; base: string; bucket: string } | null = null;

function client() {
	const config = readR2Config();
	// Missing config behaves like an outage: reads fall back to live streams
	// instead of deleting rows that are fine once R2 is configured.
	if (!config) throw new StorageUnavailableError(new Error("R2 is not configured (R2_* env vars)"));
	const signature = `${config.accountId}/${config.bucket}/${config.accessKeyId}`;
	if (cached?.signature !== signature) {
		cached = {
			signature,
			aws: new AwsClient({
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
				service: "s3",
				region: "auto",
			}),
			base: `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}`,
			bucket: config.bucket,
		};
	}
	return cached;
}

const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

/** Absolute S3 URL of an object (or of the bucket itself when `key` is empty). */
export function objectUrl(key: string): string {
	const { base } = client();
	return key ? `${base}/${encodeKey(key)}` : base;
}

/** `x-amz-copy-source` value for a server-side copy within the bucket. */
export function copySource(key: string): string {
	return `/${client().bucket}/${encodeKey(key)}`;
}

// A couple of quick retries on 429 / 5xx — enough for a blip, short enough
// that a real outage reaches the live fallback in well under a second.
const RETRY_DELAYS_MS = [50, 150];

/**
 * Signed request; network failures become StorageUnavailableError.
 *
 * Signs with aws4fetch but sends with a plain `fetch(url, init)` carrying the
 * original bytes: handing fetch the signed `Request` makes Next's patched
 * fetch re-stream its body chunked, and R2 rejects a PUT without
 * Content-Length (411 MissingContentLength).
 *
 * The body is never handed to the signer: aws4fetch signs S3 requests with
 * UNSIGNED-PAYLOAD, so the body is not part of the signature, and passing it
 * would only make aws4fetch copy the whole track into a throwaway Request.
 */
export async function r2Fetch(url: string, init: RequestInit = {}): Promise<Response> {
	const { aws } = client();
	try {
		const signed = await aws.sign(url, { ...init, body: undefined });
		for (let attempt = 0; ; attempt++) {
			const res = await fetch(signed.url, {
				method: signed.method,
				headers: signed.headers,
				body: init.body,
				signal: init.signal,
			});
			const retryable = res.status === 429 || res.status >= 500;
			if (!retryable || attempt >= RETRY_DELAYS_MS.length) return res;
			await res.body?.cancel();
			await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
		}
	} catch (e) {
		throw new StorageUnavailableError(e);
	}
}

/**
 * Throws unless `res` is 2xx: 404 → not found; auth, rate-limit and 5xx →
 * unavailable (the object may be fine — a bad token or an outage must never
 * make routes delete rows).
 */
export async function assertOk(res: Response, key: string): Promise<Response> {
	if (res.ok) return res;
	if (res.status === 404) throw new StorageNotFoundError(key);
	const detail = await res.text().catch(() => "");
	const error = new Error(`R2 ${res.status} for ${key}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
	if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
		throw new StorageUnavailableError(error);
	}
	throw error;
}

/** Presigned GET URL the browser can stream directly (Range + CORS enabled). */
export async function presignGet(key: string, expiresIn: number): Promise<string> {
	const { aws } = client();
	const url = new URL(objectUrl(key));
	url.searchParams.set("X-Amz-Expires", String(Math.max(1, Math.min(604_800, Math.round(expiresIn)))));
	const signed = await aws.sign(new Request(url, { method: "GET" }), { aws: { signQuery: true } });
	return signed.url;
}

export function decodeXml(s: string): string {
	return s
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, "&");
}

export interface ListedObject {
	key: string;
	lastModified: Date;
	size: number;
}

/** One page (up to 1000 keys) of ListObjectsV2 under `prefix`. */
export async function listObjectsPage(
	prefix: string,
	continuationToken?: string
): Promise<{ objects: ListedObject[]; nextToken?: string }> {
	const url = new URL(objectUrl(""));
	url.searchParams.set("list-type", "2");
	url.searchParams.set("prefix", prefix);
	if (continuationToken) url.searchParams.set("continuation-token", continuationToken);
	const xml = await (await assertOk(await r2Fetch(url.toString()), prefix)).text();

	const objects: ListedObject[] = [];
	for (const [, block] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
		const key = block.match(/<Key>([^<]*)<\/Key>/)?.[1];
		if (!key) continue;
		objects.push({
			key: decodeXml(key),
			lastModified: new Date(block.match(/<LastModified>([^<]*)<\/LastModified>/)?.[1] ?? 0),
			size: Number(block.match(/<Size>([^<]*)<\/Size>/)?.[1] ?? 0),
		});
	}
	const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
	const next = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1];
	return { objects, nextToken: truncated && next ? decodeXml(next) : undefined };
}

/** Test hook: forget the client so a test can change R2_* env vars. */
export function _resetR2Client() {
	cached = null;
}
