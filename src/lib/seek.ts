// Seek helpers for AudioEngine. Kept free of DOM / store imports so the
// decision logic can be unit-tested without an HTMLAudioElement.

/** Structural subset of the DOM TimeRanges interface. */
export interface TimeRangesLike {
	readonly length: number;
	start(index: number): number;
	end(index: number): number;
}

/**
 * The live Deezer stream is served with `Accept-Ranges: none`: the browser
 * cannot fetch from an arbitrary offset, so a seek outside what it already
 * holds restarts the track from 0. Every other source (presigned Blob URL,
 * /api/v1/stream, IndexedDB blob: URL) supports byte ranges.
 */
export function isRangelessSource(src: string): boolean {
	return src.includes("/api/v1/stream-progressive/");
}

/** Preview streams (hover / head prefetch) never persist to Blob on their own. */
export function isPreviewSource(src: string): boolean {
	return isRangelessSource(src) && /[?&]preview=1(?:&|$)/.test(src);
}

export function inRanges(t: number, ranges: TimeRangesLike): boolean {
	for (let i = 0; i < ranges.length; i++) {
		if (t >= ranges.start(i) && t <= ranges.end(i)) return true;
	}
	return false;
}

/**
 * Did the browser get byte ranges for the live stream? Contract C2: when the
 * Deezer CDN allows it, /stream-progressive answers Range requests (206,
 * Content-Length, Accept-Ranges: bytes) and the browser then reports the
 * whole track as seekable — beyond what it buffered. A stream without
 * ranges reports at most its buffer (Firefox) or [0, 0] (Chrome).
 */
export function isRangeCapable(seekable: TimeRangesLike, buffered: TimeRangesLike, duration: number): boolean {
	if (!isFinite(duration) || duration <= 0 || seekable.length === 0) return false;
	const end = seekable.end(seekable.length - 1);
	if (seekable.start(0) > 0.5 || end < duration - 0.5) return false;
	const bufferedEnd = buffered.length ? buffered.end(buffered.length - 1) : 0;
	return end > bufferedEnd + 0.5;
}

/**
 * Can `audio.currentTime = target` be applied to the current element? On a
 * range-less stream only positions the browser both buffered and reports as
 * seekable are safe — anything else snaps playback back to the start. A live
 * stream that got byte ranges (C2, see isRangeCapable — needs `duration`)
 * seeks in place anywhere it reports seekable.
 */
export function canSeekInPlace(opts: {
	src: string;
	target: number;
	seekable: TimeRangesLike;
	buffered: TimeRangesLike;
	duration?: number;
}): boolean {
	if (!isRangelessSource(opts.src)) return true;
	if (inRanges(opts.target, opts.buffered) && inRanges(opts.target, opts.seekable)) return true;
	return (
		opts.duration !== undefined &&
		isRangeCapable(opts.seekable, opts.buffered, opts.duration) &&
		inRanges(opts.target, opts.seekable)
	);
}

/**
 * After an in-place seek on the live stream: did playback land near the
 * target? A browser that wrongly believed the stream seekable restarts it
 * from 0 instead — the caller then falls back to the persisted file.
 */
export function seekLanded(target: number, currentTime: number, tolerance = 3): boolean {
	return currentTime >= target - tolerance;
}

/**
 * What to do with a position to resume at once an element can play
 * (session restore, retry, source swap):
 *   "skip"       nothing to resume (at or past the end; unknown length on a
 *                range-capable source)
 *   "in-place"   set currentTime
 *   "via-file"   the live stream can't get there: wait for the stored file
 *   "from-start" the stored file never came (`lastResort`): play from the
 *                start, and say so
 * The live stream is served without Content-Length, so its duration is often
 * unknown at canplay: it still can't seek past its buffer (was: the position
 * was dropped and the track restarted at 0 without a word).
 */
export type ResumePlan = "skip" | "in-place" | "via-file" | "from-start";

export function planResume(opts: {
	resume: number;
	src: string;
	duration: number;
	seekable: TimeRangesLike;
	buffered: TimeRangesLike;
	lastResort?: boolean;
}): ResumePlan {
	const known = isFinite(opts.duration) && opts.duration > 0;
	if (known ? opts.resume >= opts.duration - 1 : !isRangelessSource(opts.src)) return "skip";
	const inPlace = canSeekInPlace({
		src: opts.src,
		target: opts.resume,
		seekable: opts.seekable,
		buffered: opts.buffered,
		duration: known ? opts.duration : undefined,
	});
	if (inPlace) return "in-place";
	return opts.lastResort ? "from-start" : "via-file";
}

/**
 * Poll `resolve` until it yields a range-capable URL (the track finished
 * persisting to storage), the wait is cancelled, or the timeout elapses.
 * Returns null when no URL showed up in time or the wait was cancelled.
 * With `maxIntervalMs` the delay grows by half each round up to that cap
 * (was: one /stream-url call per second for the whole persist).
 */
export async function waitForSeekableUrl(opts: {
	resolve: () => Promise<string | null>;
	isCancelled: () => boolean;
	intervalMs?: number;
	maxIntervalMs?: number;
	timeoutMs?: number;
	sleep?: (ms: number) => Promise<void>;
	now?: () => number;
}): Promise<string | null> {
	const {
		resolve,
		isCancelled,
		intervalMs = 1000,
		timeoutMs = 60_000,
		sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
		now = Date.now,
	} = opts;
	const maxIntervalMs = Math.max(intervalMs, opts.maxIntervalMs ?? intervalMs);
	const deadline = now() + timeoutMs;
	let delay = intervalMs;
	while (!isCancelled()) {
		const url = await resolve().catch(() => null);
		if (isCancelled()) return null;
		if (url) return url;
		if (now() + delay > deadline) return null;
		await sleep(delay);
		delay = Math.min(maxIntervalMs, Math.round(delay * 1.5));
	}
	return null;
}
