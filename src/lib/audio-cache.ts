/**
 * IndexedDB-backed audio cache for Spotify-like instant playback.
 *
 * Stores audio blobs keyed by trackId with LRU eviction.
 * Used by AudioEngine for blob URL playback and by the Service Worker
 * as a persistent cache layer.
 */

const DB_NAME = "wavelet-audio-cache";
const DB_VERSION = 1;
const STORE_NAME = "tracks";
const META_STORE = "meta";

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

/** Get a cached track as a blob URL (updates LRU timestamp) */
export async function getCachedBlobUrl(trackId: string): Promise<string | null> {
  try {
    // Return existing blob URL if we have one
    const existing = blobUrlMap.get(trackId);
    if (existing) return existing;

    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);

      req.onsuccess = () => {
        const record = req.result as CachedTrack | undefined;
        if (!record) return resolve(null);

        // Update LRU timestamp
        record.lastAccessed = Date.now();
        store.put(record);

        resolve(createBlobUrl(trackId, record.blob));
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Get raw blob from cache (used by Service Worker) */
export async function getCachedBlob(trackId: string): Promise<{ blob: Blob; contentType: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(trackId);
      req.onsuccess = () => {
        const record = req.result as CachedTrack | undefined;
        if (!record) return resolve(null);
        resolve({ blob: record.blob, contentType: record.contentType });
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Store an audio blob in the cache, evicting LRU entries if needed */
export async function cacheTrack(
  trackId: string,
  blob: Blob,
  contentType: string = "audio/mpeg"
): Promise<void> {
  try {
    const db = await openDB();
    const size = blob.size;

    // Evict old entries if adding this would exceed limit
    await evictIfNeeded(db, size);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const now = Date.now();

      store.put({
        trackId,
        blob,
        contentType,
        size,
        lastAccessed: now,
        createdAt: now,
      } satisfies CachedTrack);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache failures are non-fatal
  }
}

/** Remove a specific track from cache */
export async function removeCached(trackId: string): Promise<void> {
  try {
    const blobUrl = blobUrlMap.get(trackId);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrlMap.delete(trackId);
    }

    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Non-fatal
  }
}

/** Clear entire audio cache */
export async function clearCache(): Promise<void> {
  try {
    // Revoke all blob URLs
    for (const url of blobUrlMap.values()) URL.revokeObjectURL(url);
    blobUrlMap.clear();

    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
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
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as CachedTrack[];
        const totalBytes = records.reduce((sum, r) => sum + r.size, 0);
        resolve({
          trackCount: records.length,
          totalBytes,
          maxBytes: MAX_CACHE_BYTES,
          tracks: records
            .map((r) => ({
              trackId: r.trackId,
              size: r.size,
              lastAccessed: r.lastAccessed,
            }))
            .sort((a, b) => b.lastAccessed - a.lastAccessed),
        });
      };
      req.onerror = () =>
        resolve({ trackCount: 0, totalBytes: 0, maxBytes: MAX_CACHE_BYTES, tracks: [] });
    });
  } catch {
    return { trackCount: 0, totalBytes: 0, maxBytes: MAX_CACHE_BYTES, tracks: [] };
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

/** Check if a prefetch is currently in flight */
export function isPrefetching(trackId: string): boolean {
  return prefetchInFlight.has(trackId);
}

// --- LRU Eviction ---

async function evictIfNeeded(db: IDBDatabase, incomingSize: number): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("lastAccessed");

    // First, calculate current total size
    const allReq = store.getAll();
    allReq.onsuccess = () => {
      const records = (allReq.result || []) as CachedTrack[];
      let totalSize = records.reduce((sum, r) => sum + r.size, 0);

      if (totalSize + incomingSize <= MAX_CACHE_BYTES) {
        resolve();
        return;
      }

      // Need to evict — open cursor ordered by lastAccessed (oldest first)
      const cursorReq = index.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor || totalSize + incomingSize <= MAX_CACHE_BYTES) {
          resolve();
          return;
        }

        const record = cursor.value as CachedTrack;
        totalSize -= record.size;

        // Revoke blob URL if exists
        const blobUrl = blobUrlMap.get(record.trackId);
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          blobUrlMap.delete(record.trackId);
        }

        cursor.delete();
        cursor.continue();
      };
      cursorReq.onerror = () => resolve();
    };
    allReq.onerror = () => resolve();
  });
}
