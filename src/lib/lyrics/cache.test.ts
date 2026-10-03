import { describe, it, expect, beforeEach } from "vitest";
import { getCachedLyrics, setCachedLyrics, clearLyricsCache } from "./cache";

const HIT = { source: "lrclib" as const, syncedLyrics: null, plainLyrics: "la", instrumental: false };
const MISS = { source: null, syncedLyrics: null, plainLyrics: null, instrumental: false };

describe("lyrics cache", () => {
	beforeEach(() => clearLyricsCache());

	it("returns null for unknown keys", () => {
		expect(getCachedLyrics("x")).toBeNull();
	});

	it("keeps hits for 12 h and misses for 15 min", () => {
		setCachedLyrics("hit", HIT, 0);
		setCachedLyrics("miss", MISS, 0);
		expect(getCachedLyrics("hit", 60 * 60 * 1000)).toEqual(HIT);
		expect(getCachedLyrics("miss", 14 * 60 * 1000)).toEqual(MISS);
		expect(getCachedLyrics("miss", 15 * 60 * 1000)).toBeNull();
		expect(getCachedLyrics("hit", 12 * 60 * 60 * 1000)).toBeNull();
	});

	it("evicts the least recently used entry past 500 entries", () => {
		for (let i = 0; i < 500; i++) setCachedLyrics(`k${i}`, HIT, 0);
		getCachedLyrics("k0", 0); // touch → most recent
		setCachedLyrics("new", HIT, 0);
		expect(getCachedLyrics("k0", 0)).toEqual(HIT);
		expect(getCachedLyrics("k1", 0)).toBeNull();
		expect(getCachedLyrics("new", 0)).toEqual(HIT);
	});
});
