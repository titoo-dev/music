// Small fixed-window, in-memory rate limiter (per instance). Good enough to
// stop one client from hammering an expensive fallback; not a global quota.

export interface RateLimiter {
	/** Counts one hit for `key`; ok=false once the window's budget is spent. */
	take(key: string, now?: number): { ok: boolean; retryAfterSec: number };
	reset(): void;
}

export function createRateLimiter(opts: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
	const { limit, windowMs, maxKeys = 10_000 } = opts;
	const windows = new Map<string, { count: number; resetAt: number }>();

	return {
		take(key, now = Date.now()) {
			let w = windows.get(key);
			if (!w || now >= w.resetAt) {
				if (!w && windows.size >= maxKeys) {
					// Drop expired windows first, then the oldest ones.
					for (const [k, v] of windows) if (now >= v.resetAt) windows.delete(k);
					while (windows.size >= maxKeys) {
						const oldest = windows.keys().next().value;
						if (oldest === undefined) break;
						windows.delete(oldest);
					}
				}
				w = { count: 0, resetAt: now + windowMs };
				windows.set(key, w);
			}
			w.count++;
			return { ok: w.count <= limit, retryAfterSec: Math.max(1, Math.ceil((w.resetAt - now) / 1000)) };
		},
		reset() {
			windows.clear();
		},
	};
}

/** Best-effort client address (Vercel sets x-forwarded-for to the real client first). */
export function clientAddress(headers: Headers): string {
	const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
