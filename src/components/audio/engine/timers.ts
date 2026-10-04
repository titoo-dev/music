// Timers AudioEngine schedules for the current track (retry back-off,
// auto-skip after a failure). They are collected in a bag that is cleared
// whenever another track — or a fresh load of the same one — takes over, so
// a callback can never act on an element or a track it wasn't scheduled for.

export interface TimerBag {
	/** Run fn after ms unless cleared first; returns a canceller. */
	after(ms: number, fn: () => void): () => void;
	clear(): void;
	readonly size: number;
}

export function createTimerBag(): TimerBag {
	const pending = new Set<ReturnType<typeof setTimeout>>();
	return {
		after(ms, fn) {
			const id = setTimeout(() => {
				pending.delete(id);
				fn();
			}, ms);
			pending.add(id);
			return () => {
				if (pending.delete(id)) clearTimeout(id);
			};
		},
		clear() {
			for (const id of pending) clearTimeout(id);
			pending.clear();
		},
		get size() {
			return pending.size;
		},
	};
}

/** What a scheduled callback was meant for: load generation, element, track. */
export interface PlaybackTarget {
	gen: number;
	element: object | null;
	trackId: string | null;
}

/** A deferred callback may only act if the engine still plays what it was scheduled for. */
export function sameTarget(scheduled: PlaybackTarget, current: PlaybackTarget): boolean {
	return (
		scheduled.gen === current.gen &&
		scheduled.element === current.element &&
		scheduled.trackId === current.trackId
	);
}

export type SkipReason = "auto" | "user";

/**
 * The "Can't play X" auto-skip. It only ever skips the track that failed:
 * a manual track change, the toast's Skip or Retry, or a second failure
 * cancels the pending skip instead of letting it fire on top.
 */
export function createAutoSkip(deps: {
	timers: TimerBag;
	currentTrackId: () => string | null;
	next: (reason: SkipReason) => void;
}) {
	let cancelPending: (() => void) | null = null;
	const cancel = () => {
		cancelPending?.();
		cancelPending = null;
	};
	return {
		arm(trackId: string, delayMs: number) {
			cancel();
			cancelPending = deps.timers.after(delayMs, () => {
				cancelPending = null;
				if (deps.currentTrackId() === trackId) deps.next("auto");
			});
		},
		/** The toast's "Skip": skip now, once, and only if that track is still current. */
		skipNow(trackId: string) {
			cancel();
			if (deps.currentTrackId() === trackId) deps.next("user");
		},
		cancel,
		get armed() {
			return cancelPending !== null;
		},
	};
}

export type AutoSkip = ReturnType<typeof createAutoSkip>;
