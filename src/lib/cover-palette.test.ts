import { describe, it, expect } from "vitest";
import { BRAND_SEED, rgbToOklch, seedFromPixels, sizedCover } from "./cover-palette";

function pixels(...colors: [number, number, number, number?][]) {
	return colors.flatMap(([r, g, b, a = 255]) => [r, g, b, a]);
}

const repeat = <T,>(n: number, v: T) => Array.from({ length: n }, () => v);

describe("cover-palette", () => {
	it("converts sRGB to OKLCH", () => {
		const white = rgbToOklch(255, 255, 255);
		expect(white.l).toBeCloseTo(1, 3);
		expect(white.c).toBeLessThan(0.001);

		// #818CF8 (brand indigo) sits around hue 277.
		expect(rgbToOklch(0x81, 0x8c, 0xf8).h).toBeGreaterThan(270);
		expect(rgbToOklch(0x81, 0x8c, 0xf8).h).toBeLessThan(285);

		// Pure red ≈ 29°.
		expect(rgbToOklch(255, 0, 0).h).toBeCloseTo(29.2, 0);
	});

	it("picks the dominant vivid hue", () => {
		const data = pixels(...repeat(40, [220, 40, 40] as [number, number, number]), ...repeat(10, [40, 60, 220] as [number, number, number]));
		const seed = seedFromPixels(data);
		expect(seed.hue).toBeGreaterThan(15);
		expect(seed.hue).toBeLessThan(45);
		expect(seed.chroma).toBe(1);
	});

	it("lets a small vivid area beat a large dull one", () => {
		const data = pixels(
			...repeat(60, [120, 110, 100] as [number, number, number]),
			...repeat(15, [20, 200, 90] as [number, number, number])
		);
		const { hue } = seedFromPixels(data);
		expect(hue).toBeGreaterThan(130);
		expect(hue).toBeLessThan(160);
	});

	it("reports near-zero chroma for grey artwork", () => {
		const data = pixels(...repeat(50, [128, 128, 128] as [number, number, number]), ...repeat(50, [20, 20, 20] as [number, number, number]));
		expect(seedFromPixels(data)).toEqual({ hue: BRAND_SEED.hue, chroma: 0 });
	});

	it("falls back to the brand seed with no opaque pixels", () => {
		expect(seedFromPixels(pixels([255, 0, 0, 0]))).toEqual(BRAND_SEED);
		expect(seedFromPixels([])).toEqual(BRAND_SEED);
	});

	it("resizes Deezer covers and leaves other URLs alone", () => {
		expect(sizedCover("https://e-cdns-images.dzcdn.net/images/cover/abc/1000x1000-000000-80-0-0.jpg", 64)).toBe(
			"https://e-cdns-images.dzcdn.net/images/cover/abc/64x64-000000-80-0-0.jpg"
		);
		expect(sizedCover("https://example.com/a.jpg", 64)).toBe("https://example.com/a.jpg");
	});
});
