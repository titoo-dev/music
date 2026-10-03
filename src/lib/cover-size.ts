/**
 * Right-sizing for cover art (used by `CoverImage`).
 *
 * Deezer CDN covers carry their size in the path (`/250x250-000000-80-0-0.jpg`)
 * and are resized on request. A 48px track-row thumbnail used to fetch the
 * 1000px variant (~150 KB); asking for the bucket that matches the rendered
 * size cuts that by an order of magnitude.
 */

/** Sizes requested from the CDN — few, so the browser cache gets reused. */
export const COVER_SIZES = [56, 120, 250, 500, 1000] as const;

/** Edge of the blurred stand-in shown while a large cover loads (~1 KB). */
export const PLACEHOLDER_SIZE = 32;

/** Covers at or above this size get a blurred placeholder first; smaller ones just fade in. */
export const PLACEHOLDER_MIN = 250;

const SIZE_SEGMENT = /\/\d+x\d+-/;

/** True for CDN URLs whose size can be rewritten. */
export function isSizedCover(url: string): boolean {
	return SIZE_SEGMENT.test(url);
}

/** The cover URL at `size`×`size` (unchanged for URLs without a size segment). */
export function coverAt(url: string, size: number): string {
	return url.replace(SIZE_SEGMENT, `/${size}x${size}-`);
}

/** The smallest bucket that covers `cssPx` on a `dpr` screen. */
export function pickCoverSize(cssPx: number, dpr: number = 1): number {
	const needed = cssPx * Math.max(1, dpr);
	return COVER_SIZES.find((s) => s >= needed) ?? COVER_SIZES[COVER_SIZES.length - 1];
}
