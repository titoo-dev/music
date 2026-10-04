// Per-track playback state for AudioEngine. Every flag that must start over
// when a new track becomes current lives in one TrackSession object, so an
// activation path (load, preload hit, crossfade, handoff, retry) can't
// forget to reset one of them: starting a track = replacing the session.

/** Spotify rule: a play counts once this much of the track was listened to. */
export const PLAY_THRESHOLD_SECONDS = 30;

export interface TrackSession {
	readonly trackId: string;
	/** Started by the queue (track ended, crossfade, auto-skip) rather than by the user. */
	autoAdvance: boolean;
	/** The 30 s play was logged (POST /recent-plays). */
	logged: boolean;
	/** Retries burnt on the live stream for this track. */
	retryCount: number;
	/** A fresh presigned URL was already tried after an error. */
	resigned: boolean;
}

export function createTrackSession(trackId: string, opts: { autoAdvance?: boolean } = {}): TrackSession {
	return {
		trackId,
		autoAdvance: !!opts.autoAdvance,
		logged: false,
		retryCount: 0,
		resigned: false,
	};
}

/**
 * Ask the server to evict the file of a track left before it counted as a
 * play (the skip endpoint keeps anything still referenced).
 */
export function shouldNotifySkip(session: TrackSession | null): boolean {
	return !!session && !session.logged;
}

/**
 * Advance the queue. `auto` marks the move as the queue's own (track ended,
 * auto-skip) so the next track starts without a fade-in; the flag is dropped
 * again when next() didn't start another track (queue exhausted → stop).
 */
export function advanceQueue(
	autoAdvanceRef: { current: boolean },
	auto: boolean,
	store: { getState(): { currentTrack: unknown; next(): void } }
): void {
	const before = store.getState().currentTrack;
	autoAdvanceRef.current = auto;
	store.getState().next();
	const after = store.getState().currentTrack;
	if (!after || after === before) autoAdvanceRef.current = false;
}

/**
 * Volume ramp for the first play() of a track. A user-initiated start fades
 * in; a queue advance starts at full volume so the gap between two tracks
 * doesn't get a 200 ms dip on top of it.
 */
export function startVolume(autoAdvance: boolean, target: number): { from: number; fadeMs: number } {
	return autoAdvance ? { from: target, fadeMs: 0 } : { from: 0, fadeMs: 200 };
}
