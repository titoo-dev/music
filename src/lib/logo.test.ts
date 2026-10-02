// @vitest-environment node
import { describe, expect, it } from "vitest";
import { LOGO_VIEWBOX, logoSvg, wavelet, waveletPath } from "./logo";

/** All numbers of a path, as [x, y] pairs. */
function points(d: string): [number, number][] {
	const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
	const out: [number, number][] = [];
	for (let i = 0; i < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
	return out;
}

/** On-curve points only: the start and every Bézier end point. */
function anchors(d: string): [number, number][] {
	const pts = points(d);
	return [pts[0], ...pts.slice(1).filter((_, i) => i % 3 === 2)];
}

describe("wavelet", () => {
	it("crests at the centre and is symmetric", () => {
		expect(wavelet(0)).toBe(1);
		for (const t of [0.2, 0.4, 0.8]) expect(wavelet(-t)).toBeCloseTo(wavelet(t), 10);
	});

	it("dips into troughs either side of the crest and fades out at the ends", () => {
		expect(wavelet(0.4)).toBeLessThan(-0.5);
		expect(Math.abs(wavelet(1.18))).toBeLessThan(0.05);
	});

	it("travels with the phase and loops after one carrier cycle", () => {
		expect(wavelet(0, Math.PI)).toBeCloseTo(-1, 10);
		expect(wavelet(0.3, 2 * Math.PI)).toBeCloseTo(wavelet(0.3), 10);
	});
});

describe("waveletPath", () => {
	it("spans x0 → x1 with one cubic per sample step", () => {
		const d = waveletPath({ x0: 10, x1: 50, samples: 20 });
		expect(d.startsWith("M10 ")).toBe(true);
		expect(d.match(/C/g)).toHaveLength(20);
		expect(anchors(d).at(-1)![0]).toBe(50);
	});

	it("keeps the same command count across phases so frames can morph", () => {
		const count = (d: string) => d.match(/[MC]/g)!.length;
		expect(count(waveletPath({ phase: 0 }))).toBe(count(waveletPath({ phase: 1.3 })));
	});

	it("centres the curve's bounding box vertically on cy", () => {
		const ys = anchors(waveletPath({ samples: 200 })).map(([, y]) => y);
		const mid = (Math.min(...ys) + Math.max(...ys)) / 2;
		expect(mid).toBeCloseTo(LOGO_VIEWBOX / 2, 0);
	});

	it("puts the crest at the centre, above the baseline (SVG y grows downward)", () => {
		const pts = anchors(waveletPath({ samples: 28 }));
		const crest = pts[14];
		expect(crest[0]).toBe(32);
		expect(crest[1]).toBe(Math.min(...pts.map(([, y]) => y)));
	});

	it("clamps samples to at least two segments", () => {
		expect(waveletPath({ samples: 0 }).match(/C/g)).toHaveLength(2);
	});
});

describe("logoSvg", () => {
	it("renders a rounded squircle with a glowing stroke by default", () => {
		const svg = logoSvg({ size: 512 });
		expect(svg).toContain('width="512" height="512"');
		expect(svg).toContain('rx="15"');
		expect(svg).toContain('filter="url(#glow)"');
	});

	it("fills the whole square and scales the wave for maskable icons", () => {
		const svg = logoSvg({ fullBleed: true, scale: 0.78 });
		expect(svg).not.toContain('rx="15"');
		expect(svg).toContain("scale(0.78)");
	});

	it("drops the glow at favicon sizes", () => {
		const svg = logoSvg({ size: 16, glow: false, strokeWidth: 7 });
		expect(svg).not.toContain("feGaussianBlur");
		expect(svg).toContain('stroke-width="7"');
	});
});
