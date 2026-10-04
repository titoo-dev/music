const CACHE_NAME = "wavelet-v3";
const AUDIO_DB_NAME = "wavelet-audio-cache";
const AUDIO_DB_VERSION = 1;
const AUDIO_STORE = "tracks";

const APP_SHELL = ["/"];

// --- IndexedDB helpers (Service Worker context) ---

function openAudioDB() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(AUDIO_STORE)) {
				const store = db.createObjectStore(AUDIO_STORE, { keyPath: "trackId" });
				store.createIndex("lastAccessed", "lastAccessed");
				store.createIndex("size", "size");
			}
			if (!db.objectStoreNames.contains("meta")) {
				db.createObjectStore("meta", { keyPath: "key" });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

// The page (src/lib/audio-cache.ts) is the only writer of this database and
// enforces its size limit; the worker only reads it (was: it also stored
// every full /api/v1/stream response, with no eviction at all).
// A read never rewrites the audio record: the access time goes into a small
// "atime:{trackId}" record of the meta store, at most once a minute.
const TOUCH_INTERVAL_MS = 60 * 1000;
const touchedAt = new Map();

function getCachedAudio(trackId) {
	return openAudioDB().then(
		(db) =>
			new Promise((resolve) => {
				const tx = db.transaction(AUDIO_STORE, "readonly");
				const req = tx.objectStore(AUDIO_STORE).get(trackId);
				req.onsuccess = () => {
					const record = req.result;
					if (record) touchAudio(db, trackId);
					resolve(record || null);
				};
				req.onerror = () => resolve(null);
			})
	).catch(() => null);
}

function touchAudio(db, trackId) {
	const now = Date.now();
	if (now - (touchedAt.get(trackId) || 0) < TOUCH_INTERVAL_MS) return;
	touchedAt.set(trackId, now);
	try {
		const tx = db.transaction("meta", "readwrite");
		tx.objectStore("meta").put({ key: "atime:" + trackId, trackId, lastAccessed: now });
	} catch {
		// LRU bookkeeping is best-effort
	}
}

/**
 * Resolve a single "Range: bytes=..." header against a body of `total` bytes.
 * Returns { start, end } (inclusive, end clamped to the last byte),
 * "unsatisfiable" when the range starts past the end (-> 416), or null when the
 * header isn't a single byte range we understand (-> serve the whole body).
 */
function parseByteRange(header, total) {
	const m = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
	if (!m || (m[1] === "" && m[2] === "")) return null;
	if (m[1] === "") {
		// Suffix range: the last N bytes
		const n = parseInt(m[2], 10);
		if (n === 0 || total === 0) return "unsatisfiable";
		return { start: Math.max(0, total - n), end: total - 1 };
	}
	const start = parseInt(m[1], 10);
	if (start >= total) return "unsatisfiable";
	const end = m[2] === "" ? total - 1 : Math.min(parseInt(m[2], 10), total - 1);
	if (end < start) return null;
	return { start, end };
}

// --- Extract trackId from stream URL ---
function extractTrackId(pathname) {
	// /api/v1/stream/123456 → "123456"
	const match = pathname.match(/^\/api\/v1\/stream\/([^/?]+)/);
	return match ? match[1] : null;
}

// --- Service Worker Lifecycle ---

self.addEventListener("install", (event) => {
	// addAll rejects atomically if any URL fails — don't let a single broken
	// shell entry abort the whole SW install. Fall back to a per-URL put so
	// missing pages just get skipped instead of breaking caching.
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) =>
			Promise.all(
				APP_SHELL.map((url) =>
					fetch(url, { cache: "reload" })
						.then((res) => (res.ok ? cache.put(url, res) : null))
						.catch(() => null)
				)
			)
		)
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			)
		)
	);
	self.clients.claim();
});

// --- Message handler for cache operations from main thread ---
self.addEventListener("message", (event) => {
	const { type, trackId } = event.data || {};

	if (type === "CACHE_STATUS") {
		getCachedAudio(trackId).then((record) => {
			event.source?.postMessage({
				type: "CACHE_STATUS_RESPONSE",
				trackId,
				cached: !!record,
				size: record?.size || 0,
			});
		});
	}
});

// --- Fetch handler ---

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== "GET") return;

	// --- Audio stream caching ---
	// Intercept /api/v1/stream/{trackId} (NOT /api/v1/stream-url/)
	if (url.pathname.startsWith("/api/v1/stream/") && !url.pathname.includes("stream-url")) {
		const trackId = extractTrackId(url.pathname);
		if (trackId) {
			event.respondWith(handleAudioRequest(request, trackId));
			return;
		}
	}

	// Skip presigned URL endpoint (returns JSON, not audio)
	if (url.pathname.startsWith("/api/v1/stream-url")) return;

	// Skip auth API calls
	if (url.pathname.startsWith("/api/auth")) return;

	// Skip WebSocket upgrade requests
	if (request.headers.get("upgrade") === "websocket") return;

	// Network-first for API calls
	if (url.pathname.startsWith("/api/")) {
		event.respondWith(
			fetch(request).catch(() => caches.match(request))
		);
		return;
	}

	// Network-first for navigation (HTML pages)
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request).catch(() =>
				caches.match(request).then((cached) => cached || caches.match("/"))
			)
		);
		return;
	}

	// Cache-first for static assets (JS, CSS, images, fonts)
	event.respondWith(
		caches.match(request).then(
			(cached) =>
				cached ||
				fetch(request).then((response) => {
					// Only cache successful same-origin responses
					if (
						response.ok &&
						url.origin === self.location.origin
					) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					}
					return response;
				})
		)
	);
});

// --- Audio request handler: cache-first with network fallback ---
async function handleAudioRequest(request, trackId) {
	const rangeHeader = request.headers.get("range");

	// Try IndexedDB cache first (only for full requests or simple range requests)
	try {
		const cached = await getCachedAudio(trackId);
		if (cached) {
			const blob = cached.blob;
			const contentType = cached.contentType || "audio/mpeg";

			if (rangeHeader) {
				// Handle range request from cached blob
				return handleRangeFromBlob(blob, contentType, rangeHeader);
			}

			// Full response from cache
			return new Response(blob, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Content-Length": String(blob.size),
					"Accept-Ranges": "bytes",
					"X-Cache": "HIT",
				},
			});
		}
	} catch {
		// Cache miss — fall through to network
	}

	// Network fetch, passed through as is (the page decides what to cache).
	try {
		return await fetch(request);
	} catch {
		return new Response("Audio unavailable", { status: 503 });
	}
}

// --- Serve range requests from cached blob ---
function handleRangeFromBlob(blob, contentType, rangeHeader) {
	const total = blob.size;
	const range = parseByteRange(rangeHeader, total);

	if (range === "unsatisfiable") {
		// Was: a start past the end produced a negative Content-Length.
		return new Response(null, {
			status: 416,
			headers: { "Content-Range": `bytes */${total}`, "Accept-Ranges": "bytes" },
		});
	}

	if (!range) {
		return new Response(blob, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Length": String(total),
				"Accept-Ranges": "bytes",
				"X-Cache": "HIT",
			},
		});
	}

	// End clamped to the last byte (was: "bytes=0-999999" on a smaller file
	// announced a Content-Length the body didn't have).
	const { start, end } = range;
	const chunkSize = end - start + 1;

	const sliced = blob.slice(start, end + 1, contentType);

	return new Response(sliced, {
		status: 206,
		headers: {
			"Content-Type": contentType,
			"Content-Length": String(chunkSize),
			"Content-Range": `bytes ${start}-${end}/${total}`,
			"Accept-Ranges": "bytes",
			"X-Cache": "HIT",
		},
	});
}
