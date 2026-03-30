/**
 * Web Audio API singleton — shared across AudioEngine and AudioVisualizer.
 * Chain: HTMLAudioElement → MediaElementSource → AnalyserNode → NormGainNode → destination
 *
 * Lazy-initialised on first call to initAudioCtx() (requires a user gesture).
 * Connecting an element routes its output through the Web Audio pipeline;
 * the NormGainNode defaults to 1.0 (no change) when normalization is off.
 */

let _ctx: AudioContext | null = null;
let _analyser: AnalyserNode | null = null;
let _normGain: GainNode | null = null;
const _connected = new WeakSet<HTMLAudioElement>();
const _failed = new WeakSet<HTMLAudioElement>(); // CORS or duplicate-source failures

function _ensureCtx(): boolean {
	if (_ctx) {
		if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
		return _ctx.state !== "closed";
	}
	try {
		_ctx = new AudioContext();
		_analyser = _ctx.createAnalyser();
		_analyser.fftSize = 256;
		_analyser.smoothingTimeConstant = 0.8;
		_normGain = _ctx.createGain();
		_normGain.gain.value = 1.0;
		_analyser.connect(_normGain);
		_normGain.connect(_ctx.destination);
		return true;
	} catch {
		return false;
	}
}

/** Call once after first user gesture to initialise/resume the AudioContext. */
export function initAudioCtx(): boolean {
	return _ensureCtx();
}

/**
 * Route an audio element through the Web Audio chain.
 * Idempotent — safe to call on every timeUpdate.
 * Failed elements (CORS, already-connected errors) are tracked to avoid retries.
 */
export function connectAudioElement(audio: HTMLAudioElement): void {
	if (!_ensureCtx() || !_ctx || !_analyser) return;
	if (_connected.has(audio) || _failed.has(audio)) return;
	try {
		_ctx.createMediaElementSource(audio).connect(_analyser);
		_connected.add(audio);
	} catch {
		_failed.add(audio);
	}
}

/** True if the element is connected OR has permanently failed (so we stop retrying). */
export function isConnectedOrFailed(audio: HTMLAudioElement): boolean {
	return _connected.has(audio) || _failed.has(audio);
}

/** True only if the element is successfully connected and audio flows through Web Audio. */
export function isConnectedToCtx(audio: HTMLAudioElement): boolean {
	return _connected.has(audio);
}

/** Returns the AnalyserNode (null if not yet initialised). Used by AudioVisualizer. */
export function getAnalyser(): AnalyserNode | null {
	return _analyser;
}

/**
 * Measure current RMS amplitude from time-domain data.
 * Returns 0 if the analyser isn't ready or the signal is inaudibly quiet.
 */
export function measureRms(): number {
	if (!_analyser) return 0;
	const buf = new Float32Array(_analyser.fftSize);
	_analyser.getFloatTimeDomainData(buf);
	let sumSq = 0;
	for (const s of buf) sumSq += s * s;
	const rms = Math.sqrt(sumSq / buf.length);
	return rms < 0.001 ? 0 : rms;
}

/**
 * Smoothly set the normalisation gain node.
 * Clamped to [0.2, 2.0] — up to −14 dB reduction or +6 dB boost.
 */
export function applyNormGain(gain: number): void {
	if (!_ctx || !_normGain) return;
	_normGain.gain.setTargetAtTime(
		Math.max(0.2, Math.min(2.0, gain)),
		_ctx.currentTime,
		0.5, // 0.5 s time constant — smooth ~1 s ramp
	);
}

/** Reset the normalisation gain to unity (1.0) smoothly. */
export function resetNormGain(): void {
	if (!_ctx || !_normGain) return;
	_normGain.gain.setTargetAtTime(1.0, _ctx.currentTime, 0.3);
}
