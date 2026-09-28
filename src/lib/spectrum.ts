// ─────────────────────────────────────────────────────────────────────────────
// Helpers that turn raw AnalyserNode frequency data into shapes the fullscreen
// player can draw: a single 0..1 "energy" level (drives the cover glow and the
// play-button halo) and a mirrored bar layout for the visualizer.
// ─────────────────────────────────────────────────────────────────────────────

/** Average energy of the lowest `bins` frequency bins, 0..1. */
export function levelFromFrequencies(freq: ArrayLike<number>, bins = 8): number {
	const n = Math.min(Math.max(1, bins), freq.length);
	if (freq.length === 0) return 0;
	let sum = 0;
	for (let i = 0; i < n; i++) sum += freq[i];
	return Math.min(1, Math.max(0, sum / n / 255));
}

/**
 * Bar heights (0..1) laid out symmetrically: the bass sits in the middle and
 * higher frequencies spread outward on both sides. Only the lower `usable`
 * fraction of the spectrum is sampled — the top bins of music are almost
 * always empty, which made a left-to-right graph look lopsided.
 */
export function mirroredBars(freq: ArrayLike<number>, barCount: number, usable = 0.7): number[] {
	const count = Math.max(0, Math.floor(barCount));
	if (count === 0) return [];
	const half = Math.ceil(count / 2);
	const span = Math.max(1, Math.floor(freq.length * Math.min(1, Math.max(0, usable))));
	const side: number[] = [];
	for (let i = 0; i < half; i++) {
		const idx = Math.min(freq.length - 1, Math.floor((i * span) / half));
		side.push(freq.length ? Math.min(1, Math.max(0, freq[idx] / 255)) : 0);
	}
	// left = outer → center, right = center → outer. Odd counts share the center bar.
	const left = [...side].reverse();
	const right = count % 2 === 0 ? side : side.slice(1);
	return [...left, ...right];
}
