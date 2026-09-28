import { describe, it, expect } from "vitest";
import { levelFromFrequencies, mirroredBars } from "./spectrum";

describe("levelFromFrequencies", () => {
	it("averages the lowest bins into 0..1", () => {
		expect(levelFromFrequencies([255, 255, 0, 0, 99], 4)).toBe(0.5);
	});

	it("is 0 for silence and for an empty spectrum", () => {
		expect(levelFromFrequencies(new Uint8Array(16))).toBe(0);
		expect(levelFromFrequencies([])).toBe(0);
	});

	it("caps the bin count to the data length and at least one bin", () => {
		expect(levelFromFrequencies([255], 8)).toBe(1);
		expect(levelFromFrequencies([51, 255], 0)).toBeCloseTo(0.2);
	});

	it("clamps out-of-range input", () => {
		expect(levelFromFrequencies([999, 999], 2)).toBe(1);
		expect(levelFromFrequencies([-50], 1)).toBe(0);
	});
});

describe("mirroredBars", () => {
	const ramp = Uint8Array.from({ length: 100 }, (_, i) => 255 - i * 2);

	it("puts the bass in the middle, mirrored outward (even count)", () => {
		const bars = mirroredBars(ramp, 6);
		expect(bars).toHaveLength(6);
		expect(bars.slice(0, 3)).toEqual([...bars.slice(3)].reverse());
		// Loudest (bass) bars sit at the center.
		expect(bars[2]).toBe(1);
		expect(bars[3]).toBe(1);
		expect(bars[0]).toBeLessThan(bars[2]);
	});

	it("shares a single center bar for odd counts", () => {
		const bars = mirroredBars(ramp, 5);
		expect(bars).toHaveLength(5);
		expect(bars[2]).toBe(1);
		expect(bars[1]).toBe(bars[3]);
		expect(bars[0]).toBe(bars[4]);
	});

	it("only samples the usable lower part of the spectrum", () => {
		const loud = new Uint8Array(100);
		loud.fill(255, 0, 50); // top half empty
		expect(mirroredBars(loud, 8, 0.5).every((v) => v === 1)).toBe(true);
		expect(mirroredBars(loud, 8, 1).some((v) => v === 0)).toBe(true);
	});

	it("handles empty input and zero bars", () => {
		expect(mirroredBars(ramp, 0)).toEqual([]);
		expect(mirroredBars([], 4)).toEqual([0, 0, 0, 0]);
	});
});
