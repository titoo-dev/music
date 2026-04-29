"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
	useEffect(() => {
		// In dev, skip SW registration AND proactively unregister any existing
		// SW + clear caches. Otherwise the cache-first asset strategy in sw.js
		// keeps serving stale JS bundles even after HMR rebuilds.
		if (!("serviceWorker" in navigator)) return;
		if (process.env.NODE_ENV !== "production") {
			navigator.serviceWorker.getRegistrations().then((regs) => {
				for (const reg of regs) reg.unregister();
			});
			if ("caches" in window) {
				caches.keys().then((keys) => {
					for (const key of keys) caches.delete(key);
				});
			}
			return;
		}
		navigator.serviceWorker
			.register("/sw.js", { scope: "/", updateViaCache: "none" })
			.catch((err) =>
				console.error("Service worker registration failed:", err)
			);
	}, []);

	return null;
}
