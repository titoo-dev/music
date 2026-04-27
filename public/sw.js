const CACHE_NAME = "deemix-v3";
const AUDIO_DB_NAME = "deemix-audio-cache";
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

function getCachedAudio(trackId) {
	return openAudioDB().then(
		(db) =>
			new Promise((resolve) => {
				const tx = db.transaction(AUDIO_STORE, "readwrite");
				const store = tx.objectStore(AUDIO_STORE);
				const req = store.get(trackId);
				req.onsuccess = () => {
					const record = req.result;
					if (!record) return resolve(null);
					// Update LRU timestamp
					record.lastAccessed = Date.now();
					store.put(record);
					resolve(record);
				};
				req.onerror = () => resolve(null);
			})
	).catch(() => null);
}

function cacheAudio(trackId, blob, contentType) {
	return openAudioDB().then(
		(db) =>
			new Promise((resolve) => {
				const tx = db.transaction(AUDIO_STORE, "readwrite");
				tx.objectStore(AUDIO_STORE).put({
					trackId,
					blob,
					contentType,
					size: blob.size,
					lastAccessed: Date.now(),
					createdAt: Date.now(),
				});
				tx.oncomplete = () => resolve();
				tx.onerror = () => resolve();
			})
	).catch(() => {});
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

	// Network fetch
	try {
		const response = await fetch(request);

		// Only cache successful full responses (not partial/range)
		if (response.ok && response.status === 200 && !rangeHeader) {
			const contentType = response.headers.get("Content-Type") || "audio/mpeg";
			const clone = response.clone();

			// Cache in background (don't block response)
			clone.blob().then((blob) => {
				cacheAudio(trackId, blob, contentType);
			}).catch(() => {});
		}

		return response;
	} catch (error) {
		return new Response("Audio unavailable", { status: 503 });
	}
}

// --- Serve range requests from cached blob ---
function handleRangeFromBlob(blob, contentType, rangeHeader) {
	const total = blob.size;
	const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);

	if (!match) {
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

	const start = parseInt(match[1], 10);
	const end = match[2] ? parseInt(match[2], 10) : total - 1;
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
