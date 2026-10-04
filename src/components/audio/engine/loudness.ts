// Loudness normalisation for one track: average the level over several
// seconds of real playback, then derive one gain for the track (was: one
// 256-sample snapshot at t = 3 s on the shared analyser — a near-random gain).

import { NORM_MAX_GAIN, NORM_MIN_GAIN } from "@/utils/audio-context";

/** −18.4 dBFS RMS, ≈ −14 LUFS for most music. */
export const NORM_TARGET_RMS = 0.12;
/** Below this the sample is silence (intro, gap) and doesn't count. */
const SILENCE_RMS = 0.001;

export interface LoudnessMeter {
	/** One level reading taken at playback position `at` (seconds). */
	add(level: { rms: number; peak: number }, at: number): void;
	/** Enough audible signal was averaged to decide. */
	readonly ready: boolean;
	/** The track's gain (clamped to ±6 dB, never clipping its peak), or null until ready. */
	gain(): number | null;
}

export function createLoudnessMeter(
	opts: { fromSeconds?: number; spanSeconds?: number; minSamples?: number } = {}
): LoudnessMeter {
	const { fromSeconds = 1, spanSeconds = 6, minSamples = 12 } = opts;
	let sumSq = 0;
	let count = 0;
	let peak = 0;
	let first: number | null = null;
	let last = 0;

	const meter: LoudnessMeter = {
		add(level, at) {
			if (at < fromSeconds || !isFinite(level.rms) || level.rms < SILENCE_RMS) return;
			sumSq += level.rms * level.rms;
			count++;
			peak = Math.max(peak, level.peak);
			first ??= at;
			last = at;
		},
		get ready() {
			return first !== null && count >= minSamples && last - first >= spanSeconds;
		},
		gain() {
			if (!meter.ready) return null;
			const rms = Math.sqrt(sumSq / count);
			let g = NORM_TARGET_RMS / rms;
			// A boost must not push the loudest sample seen past full scale.
			if (peak > 0) g = Math.min(g, 0.98 / peak);
			return Math.min(NORM_MAX_GAIN, Math.max(NORM_MIN_GAIN, g));
		},
	};
	return meter;
}
