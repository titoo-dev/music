// Short-lived in-memory caches for the public Deezer metadata that a
// progressive persist needs to tag a file. Tracks of the same album are often
// played back to back: without these, each one re-fetched the album (API +
// GW), the album artist and the cover. Values are public (no user token), so
// they are shared across users. Each lookup returns a deep copy: Track /
// Album parsing mutates arrays it receives.

import got from "got";
import { USER_AGENT_HEADER } from "../utils/core";

export const METADATA_TTL_MS = 10 * 60 * 1000;

export class TtlLru<T> {
	private store = new Map<string, { value: T; expiresAt: number }>();

	constructor(
		private readonly maxEntries: number,
		private readonly ttlMs: number
	) {}

	get(key: string): T | undefined {
		const entry = this.store.get(key);
		if (!entry) return undefined;
		if (Date.now() > entry.expiresAt) {
			this.store.delete(key);
			return undefined;
		}
		this.store.delete(key);
		this.store.set(key, entry);
		return entry.value;
	}

	set(key: string, value: T): void {
		this.store.delete(key);
		while (this.store.size >= this.maxEntries) {
			const oldest = this.store.keys().next().value;
			if (oldest === undefined) break;
			this.store.delete(oldest);
		}
		this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
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

const metadata = new TtlLru<Promise<unknown>>(500, METADATA_TTL_MS);

/**
 * `load()` once per `key` for METADATA_TTL_MS (concurrent callers share the
 * in-flight request). Failures are not cached. Returns a deep copy.
 */
export async function cachedMetadata<T>(key: string, load: () => Promise<T>): Promise<T> {
	let pending = metadata.get(key) as Promise<T> | undefined;
	if (!pending) {
		pending = load();
		metadata.set(key, pending);
		const mine = pending;
		mine.catch(() => {
			if (metadata.get(key) === mine) metadata.delete(key);
		});
	}
	return structuredClone(await pending);
}

/** Test hook. */
export function clearMetadataCache(): void {
	metadata.clear();
	covers.clear();
}

const covers = new TtlLru<Buffer>(24, METADATA_TTL_MS);
const COVER_TIMEOUT_MS = 8_000;

/**
 * Cover art bytes for embedding, kept in memory (never written to /tmp).
 * Null on any failure: tagging then goes without a cover.
 */
export async function fetchCoverImage(url: string): Promise<Buffer | null> {
	const hit = covers.get(url);
	if (hit) return hit;
	try {
		const body = await got(url, {
			headers: { "User-Agent": USER_AGENT_HEADER },
			timeout: { request: COVER_TIMEOUT_MS },
			retry: { limit: 1 },
			responseType: "buffer",
		}).buffer();
		if (!body.length) return null;
		covers.set(url, body);
		return body;
	} catch {
		return null;
	}
}
