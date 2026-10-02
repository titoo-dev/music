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
 * Can `audio.currentTime = target` be applied to the current element? On a
 * range-less stream only positions the browser both buffered and reports as
 * seekable are safe — anything else snaps playback back to the start.
 */
export function canSeekInPlace(opts: {
	src: string;
	target: number;
	seekable: TimeRangesLike;
	buffered: TimeRangesLike;
}): boolean {
	if (!isRangelessSource(opts.src)) return true;
	return inRanges(opts.target, opts.buffered) && inRanges(opts.target, opts.seekable);
}

/**
 * Poll `resolve` until it yields a range-capable URL (the track finished
 * persisting to Blob), the wait is cancelled, or the timeout elapses.
 * Returns null when no URL showed up in time or the wait was cancelled.
 */
export async function waitForSeekableUrl(opts: {
	resolve: () => Promise<string | null>;
	isCancelled: () => boolean;
	intervalMs?: number;
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
	const deadline = now() + timeoutMs;
	while (!isCancelled()) {
		const url = await resolve().catch(() => null);
		if (isCancelled()) return null;
		if (url) return url;
		if (now() + intervalMs > deadline) return null;
		await sleep(intervalMs);
	}
	return null;
}
