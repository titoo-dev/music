import { describe, it, expect } from "vitest";
import { NEXT_LEAD_S, gaplessNextDue, isDeckSource, nextInRun, wantsGapless, type GaplessSettings } from "./gapless-policy";

const on: GaplessSettings = { gapless: true, crossfadeDuration: 0, repeat: "off" };
const env = { supported: true, blocked: false };

describe("wantsGapless", () => {
	it("needs the setting, no crossfade, no repeat-one, MSE for MP3 and no failure in this run", () => {
		expect(wantsGapless(on, env)).toBe(true);
		expect(wantsGapless({ ...on, repeat: "all" }, env)).toBe(true);
		expect(wantsGapless({ ...on, gapless: false }, env)).toBe(false);
		expect(wantsGapless({ ...on, crossfadeDuration: 3 }, env)).toBe(false);
		expect(wantsGapless({ ...on, repeat: "one" }, env)).toBe(false);
		expect(wantsGapless(on, { ...env, supported: false })).toBe(false);
		expect(wantsGapless(on, { ...env, blocked: true })).toBe(false);
	});
});

describe("nextInRun", () => {
	const queue = ["a", "b", "c"].map((trackId) => ({ trackId }));

	it("is the queue's next track", () => {
		expect(nextInRun({ ...on, queue, queueIndex: 0 }, new Set())).toBe("b");
	});

	it("never wraps around (repeat-all reshuffles there), and skips a refused track", () => {
		expect(nextInRun({ ...on, repeat: "all", queue, queueIndex: 2 }, new Set())).toBeNull();
		expect(nextInRun({ ...on, queue, queueIndex: 0 }, new Set(["b"]))).toBeNull();
	});

	it("is none once gapless doesn't apply", () => {
		expect(nextInRun({ ...on, crossfadeDuration: 2, queue, queueIndex: 0 }, new Set())).toBeNull();
	});
});

describe("gaplessNextDue", () => {
	it("from halfway, or in the last NEXT_LEAD_S seconds", () => {
		expect(gaplessNextDue(100, 400)).toBe(false);
		expect(gaplessNextDue(200, 400)).toBe(true);
		expect(gaplessNextDue(5, NEXT_LEAD_S + 4)).toBe(true);
		expect(gaplessNextDue(0, 0)).toBe(false);
	});
});

describe("isDeckSource", () => {
	it("an IndexedDB blob or a presigned R2 URL — never the live stream or the proxy", () => {
		const origin = "http://localhost:3000";
		expect(isDeckSource("blob:http://localhost:3000/abc", origin)).toBe(true);
		expect(isDeckSource("https://r2.example/tracks/1/1.mp3?sig=1", origin)).toBe(true);
		expect(isDeckSource("/api/v1/stream-progressive/1", origin)).toBe(false);
		expect(isDeckSource("http://localhost:3000/api/v1/stream/1", origin)).toBe(false);
		expect(isDeckSource(null, origin)).toBe(false);
	});
});
