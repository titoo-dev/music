import { describe, expect, it } from "vitest";
import { TrackFormats } from "@/lib/deezer";
import { HEAD_MAX_BYTES, HEAD_MIN_BYTES, headPrefetchBytes } from "./head";

describe("headPrefetchBytes", () => {
	it("gives FLAC about 3 s of audio (was: a flat 64 KiB, ~0.5 s of FLAC, so the handoff rebuffered)", () => {
		expect(headPrefetchBytes(TrackFormats.FLAC)).toBe(360_000);
	});

	it("gives MP3 320 about 3 s of audio", () => {
		expect(headPrefetchBytes(TrackFormats.MP3_320)).toBe(120_000);
	});

	it("never goes below the 64 KiB floor (MP3 128)", () => {
		expect(headPrefetchBytes(TrackFormats.MP3_128)).toBe(HEAD_MIN_BYTES);
	});

	it("falls back to the floor for an unknown format", () => {
		expect(headPrefetchBytes(TrackFormats.DEFAULT)).toBe(HEAD_MIN_BYTES);
		expect(headPrefetchBytes(320)).toBe(HEAD_MIN_BYTES);
	});

	it("stays under the ceiling", () => {
		for (const f of Object.values(TrackFormats)) {
			expect(headPrefetchBytes(Number(f))).toBeLessThanOrEqual(HEAD_MAX_BYTES);
		}
	});
});
