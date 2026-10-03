/**
 * Seed colour from artwork, the web counterpart of the Flutter client's
 * `CoverTheme`: sample the cover's pixels, pick the most vivid well-populated
 * hue, and hand back an OKLCH hue + chroma factor. The `.cover-theme` CSS
 * class turns those two numbers into a full set of M3 roles for light and dark.
 */

export interface CoverSeed {
	/** OKLCH hue, 0–360. */
	hue: number;
	/** 0–1: how colourful the artwork is (grey covers → near 0). */
	chroma: number;
}

/** The brand seed (#818CF8) as a fallback. */
export const BRAND_SEED: CoverSeed = { hue: 277, chroma: 1 };

const toLinear = (c: number) => {
	const v = c / 255;
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** sRGB (0–255) → OKLCH. Lightness 0–1, chroma ≈0–0.37, hue 0–360. */
export function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
	const lr = toLinear(r);
	const lg = toLinear(g);
	const lb = toLinear(b);
	const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
	const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
	const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
	const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
	const c = Math.sqrt(A * A + B * B);
	let h = (Math.atan2(B, A) * 180) / Math.PI;
	if (h < 0) h += 360;
	return { l: L, c, h };
}

const BUCKETS = 36;

/**
 * Pick a seed from RGBA pixel data (e.g. `getImageData` of a downscaled
 * cover). Pixels vote for their hue bucket weighted by chroma, so a small
 * vivid area can beat a large dull one, but near-black / near-white / grey
 * pixels barely count. Returns the brand seed when there is no usable pixel.
 */
export function seedFromPixels(data: ArrayLike<number>): CoverSeed {
	const weight = new Array<number>(BUCKETS).fill(0);
	const sinSum = new Array<number>(BUCKETS).fill(0);
	const cosSum = new Array<number>(BUCKETS).fill(0);
	let total = 0;
	let chromaSum = 0;
	let pixels = 0;

	for (let i = 0; i + 3 < data.length; i += 4) {
		if (data[i + 3] < 128) continue;
		const { l, c, h } = rgbToOklch(data[i], data[i + 1], data[i + 2]);
		pixels++;
		chromaSum += c;
		if (c < 0.03 || l < 0.15 || l > 0.97) continue;
		const w = c * c;
		const b = Math.floor(h / (360 / BUCKETS)) % BUCKETS;
		weight[b] += w;
		const rad = (h * Math.PI) / 180;
		sinSum[b] += Math.sin(rad) * w;
		cosSum[b] += Math.cos(rad) * w;
		total += w;
	}

	if (pixels === 0 || total === 0) return { hue: BRAND_SEED.hue, chroma: pixels === 0 ? 1 : 0 };

	// Smooth over neighbouring buckets so a hue split across a boundary still wins.
	let best = 0;
	let bestScore = -1;
	for (let b = 0; b < BUCKETS; b++) {
		const score = weight[b] + 0.5 * (weight[(b + 1) % BUCKETS] + weight[(b + BUCKETS - 1) % BUCKETS]);
		if (score > bestScore) {
			bestScore = score;
			best = b;
		}
	}
	let hue = (Math.atan2(sinSum[best], cosSum[best]) * 180) / Math.PI;
	if (hue < 0) hue += 360;

	// Average chroma of the cover, mapped so a typical colourful cover is ~1.
	const chroma = Math.min(1, (chromaSum / pixels) / 0.09);
	return { hue: Math.round(hue), chroma: Math.round(chroma * 100) / 100 };
}

/** Deezer CDN URLs at a given square size (other URLs pass through). */
export function sizedCover(url: string, size: number): string {
	return url.replace(/\/\d+x\d+-/, `/${size}x${size}-`);
}
