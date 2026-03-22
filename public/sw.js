const CACHE_NAME = "deemix-v1";

const APP_SHELL = ["/", "/offline"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== "GET") return;

	// Skip audio/video streams — never cache these
	if (url.pathname.startsWith("/api/v1/stream")) return;

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
