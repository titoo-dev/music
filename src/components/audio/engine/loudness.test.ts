import { describe, it, expect } from "vitest";
import { NORM_TARGET_RMS, createLoudnessMeter } from "./loudness";

function feed(meter: ReturnType<typeof createLoudnessMeter>, rms: number, peak: number, from: number, to: number) {
	for (let t = from; t <= to; t += 0.25) meter.add({ rms, peak }, t);
}

describe("createLoudnessMeter", () => {
	it("doesn't decide from a single snapshot (was: one 256-sample read at 3 s set the gain)", () => {
		const meter = createLoudnessMeter();
		meter.add({ rms: 0.02, peak: 0.1 }, 3);
		expect(meter.ready).toBe(false);
		expect(meter.gain()).toBeNull();
	});

	it("averages several seconds of playback into one gain", () => {
		const meter = createLoudnessMeter();
		feed(meter, 0.06, 0.3, 1, 4);
		expect(meter.gain()).toBeNull();
		feed(meter, 0.06, 0.3, 4.25, 8);
		expect(meter.gain()).toBeCloseTo(NORM_TARGET_RMS / 0.06);
	});

	it("ignores the first second and silent passages", () => {
		const meter = createLoudnessMeter();
		feed(meter, 0.5, 0.9, 0, 0.75);
		feed(meter, 0.0001, 0.0001, 1, 10);
		expect(meter.ready).toBe(false);
	});

	it("stays within ±6 dB", () => {
		const quiet = createLoudnessMeter();
		feed(quiet, 0.005, 0.02, 1, 8);
		expect(quiet.gain()).toBe(2);
		const loud = createLoudnessMeter();
		feed(loud, 0.6, 0.95, 1, 8);
		expect(loud.gain()).toBe(0.5);
	});

	it("never boosts the loudest sample past full scale", () => {
		const meter = createLoudnessMeter();
		feed(meter, 0.06, 0.7, 1, 8);
		expect(meter.gain()).toBeCloseTo(0.98 / 0.7);
	});
});
