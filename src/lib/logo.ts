// ─────────────────────────────────────────────────────────────────────────────
// The wavelet mark: a single Morlet-style wavelet — a cosine carrier under a
// Gaussian envelope — drawn as one gradient stroke on a dark squircle. Pure so
// the in-app <LogoMark>, the OG image and `scripts/generate-icons.ts` all draw
// the exact same curve.
// ─────────────────────────────────────────────────────────────────────────────

/** Side of the square the mark is drawn in. */
export const LOGO_VIEWBOX = 64;

/** Horizontal stroke gradient, left → right. */
export const LOGO_GRADIENT = ["#38BDF8", "#818CF8", "#F472B6"] as const;

/** Squircle fill, top → bottom. */
export const LOGO_BG = ["#1C1C22", "#08080A"] as const;

export interface WaveletOptions {
	/** Start / end x of the curve. */
	x0?: number;
	x1?: number;
	/** Vertical centre of the mark. */
	cy?: number;
	/** Height of the centre crest above the baseline. */
	amplitude?: number;
	/** Carrier phase, in radians — advance it to make the wavelet travel. */
	phase?: number;
	/** Number of samples along the curve. */
	samples?: number;
}

/** Carrier frequency: crest at the centre, troughs at ±0.4, side crests at ±0.8. */
const OMEGA = 2.5 * Math.PI;
/** Envelope width — the side crests fade to ~20 %, the ends to ~0. */
const SIGMA = 0.45;

/** Half-width of the plotted t range — past the side crests the tails flatten into the baseline. */
const SPAN = 1.18;

/** The wavelet itself. */
export function wavelet(t: number, phase = 0): number {
	return Math.cos(OMEGA * t + phase) * Math.exp(-(t * t) / (2 * SIGMA * SIGMA));
}

/**
 * Baseline offset (as a fraction of the amplitude) that centres the phase-0
 * curve's bounding box on `cy`. Fixed for every phase so an animated mark
 * doesn't bob up and down.
 */
const BASELINE_SHIFT = (() => {
	let lo = Infinity;
	let hi = -Infinity;
	for (let i = 0; i <= 400; i++) {
		const v = wavelet(SPAN * (-1 + (2 * i) / 400));
		lo = Math.min(lo, v);
		hi = Math.max(hi, v);
	}
	return (hi + lo) / 2;
})();

/**
 * Smooth SVG path for the wavelet: sampled points joined with Catmull-Rom
 * splines converted to cubic Béziers. The command count depends only on
 * `samples`, so paths for different phases interpolate cleanly.
 */
export function waveletPath({
	x0 = 9,
	x1 = 55,
	cy = LOGO_VIEWBOX / 2,
	amplitude = 13,
	phase = 0,
	samples = 28,
}: WaveletOptions = {}): string {
	const f = (v: number) => +v.toFixed(2);
	const n = Math.max(2, Math.round(samples));
	const pts: [number, number][] = [];
	for (let i = 0; i <= n; i++) {
		const t = SPAN * (-1 + (2 * i) / n);
		const x = x0 + ((x1 - x0) * i) / n;
		const y = cy - amplitude * (wavelet(t, phase) - BASELINE_SHIFT);
		pts.push([x, y]);
	}

	const parts = [`M${f(pts[0][0])} ${f(pts[0][1])}`];
	for (let i = 0; i < n; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(n, i + 2)];
		const c1x = p1[0] + (p2[0] - p0[0]) / 6;
		const c1y = p1[1] + (p2[1] - p0[1]) / 6;
		const c2x = p2[0] - (p3[0] - p1[0]) / 6;
		const c2y = p2[1] - (p3[1] - p1[1]) / 6;
		parts.push(`C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`);
	}
	return parts.join("");
}

export interface LogoSvgOptions {
	/** Output pixel size (width = height). */
	size?: number;
	/** Fill the whole square (maskable / apple-touch icons) instead of a rounded squircle. */
	fullBleed?: boolean;
	/** Scale of the wave around the centre — < 1 keeps it inside a maskable safe zone. */
	scale?: number;
	/** Stroke width in viewBox units. */
	strokeWidth?: number;
	/** Soft blurred halo behind the stroke — skip it at favicon sizes. */
	glow?: boolean;
}

/** Standalone SVG document for the mark — used to rasterise the icons. */
export function logoSvg({
	size = 512,
	fullBleed = false,
	scale = 1,
	strokeWidth = 5,
	glow = true,
}: LogoSvgOptions = {}): string {
	const v = LOGO_VIEWBOX;
	const c = v / 2;
	const d = waveletPath();
	const [g0, g1, g2] = LOGO_GRADIENT;
	const [b0, b1] = LOGO_BG;
	const shape = fullBleed
		? `<rect width="${v}" height="${v}" fill="url(#bg)"/>`
		: `<rect x="1" y="1" width="${v - 2}" height="${v - 2}" rx="15" fill="url(#bg)"/>` +
			`<rect x="1.5" y="1.5" width="${v - 3}" height="${v - 3}" rx="14.5" fill="none" stroke="#fff" stroke-opacity="0.09"/>`;
	const stroke = (extra: string) =>
		`<path d="${d}" fill="none" stroke="url(#wave)" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${v} ${v}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b0}"/><stop offset="1" stop-color="${b1}"/></linearGradient>
<radialGradient id="sheen" cx="0.3" cy="0.15" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="wave" gradientUnits="userSpaceOnUse" x1="9" y1="0" x2="55" y2="0"><stop offset="0" stop-color="${g0}"/><stop offset="0.5" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient>
${glow ? `<filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter>` : ""}
</defs>
${shape}
${fullBleed ? `<rect width="${v}" height="${v}" fill="url(#sheen)"/>` : `<rect x="1" y="1" width="${v - 2}" height="${v - 2}" rx="15" fill="url(#sheen)"/>`}
<g transform="translate(${c} ${c}) scale(${scale}) translate(${-c} ${-c})">
${glow ? stroke(` opacity="0.7" filter="url(#glow)"`) : ""}
${stroke("")}
</g>
</svg>`;
}
