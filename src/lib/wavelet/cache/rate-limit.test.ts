import { describe, it, expect } from "vitest";
import { createRateLimiter, clientAddress } from "./rate-limit";

describe("createRateLimiter", () => {
	it("allows `limit` hits per window and per key, then refuses until the window ends", () => {
		const rl = createRateLimiter({ limit: 2, windowMs: 1000 });
		expect(rl.take("a", 0).ok).toBe(true);
		expect(rl.take("a", 10).ok).toBe(true);
		const third = rl.take("a", 500);
		expect(third.ok).toBe(false);
		expect(third.retryAfterSec).toBe(1);
		expect(rl.take("b", 500).ok).toBe(true);
		expect(rl.take("a", 1000).ok).toBe(true);
	});

	it("bounds the number of tracked keys", () => {
		const rl = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
		rl.take("a", 0);
		rl.take("b", 0);
		rl.take("c", 0); // evicts a
		expect(rl.take("a", 1).ok).toBe(true);
		rl.take("x", 2000); // a, b, c windows expired: dropped first
		expect(rl.take("c", 2001).ok).toBe(true);
		rl.reset();
		expect(rl.take("x", 2002).ok).toBe(true);
	});
});

describe("clientAddress", () => {
	it("reads the first forwarded address, then x-real-ip", () => {
		expect(clientAddress(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
		expect(clientAddress(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
		expect(clientAddress(new Headers())).toBe("unknown");
	});
});
