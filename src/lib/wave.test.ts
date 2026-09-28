import { describe, it, expect } from "vitest";
import { wavePath } from "./wave";

function points(d: string) {
	return d
		.split(/(?=[ML])/)
		.map((s) => s.slice(1).trim().split(" ").map(Number))
		.map(([x, y]) => ({ x, y }));
}

const base = { x0: 0, x1: 100, mid: 16, amplitude: 4, wavelength: 20, phase: 0 };

describe("wavePath", () => {
	it("starts and ends exactly on the baseline", () => {
		const pts = points(wavePath({ ...base, phase: 1.3 }));
		expect(pts[0]).toEqual({ x: 0, y: 16 });
		expect(pts[pts.length - 1]).toEqual({ x: 100, y: 16 });
	});

	it("stays within ±amplitude of the baseline", () => {
		for (const p of points(wavePath({ ...base, phase: 0.7 }))) {
			expect(Math.abs(p.y - 16)).toBeLessThanOrEqual(4 + 1e-9);
		}
	});

	it("actually oscillates when amplitude > 0", () => {
		const ys = points(wavePath(base)).map((p) => p.y);
		expect(Math.max(...ys)).toBeGreaterThan(19);
		expect(Math.min(...ys)).toBeLessThan(13);
	});

	it("is a flat line when amplitude is 0 (paused)", () => {
		for (const p of points(wavePath({ ...base, amplitude: 0 }))) expect(p.y).toBe(16);
	});

	it("moves when the phase advances", () => {
		expect(wavePath({ ...base, phase: 0 })).not.toBe(wavePath({ ...base, phase: Math.PI / 2 }));
	});

	it("samples every `step` px across the span", () => {
		const pts = points(wavePath({ ...base, step: 10 }));
		expect(pts).toHaveLength(11);
		expect(pts.map((p) => p.x)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
	});

	it("collapses to a single point when there is nothing played yet", () => {
		expect(wavePath({ ...base, x1: 0 })).toBe("M0 16");
		expect(wavePath({ ...base, x0: 50, x1: 20 })).toBe("M50 16");
	});

	it("survives degenerate wavelength and step values", () => {
		const d = wavePath({ ...base, wavelength: 0, step: 0 });
		expect(d.startsWith("M0 16")).toBe(true);
		expect(d).not.toContain("NaN");
	});
});
