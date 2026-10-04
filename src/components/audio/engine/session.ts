// Per-track playback state for AudioEngine. Every flag that must start over
// when a new track becomes current lives in one TrackSession object, so an
// activation path (load, preload hit, crossfade, handoff, retry) can't
// forget to reset one of them: starting a track = replacing the session.

import { isPreviewSource } from "@/lib/seek";

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
	/** persistInBackground() was already opened for this play. */
	persistRequested: boolean;
	/** Seconds actually played (seeks and pauses excluded). */
	listened: number;
	/** Playback position at the previous timeupdate (null = none yet). */
	lastPosition: number | null;
	/** The source playback last started from (the "playing" event). */
	playedFrom: string | null;
	/** The engine gave up on this track (retries exhausted). */
	failed: boolean;
}

export function createTrackSession(trackId: string, opts: { autoAdvance?: boolean } = {}): TrackSession {
	return {
		trackId,
		autoAdvance: !!opts.autoAdvance,
		logged: false,
		retryCount: 0,
		resigned: false,
		persistRequested: false,
		listened: 0,
		lastPosition: null,
		playedFrom: null,
		failed: false,
	};
}

/** Longest gap between two timeupdates still counted as continuous playback. */
export const MAX_LISTEN_TICK_SECONDS = 2;

/**
 * Add the time played since the previous timeupdate. A jump forward (seek)
 * or backward isn't listening; neither is a gap longer than a normal tick.
 */
export function accumulateListened(session: TrackSession, position: number): void {
	const prev = session.lastPosition;
	session.lastPosition = position;
	if (prev === null || !isFinite(position)) return;
	const delta = position - prev;
	if (delta > 0 && delta <= MAX_LISTEN_TICK_SECONDS) session.listened += delta;
}

/** The track was listened to long enough to count as a play (Spotify's 30 s rule). */
export function reachedPlayThreshold(session: TrackSession): boolean {
	return session.listened >= PLAY_THRESHOLD_SECONDS;
}

/**
 * A track playing from a preview stream (hover / queue preload) isn't being
 * stored by the server. Persisting it is only worth it for the track that is
 * actually playing — once per play, however many seeks or thresholds ask.
 */
export function claimBackgroundPersist(session: TrackSession | null, src: string): boolean {
	if (!session || session.persistRequested || !isPreviewSource(src)) return false;
	session.persistRequested = true;
	return true;
}

/**
 * Ask the server to evict the file of a track left before it counted as a
 * play (the skip endpoint keeps anything still referenced). Not for a track
 * that failed (the user didn't skip it), nor one that only played from a
 * preview stream — that play never stored anything.
 */
export function shouldNotifySkip(session: TrackSession | null): session is TrackSession {
	if (!session || session.logged || session.failed) return false;
	return !(session.playedFrom && isPreviewSource(session.playedFrom));
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
