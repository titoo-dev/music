// Presigned R2 URLs for tracks the server already cached
// (GET /api/v1/stream-url/{id} → { url, contentType, expiresAt }).
//
// Kept free of React / DOM so the cache policy is unit-testable:
//   • a URL is reused until shortly before its own `expiresAt` (contract C1);
//     a server that doesn't send it yet signs for 900 s → 14 min of reuse;
//   • a track whose presigned URL failed is refused *per track* — never a
//     session-wide kill switch;
//   • reset() forgets everything (logout).

/** Where an already-cached copy of a track can be read from (never the persisting stream). */
export interface CachedSource {
	url: string;
	kind: "presigned" | "proxy";
}

export interface PresignedLookup {
	url: string | null;
	/** Server status when url is null ("not_cached", "file_missing", "presigned_disabled", …); "error" when the lookup failed. */
	status?: string;
	/** Epoch ms until which `url` may still be handed out. */
	usableUntil?: number;
}

/** Pre-C1 servers sign for 900 s without saying so: reuse for 14 min. */
export const FALLBACK_TTL_MS = 14 * 60 * 1000;
/** Never hand out a URL with less than this much validity left. */
export const EXPIRY_MARGIN_MS = 60 * 1000;

const MAX_KNOWN_URLS = 256;

/** Statuses that mean "the server holds no readable copy of this track". */
const NOT_CACHED = new Set(["not_cached", "file_missing", "unsupported_storage"]);

export function usableUntilOf(expiresAt: unknown, fetchedAt: number): number {
	if (typeof expiresAt === "string" || typeof expiresAt === "number") {
		const t = typeof expiresAt === "number" ? expiresAt : Date.parse(expiresAt);
		if (Number.isFinite(t)) return t - EXPIRY_MARGIN_MS;
	}
	return fetchedAt + FALLBACK_TTL_MS;
}

export function proxyUrl(trackId: string): string {
	return `/api/v1/stream/${encodeURIComponent(trackId)}`;
}

/**
 * The live stream: persisting by default, `preview` never stores the track,
 * `head` caps a preview at its first bytes, and `probe` (contract C3) only
 * says whether the track is streamable for this user — no audio is opened.
 */
export function progressiveUrl(
	trackId: string,
	opts: { preview?: boolean; head?: boolean; probe?: boolean } = {}
): string {
	const base = `/api/v1/stream-progressive/${encodeURIComponent(trackId)}`;
	if (opts.probe) return `${base}?probe=1`;
	if (!opts.preview) return base;
	return opts.head ? `${base}?preview=1&head=1` : `${base}?preview=1`;
}

export interface PresignedUrls {
	lookup(trackId: string, opts?: { force?: boolean }): Promise<PresignedLookup>;
	/** A usable presigned URL, or null (not cached, refused for this track, lookup failed). */
	get(trackId: string): Promise<string | null>;
	/** Like get() but never fetches. */
	peek(trackId: string): string | null;
	/** When a URL handed out earlier stops being usable (null = not a presigned URL we know). */
	usableUntil(url: string): number | null;
	/** True when `url` is past its usable window — or one we don't know. */
	isExpired(url: string): boolean;
	invalidate(trackId: string): void;
	deny(trackId: string): void;
	isDenied(trackId: string): boolean;
	/** Sign the upcoming tracks ahead of time (cheap: one small JSON call each). */
	warm(trackIds: string[]): void;
	reset(): void;
}

export function createPresignedUrls(deps: { fetchImpl?: typeof fetch; now?: () => number } = {}): PresignedUrls {
	const now = () => (deps.now ?? Date.now)();
	const doFetch = (input: string, init?: RequestInit) => (deps.fetchImpl ?? fetch)(input, init);
	const cache = new Map<string, { url: string; usableUntil: number }>();
	const byUrl = new Map<string, number>();
	const inflight = new Map<string, Promise<PresignedLookup>>();
	const denied = new Set<string>();
	// Bumped by reset(): a lookup started before a logout must not repopulate the cache.
	let epoch = 0;

	const fresh = (trackId: string) => {
		const hit = cache.get(trackId);
		return hit && hit.usableUntil > now() ? hit : null;
	};

	// Expired entries leave the track cache, but their URL stays known in
	// byUrl (capped) so a paused element can still tell its URL expired.
	const prune = () => {
		const t = now();
		for (const [id, e] of cache) if (e.usableUntil <= t) cache.delete(id);
		while (byUrl.size > MAX_KNOWN_URLS) byUrl.delete(byUrl.keys().next().value!);
	};

	async function run(trackId: string, myEpoch: number): Promise<PresignedLookup> {
		try {
			const res = await doFetch(`/api/v1/stream-url/${encodeURIComponent(trackId)}`, {
				credentials: "include",
			});
			if (!res.ok) return { url: null, status: "error" };
			const json = await res.json();
			const data = json?.data ?? {};
			const url = typeof data.url === "string" && data.url ? data.url : null;
			if (!url) return { url: null, status: typeof data.status === "string" ? data.status : "not_cached" };
			const usableUntil = usableUntilOf(data.expiresAt, now());
			if (myEpoch === epoch) {
				cache.set(trackId, { url, usableUntil });
				byUrl.set(url, usableUntil);
			}
			return { url, usableUntil };
		} catch {
			return { url: null, status: "error" };
		}
	}

	const api: PresignedUrls = {
		lookup(trackId, opts = {}) {
			if (!opts.force) {
				const hit = fresh(trackId);
				if (hit) return Promise.resolve({ url: hit.url, usableUntil: hit.usableUntil });
				const pending = inflight.get(trackId);
				if (pending) return pending;
			}
			prune();
			const p: Promise<PresignedLookup> = run(trackId, epoch).finally(() => {
				if (inflight.get(trackId) === p) inflight.delete(trackId);
			});
			inflight.set(trackId, p);
			return p;
		},
		async get(trackId) {
			if (denied.has(trackId)) return null;
			const r = await api.lookup(trackId);
			return denied.has(trackId) ? null : r.url;
		},
		peek(trackId) {
			if (denied.has(trackId)) return null;
			return fresh(trackId)?.url ?? null;
		},
		usableUntil(url) {
			return byUrl.get(url) ?? null;
		},
		isExpired(url) {
			const until = byUrl.get(url);
			return until === undefined || until <= now();
		},
		invalidate(trackId) {
			cache.delete(trackId);
			inflight.delete(trackId);
		},
		deny(trackId) {
			denied.add(trackId);
			api.invalidate(trackId);
		},
		isDenied(trackId) {
			return denied.has(trackId);
		},
		warm(trackIds) {
			for (const id of trackIds) {
				if (denied.has(id) || fresh(id) || inflight.has(id)) continue;
				void api.lookup(id);
			}
		},
		reset() {
			epoch++;
			cache.clear();
			byUrl.clear();
			inflight.clear();
			denied.clear();
		},
	};
	return api;
}

/** The app-wide instance (AudioEngine, prefetch hooks). */
export const presignedUrls = createPresignedUrls();

/**
 * Where to fetch an already-cached copy of a track from — without ever
 * triggering a server-side persist: the presigned R2 URL when there is one,
 * the range-capable proxy (/api/v1/stream/{id}) when the server holds the file
 * but won't sign it (presigned disabled, refused for this track), else null.
 * The proxy is asked with ?prefetch=1 and redirect:"manual", so neither the
 * 404 NOT_CACHED of contract C5 nor the legacy 302 to the persisting
 * /stream-progressive is ever followed.
 */
export async function resolveCachedSource(
	trackId: string,
	deps: { urls?: PresignedUrls; fetchImpl?: typeof fetch; signal?: AbortSignal } = {}
): Promise<CachedSource | null> {
	const urls = deps.urls ?? presignedUrls;
	const r = await urls.lookup(trackId);
	if (deps.signal?.aborted) return null;
	if (r.url && !urls.isDenied(trackId)) return { url: r.url, kind: "presigned" };
	if (!r.url && r.status && NOT_CACHED.has(r.status)) return null;
	try {
		const res = await (deps.fetchImpl ?? fetch)(`${proxyUrl(trackId)}?prefetch=1`, {
			credentials: "include",
			redirect: "manual",
			signal: deps.signal,
			headers: { Range: "bytes=0-0" },
		});
		res.body?.cancel().catch(() => {});
		return res.status === 200 || res.status === 206 ? { url: proxyUrl(trackId), kind: "proxy" } : null;
	} catch {
		return null;
	}
}
