/**
 * IndexedDB-backed audio cache for Spotify-like instant playback.
 *
 * Stores audio blobs keyed by trackId with LRU eviction.
 * Used by AudioEngine for blob URL playback and by the Service Worker
 * as a persistent cache layer.
 */

const DB_NAME = "deemix-audio-cache";
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

// Track in-flight prefetch requests to avoid duplicates
const prefetchInFlight = new Set<string>();

/**
 * Prefetch a track into the IndexedDB cache.
 * Uses the stream API to download the full audio file as a blob.
 * Returns true if the track was cached, false if already cached or failed.
 */
export async function prefetchTrack(trackId: string): Promise<boolean> {
  // Already cached?
  if (await isCached(trackId)) return false;
  // Already being fetched?
  if (prefetchInFlight.has(trackId)) return false;

  prefetchInFlight.add(trackId);
  try {
    const res = await fetch(`/api/v1/stream/${trackId}`, {
      credentials: "include",
    });
    if (!res.ok) return false;

    const contentType = res.headers.get("Content-Type") || "audio/mpeg";
    const blob = await res.blob();

    await cacheTrack(trackId, blob, contentType);
    return true;
  } catch {
    return false;
  } finally {
    prefetchInFlight.delete(trackId);
  }
}

/**
 * Prefetch multiple tracks with concurrency limit.
 * Prioritizes tracks in order (first = most important).
 */
export async function prefetchTracks(
  trackIds: string[],
  concurrency: number = 2
): Promise<void> {
  const queue = [...trackIds];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const trackId = queue.shift()!;
      await prefetchTrack(trackId);
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
