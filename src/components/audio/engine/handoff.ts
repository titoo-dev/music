// Head → full handoff. A head-prefetched element (~64 KB from
// /stream-progressive?preview=1&head=1) runs out after a few seconds; the
// full stream is opened right away and takes over just before the head ends.
// The handoff is cancellable: a track change, a reload or a stop before the
// swap discards the full stream (was: it kept downloading until the page
// closed, since only the swap ever cleaned it up).

/** The bits of an <audio> element the handoff needs (structural, for tests). */
export interface HandoffElement {
	currentTime: number;
	readonly duration: number;
	readonly paused: boolean;
	addEventListener(type: "timeupdate" | "ended", fn: () => void): void;
	removeEventListener(type: "timeupdate" | "ended", fn: () => void): void;
}

export function startHandoff<E extends HandoffElement>(deps: {
	head: E;
	full: E;
	/** The head is still the engine's current element (same load generation). */
	stillCurrent: () => boolean;
	/** Make `full` the current element at the head's position. */
	swap: (full: E, at: { position: number; wasPlaying: boolean }) => void;
	/** Stop and drop an element that will never play. */
	discard: (el: E) => void;
	/** Swap this long before the head ends. */
	leadSeconds?: number;
}): () => void {
	const { head, full, leadSeconds = 0.3 } = deps;
	let done = false;

	const finish = () => {
		done = true;
		head.removeEventListener("timeupdate", onTimeUpdate);
		head.removeEventListener("ended", onEnded);
	};

	const swapNow = () => {
		if (done) return;
		finish();
		if (!deps.stillCurrent()) {
			deps.discard(full);
			return;
		}
		deps.swap(full, { position: head.currentTime || 0, wasPlaying: !head.paused });
	};

	// Swap shortly before the head ends; the ended event covers a coarse
	// timeupdate that skipped past the lead.
	const onTimeUpdate = () => {
		const dur = head.duration;
		if (!isFinite(dur) || dur <= 0) return;
		if (head.currentTime > dur - leadSeconds) swapNow();
	};
	const onEnded = () => swapNow();

	head.addEventListener("timeupdate", onTimeUpdate);
	head.addEventListener("ended", onEnded);

	return () => {
		if (done) return;
		finish();
		deps.discard(full);
	};
}
