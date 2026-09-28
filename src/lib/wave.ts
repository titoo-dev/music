// ─────────────────────────────────────────────────────────────────────────────
// Sine-wave geometry for the fullscreen player's "living" seek bar: the played
// part of the track ripples while music plays and settles to a flat line when
// paused. Pure so the shape can be unit-tested without a DOM.
// ─────────────────────────────────────────────────────────────────────────────

export interface WaveOptions {
	/** Start / end x of the wave, in px. */
	x0: number;
	x1: number;
	/** Baseline y the wave oscillates around. */
	mid: number;
	/** Peak deviation from `mid`, in px. 0 draws a straight line. */
	amplitude: number;
	/** Distance between two crests, in px. */
	wavelength: number;
	/** Horizontal phase shift, in radians — advance it over time to animate. */
	phase: number;
	/** Sampling step, in px. */
	step?: number;
}

/**
 * SVG path for a sine segment. The amplitude eases in and out over half a
 * wavelength at both ends, so the wave always starts and lands exactly on the
 * baseline and joins the flat "unplayed" line without a kink.
 */
export function wavePath({ x0, x1, mid, amplitude, wavelength, phase, step = 2 }: WaveOptions): string {
	const f = (v: number) => +v.toFixed(2);
	const len = x1 - x0;
	if (len <= 0) return `M${f(x0)} ${f(mid)}`;

	const ramp = Math.max(1, wavelength / 2);
	const k = (2 * Math.PI) / Math.max(1, wavelength);
	const n = Math.max(1, Math.ceil(len / Math.max(0.5, step)));
	const parts: string[] = [];
	for (let i = 0; i <= n; i++) {
		const x = x0 + (len * i) / n;
		const taper = Math.min(1, (x - x0) / ramp, (x1 - x) / ramp);
		const y = mid + Math.sin((x - x0) * k - phase) * amplitude * Math.max(0, taper);
		parts.push(`${i === 0 ? "M" : "L"}${f(x)} ${f(y)}`);
	}
	return parts.join(" ");
}
