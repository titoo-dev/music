/**
 * IndexedDB-backed audio cache for Spotify-like instant playback.
 *
 * Stores audio blobs keyed by trackId with LRU eviction.
 * Used by AudioEngine for blob URL playback; the Service Worker only reads
 * it (it serves /api/v1/stream/{id} from here), so this module is the one
 * writer and the one place that enforces the size limit.
 *
 * Access times live in small "atime:{trackId}" records of the meta store:
 * playing a cached track must not rewrite its multi-megabyte audio record
 * (was: every read opened a readwrite transaction and put the whole record
 * back just to bump lastAccessed).
 */

const DB_NAME = "wavelet-audio-cache";
const DB_VERSION = 1;
const STORE_NAME = "tracks";
const META_STORE = "meta";
const ATIME_PREFIX = "atime:";
/** A cached track's access time is written at most this often. */
const TOUCH_INTERVAL_MS = 60_000;

// Default max cache size: 500MB (configurable via setCacheLimit)
let MAX_CACHE_BYTES = 500 * 1024 * 1024;

interface CachedTrack {
  trackId: string;
  blob: Blob;
  contentType: string;
  size: number;
  lastAccessed: number;
  createdAt: number;
}

interface AccessTime {
  key: string;
  trackId: string;
  lastAccessed: number;
}

/** What eviction needs to know about a cached track (no blob). */
export interface CacheEntry {
  trackId: string;
  size: number;
  lastAccessed: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "trackId" });
        store.createIndex("lastAccessed", "lastAccessed");
        store.createIndex("size", "size");
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// --- Blob URL management ---
const blobUrlMap = new Map<string, string>();

function createBlobUrl(trackId: string, blob: Blob): string {
  // Revoke previous URL for this track if exists
  const existing = blobUrlMap.get(trackId);
  if (existing) URL.revokeObjectURL(existing);

  const url = URL.createObjectURL(blob);
  blobUrlMap.set(trackId, url);
  return url;
}

function revokeBlobUrl(trackId: string) {
  const url = blobUrlMap.get(trackId);
  if (url) {
    URL.revokeObjectURL(url);
    blobUrlMap.delete(trackId);
  }
}

// --- Eviction planning (pure) ---

/**
 * Which cached tracks to drop, least recently used first, so `incoming`
 * fits under `maxBytes`. An entry for the incoming track itself is about to
 * be replaced: it neither counts nor gets evicted. Returns null when the
 * incoming file can't fit even in an empty cache.
 */
export function planEviction(
  entries: ReadonlyArray<CacheEntry>,
  incoming: { trackId: string; size: number },
  maxBytes: number
): string[] | null {
  if (incoming.size > maxBytes) return null;
  const others = entries.filter((e) => e.trackId !== incoming.trackId);
  let total = others.reduce((sum, e) => sum + e.size, 0);
  const evict: string[] = [];
  const byAge = [...others].sort((a, b) => a.lastAccessed - b.lastAccessed);
  for (const e of byAge) {
    if (total + incoming.size <= maxBytes) break;
    evict.push(e.trackId);
    total -= e.size;
  }
  return evict;
}

/**
 * Sizes and access times of every cached track, read with key cursors and
 * the small meta records: no audio record is loaded (was: getAll() of the
 * whole store before every write).
 */
function readEntries(tx: IDBTransaction, done: (entries: CacheEntry[]) => void) {
  const store = tx.objectStore(STORE_NAME);
  const sizes = new Map<string, number>();
  const times = new Map<string, number>();
  const seen = (id: string, t: number) => times.set(id, Math.max(times.get(id) ?? 0, t));
  let pending = 3;
  const finish = () => {
    if (--pending > 0) return;
    done([...sizes].map(([trackId, size]) => ({ trackId, size, lastAccessed: times.get(trackId) ?? 0 })));
  };

  const bySize = store.index("size").openKeyCursor();
  bySize.onsuccess = () => {
    const cursor = bySize.result;
    if (!cursor) return finish();
    sizes.set(String(cursor.primaryKey), Number(cursor.key));
    cursor.continue();
  };
  bySize.onerror = finish;

  const byTime = store.index("lastAccessed").openKeyCursor();
  byTime.onsuccess = () => {
    const cursor = byTime.result;
    if (!cursor) return finish();
    seen(String(cursor.primaryKey), Number(cursor.key));
    cursor.continue();
  };
  byTime.onerror = finish;

  const atimes = tx.objectStore(META_STORE).getAll();
  atimes.onsuccess = () => {
    for (const r of (atimes.result || []) as AccessTime[]) {
      if (typeof r?.key === "string" && r.key.startsWith(ATIME_PREFIX)) seen(r.trackId, r.lastAccessed);
    }
    finish();
  };
  atimes.onerror = finish;
}

// Last access time written per track (this page), to throttle the writes.
const touchedAt = new Map<string, number>();

/** Record that a track was played from the cache (meta store only). */
async function touch(trackId: string): Promise<void> {
  const now = Date.now();
  const last = touchedAt.get(trackId);
  if (last !== undefined && now - last < TOUCH_INTERVAL_MS) return;
  touchedAt.set(trackId, now);
  try {
    const db = await openDB();
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).put({ key: ATIME_PREFIX + trackId, trackId, lastAccessed: now } satisfies AccessTime);
    await txDone(tx);
  } catch {
    // LRU bookkeeping is best-effort
  }
}

// --- Core API ---

/** Check if a track is cached */
export async function isCached(trackId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).count(trackId);
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/** Get a cached track as a blob URL (records the access for LRU) */
export async function getCachedBlobUrl(trackId: string): Promise<string | null> {
  try {
    // Return existing blob URL if we have one
    const existing = blobUrlMap.get(trackId);
    if (existing) {
      void touch(trackId);
      return existing;
    }

    const db = await openDB();
    const record = await new Promise<CachedTrack | undefined>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(trackId);
      req.onsuccess = () => resolve(req.result as CachedTrack | undefined);
      req.onerror = () => resolve(undefined);
    });
    if (!record) return null;
    void touch(trackId);
    return createBlobUrl(trackId, record.blob);
  } catch {
    return null;
  }
}

/**
 * Store an audio blob in the cache. Eviction of the least recently used
 * tracks and the write happen in one transaction; a file bigger than the
 * whole cache is not stored (was: it evicted everything first).
 */
export async function cacheTrack(
  trackId: string,
  blob: Blob,
  contentType: string = "audio/mpeg"
): Promise<void> {
  const size = blob.size;
  if (size === 0 || size > MAX_CACHE_BYTES) return;
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME, META_STORE], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const meta = tx.objectStore(META_STORE);
    const now = Date.now();

    readEntries(tx, (entries) => {
      for (const id of planEviction(entries, { trackId, size }, MAX_CACHE_BYTES) ?? []) {
        store.delete(id);
        meta.delete(ATIME_PREFIX + id);
        revokeBlobUrl(id);
        touchedAt.delete(id);
      }
      store.put({
        trackId,
        blob,
        contentType,
        size,
        lastAccessed: now,
        createdAt: now,
      } satisfies CachedTrack);
      meta.put({ key: ATIME_PREFIX + trackId, trackId, lastAccessed: now } satisfies AccessTime);
    });
    await txDone(tx);
    touchedAt.set(trackId, now);
  } catch {
    // Cache failures are non-fatal
  }
}

/** Remove a specific track from cache */
export async function removeCached(trackId: string): Promise<void> {
  try {
    revokeBlobUrl(trackId);
    touchedAt.delete(trackId);

    const db = await openDB();
    const tx = db.transaction([STORE_NAME, META_STORE], "readwrite");
    tx.objectStore(STORE_NAME).delete(trackId);
    tx.objectStore(META_STORE).delete(ATIME_PREFIX + trackId);
    await txDone(tx);
  } catch {
    // Non-fatal
  }
}

/** Clear entire audio cache (also on sign-out: the Service Worker serves it without auth) */
export async function clearCache(): Promise<void> {
  try {
    // Revoke all blob URLs
    for (const url of blobUrlMap.values()) URL.revokeObjectURL(url);
    blobUrlMap.clear();
    touchedAt.clear();

    const db = await openDB();
    const tx = db.transaction([STORE_NAME, META_STORE], "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(META_STORE).clear();
    await txDone(tx);
  } catch {
    // Non-fatal
  }
}

/** Get cache statistics */
export async function getCacheStats(): Promise<{
  trackCount: number;
  totalBytes: number;
  maxBytes: number;
  tracks: Array<{ trackId: string; size: number; lastAccessed: number }>;
}> {
  const empty = { trackCount: 0, totalBytes: 0, maxBytes: MAX_CACHE_BYTES, tracks: [] };
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME, META_STORE], "readonly");
      readEntries(tx, (entries) =>
        resolve({
          trackCount: entries.length,
          totalBytes: entries.reduce((sum, e) => sum + e.size, 0),
          maxBytes: MAX_CACHE_BYTES,
          tracks: entries.sort((a, b) => b.lastAccessed - a.lastAccessed),
        })
      );
      tx.onerror = () => resolve(empty);
    });
  } catch {
    return empty;
  }
}

/** Update max cache size */
export function setCacheLimit(bytes: number) {
  MAX_CACHE_BYTES = bytes;
}

export function getCacheLimit(): number {
  return MAX_CACHE_BYTES;
}

// --- Prefetch API ---

/**
 * Where a copy of a track that the server already holds can be fetched from:
 * a presigned R2 URL (direct, CORS) or the same-origin proxy
 * /api/v1/stream/{id}. Never /stream-progressive — that one persists.
 */
export interface CachedSource {
  url: string;
  kind: "presigned" | "proxy";
}

export type ResolveCachedSource = (
  trackId: string,
  signal?: AbortSignal
) => Promise<CachedSource | null>;

export interface PrefetchOptions {
  signal?: AbortSignal;
  /**
   * Required: says where the server's cached copy lives, or null when the
   * track isn't cached server-side. Without it nothing is fetched — a
   * background prefetch must never make the server download, decrypt, tag
   * and upload a track nobody is listening to.
   */
  resolveSource?: ResolveCachedSource;
  fetchImpl?: typeof fetch;
}

const NOT_AUDIO = /json|html|xml/i;

/**
 * Download a cached copy for the IndexedDB cache. Returns null — and caches
 * nothing — unless the response is a complete 200 audio body: the proxy is
 * asked with ?prefetch=1 and redirect:"manual" so a "not cached" answer
 * (404 NOT_CACHED, or the legacy 302 to the persisting stream) is never
 * followed, and a body shorter than its Content-Length is dropped.
 */
export async function fetchCachedCopy(
  source: CachedSource,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}
): Promise<{ blob: Blob; contentType: string } | null> {
  const doFetch = opts.fetchImpl ?? fetch;
  const proxy = source.kind === "proxy";
  const url = proxy ? `${source.url}${source.url.includes("?") ? "&" : "?"}prefetch=1` : source.url;
  const res = await doFetch(
    url,
    proxy
      ? { credentials: "include", redirect: "manual", signal: opts.signal }
      : { credentials: "omit", mode: "cors", signal: opts.signal }
  );
  const contentType = res.headers.get("Content-Type") || "audio/mpeg";
  if (res.status !== 200 || NOT_AUDIO.test(contentType)) {
    res.body?.cancel().catch(() => {});
    return null;
  }
  const expected = Number(res.headers.get("Content-Length")) || null;
  const blob = await res.blob();
  if (blob.size === 0 || (expected !== null && blob.size !== expected)) return null;
  return { blob, contentType };
}

// Track in-flight prefetch requests to avoid duplicates
const prefetchInFlight = new Set<string>();

/**
 * Prefetch a track the server already cached into the IndexedDB cache.
 * Returns true if the track was cached, false if skipped (already cached,
 * not cached server-side, aborted) or failed.
 */
export async function prefetchTrack(trackId: string, opts: PrefetchOptions = {}): Promise<boolean> {
  const { signal, resolveSource } = opts;
  if (!resolveSource || signal?.aborted) return false;
  // Already being fetched?
  if (prefetchInFlight.has(trackId)) return false;
  prefetchInFlight.add(trackId);
  try {
    // Already cached?
    if (await isCached(trackId)) return false;
    const source = await resolveSource(trackId, signal);
    if (!source || signal?.aborted) return false;
    const copy = await fetchCachedCopy(source, { signal, fetchImpl: opts.fetchImpl });
    if (!copy || signal?.aborted) return false;
    await cacheTrack(trackId, copy.blob, copy.contentType);
    return true;
  } catch {
    return false;
  } finally {
    prefetchInFlight.delete(trackId);
  }
}

/**
 * Prefetch multiple tracks with concurrency limit.
 * Prioritizes tracks in order (first = most important). Stops picking up
 * new tracks once `opts.signal` is aborted.
 */
export async function prefetchTracks(
  trackIds: string[],
  concurrency: number = 2,
  opts: PrefetchOptions = {}
): Promise<void> {
  const queue = [...trackIds];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0 && !opts.signal?.aborted) {
      const trackId = queue.shift()!;
      await prefetchTrack(trackId, opts);
    }
  });
  await Promise.all(workers);
}
