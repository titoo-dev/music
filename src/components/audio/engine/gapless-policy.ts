// When AudioEngine plays on the gapless deck, and which track a run goes on
// with. Pure so the rules are unit-tested apart from the React wiring.

import { classifySource } from "./source";

/** Line up the next track from halfway through the current one, or this long before its end. */
export const NEXT_LEAD_S = 60;

export interface GaplessSettings {
	gapless: boolean;
	crossfadeDuration: number;
	repeat: "off" | "all" | "one";
}

/**
 * Gapless runs are wanted: the setting is on, with no crossfade (that one
 * overlaps tracks instead) and no repeat-one (the "next" track is the same
 * one again), in a browser with MSE for MP3, and no deck failure earlier in
 * this run.
 */
export function wantsGapless(s: GaplessSettings, env: { supported: boolean; blocked: boolean }): boolean {
	return s.gapless && s.crossfadeDuration === 0 && s.repeat !== "one" && env.supported && !env.blocked;
}

/** The track a run goes on with: the queue's next one (never wrapping around), unless it was refused. */
export function nextInRun(
	s: GaplessSettings & { queue: ReadonlyArray<{ trackId: string }>; queueIndex: number },
	declined: ReadonlySet<string>
): string | null {
	if (!wantsGapless(s, { supported: true, blocked: false })) return null;
	const next = s.queue[s.queueIndex + 1];
	return next && !declined.has(next.trackId) ? next.trackId : null;
}

/** Time to line up the next track: from halfway, or in the last NEXT_LEAD_S seconds. */
export function gaplessNextDue(trackTime: number, duration: number): boolean {
	return duration > 0 && (trackTime / duration >= 0.5 || duration - trackTime <= NEXT_LEAD_S);
}

/** A copy that may play on the deck: IndexedDB blob or presigned R2 URL, never the live stream. */
export function isDeckSource(url: string | null | undefined, pageOrigin?: string): url is string {
	const kind = classifySource(url, pageOrigin);
	return kind === "blob" || kind === "presigned";
}
