// Timeline maths of the gapless deck: where each track of a gapless run sits
// on the one Media Source timeline, and what the SourceBuffer should do
// next (append, remove, end the stream). Pure: no MediaSource, no DOM.
//
// A track's music starts on the exact sample after the previous one ends.
// Its frames are placed with timestampOffset so that the encoder delay falls
// before that point, and the append window [start, end) trims the delay and
// the padding off (the browser trims partial frames to the sample).

import type { TimeRangesLike } from "@/lib/seek";
import type { GaplessInfo } from "./mp3-gapless";

/**
 * Samples the browser's MP3 decoder outputs ahead of the encoder's first
 * sample, on top of the encoder delay. A standalone decoder adds 529 (LAME
 * tag spec); Chrome's MSE pipeline already removes them. Measured in headless
 * Chrome on real Deezer files ("LAME3.99r" and "Lame3.100" tags): with 0 the
 * join matches the reference decode to float precision, with 529 it leaves a
 * 3-8 ms hole at every boundary.
 */
export const DECODER_DELAY = 0;

export interface Placement {
	/** Timeline second where the track's first sample of music plays. */
	start: number;
	/** Timeline second where its music ends: the next track's start. */
	end: number;
	/** Timeline second of audio frame 0 (the timestampOffset of an append from frame 0). */
	frameZero: number;
	frameDuration: number;
	/** Frames that reach into [start, end): the ones worth appending. */
	frames: number;
}

type TrackTiming = Pick<GaplessInfo, "sampleRate" | "samplesPerFrame" | "frameCount" | "encoderDelay" | "totalSamples">;

/** Place a track whose music starts at timeline second `start`. */
export function placeTrack(info: TrackTiming, start: number, decoderDelay = DECODER_DELAY): Placement {
	const lead = info.encoderDelay + decoderDelay;
	return {
		start,
		end: start + info.totalSamples / info.sampleRate,
		frameZero: start - lead / info.sampleRate,
		frameDuration: info.samplesPerFrame / info.sampleRate,
		frames: Math.min(info.frameCount, Math.ceil((lead + info.totalSamples) / info.samplesPerFrame)),
	};
}

/** Can `b` follow `a` on one SourceBuffer without a decoder reconfiguration? */
export function canJoin(
	a: Pick<GaplessInfo, "sampleRate" | "channels" | "samplesPerFrame">,
	b: Pick<GaplessInfo, "sampleRate" | "channels" | "samplesPerFrame">
): boolean {
	return a.sampleRate === b.sampleRate && a.channels === b.channels && a.samplesPerFrame === b.samplesPerFrame;
}

export function frameTime(p: Placement, frame: number): number {
	return p.frameZero + frame * p.frameDuration;
}

/** The frame playing at timeline second `t`, clamped to the frames worth appending. */
export function frameIndexAt(p: Placement, t: number): number {
	const i = Math.floor((t - p.frameZero) / p.frameDuration + 1e-6);
	return Math.min(Math.max(i, 0), p.frames - 1);
}

/** Track-relative time of timeline second `t`. */
export function trackTimeAt(p: Placement, t: number): number {
	return Math.min(Math.max(t - p.start, 0), p.end - p.start);
}

/** Two timeline instants this close are the same point (MSE keeps microseconds). */
export const TIME_EPSILON = 0.002;
/** A playhead this close before a buffered range still plays from it. */
const RANGE_SLACK = 0.05;

/** The buffered range the playhead `t` plays from, if any. */
export function rangeAround(buffered: TimeRangesLike, t: number): { start: number; end: number } | null {
	for (let i = 0; i < buffered.length; i++) {
		const start = buffered.start(i);
		const end = buffered.end(i);
		if (start <= t + RANGE_SLACK && end >= t - TIME_EPSILON) return { start, end };
	}
	return null;
}

function bufferedSeconds(buffered: TimeRangesLike): number {
	let total = 0;
	for (let i = 0; i < buffered.length; i++) total += buffered.end(i) - buffered.start(i);
	return total;
}

export interface PumpSegment {
	placement: Placement;
	/** Complete frames loaded so far. */
	available: number;
	/** Nothing more will load: `available` is every frame there is. */
	complete: boolean;
}

/** Where the next append goes: it continues the data buffered up to there. */
export interface PumpCursor {
	segment: PumpSegment;
	frame: number;
}

export interface PumpInput {
	playhead: number;
	buffered: TimeRangesLike;
	/** The track under the playhead, then the next one when it joined the run. */
	segments: readonly PumpSegment[];
	/** No further track joins the run: end the stream after the last one. */
	final: boolean;
	/** endOfStream() already ran (and nothing was appended since). */
	ended: boolean;
	/** Where the previous append stopped; null = nothing buffered to continue (start, seek reset). */
	cursor: PumpCursor | null;
	/** Keep this much buffered ahead of the playhead. */
	aheadS: number;
	/** Keep this much behind the playhead when room is needed. */
	behindS: number;
	/** Most seconds the SourceBuffer may hold (its byte quota at this bitrate, with a margin). */
	budgetS: number;
	/** Frames per appendBuffer() call. */
	chunkFrames: number;
}

/**
 * Where an append that doesn't continue the previous one goes. The window
 * opens at the track's first sample (the encoder delay is cut off, to the
 * sample) and closes at the end of its last frame of music: Chrome drops a
 * frame that crosses appendWindowEnd instead of trimming it, so the padding
 * in that frame stays and the next track's first frames, appended over it,
 * cut it off at the exact sample.
 */
export interface Reposition {
	timestampOffset: number;
	windowStart: number;
	windowEnd: number;
}

export type PumpAction =
	| { kind: "append"; segment: PumpSegment; from: number; to: number; reposition: Reposition | null }
	| { kind: "remove"; start: number; end: number }
	| { kind: "end-of-stream" }
	/** Waiting for bytes to load, or for the playhead to free room. */
	| { kind: "wait" }
	| { kind: "idle" }
	/** The segment's file ended before its last frame of music. */
	| { kind: "truncated"; segment: PumpSegment }
	/** The budget is full, nothing is left to free and the playhead is about to run dry. */
	| { kind: "out-of-room" };

export function repositionFor(p: Placement, frame: number): Reposition {
	return { timestampOffset: frameTime(p, frame), windowStart: p.start, windowEnd: frameTime(p, p.frames) };
}

/**
 * The next SourceBuffer operation. Appends run chunk by chunk from the
 * cursor — through the end of the current track straight into the next one
 * — until `aheadS` past the playhead is covered or the run ends; data far
 * behind the playhead is removed only when the budget needs room.
 */
export function planPump(s: PumpInput): PumpAction {
	const { segments } = s;
	if (segments.length === 0) return { kind: "idle" };
	let segment: PumpSegment;
	let frame: number;
	let reposition = false;
	if (s.cursor && segments.includes(s.cursor.segment)) {
		({ segment, frame } = s.cursor);
	} else {
		// Nothing to continue: start at the playhead.
		segment = segments[0];
		frame = frameIndexAt(segment.placement, Math.max(s.playhead, segment.placement.start));
		reposition = true;
	}
	if (frame >= segment.placement.frames) {
		const next = segments[segments.indexOf(segment) + 1];
		if (!next) return s.final && !s.ended ? { kind: "end-of-stream" } : { kind: "idle" };
		segment = next;
		frame = 0;
		reposition = true;
	}
	const p = segment.placement;
	if (Math.max(frameTime(p, frame), p.start) >= s.playhead + s.aheadS) return { kind: "idle" };
	if (frame >= segment.available) return segment.complete ? { kind: "truncated", segment } : { kind: "wait" };
	const to = Math.min(frame + s.chunkFrames, segment.available, p.frames);

	if (bufferedSeconds(s.buffered) + (to - frame) * p.frameDuration > s.budgetS) {
		const first = s.buffered.length ? s.buffered.start(0) : s.playhead;
		const cut = s.playhead - s.behindS;
		if (cut > first + 1) return { kind: "remove", start: first, end: cut };
		const around = rangeAround(s.buffered, s.playhead);
		return !around || around.end - s.playhead < 1 ? { kind: "out-of-room" } : { kind: "wait" };
	}
	return { kind: "append", segment, from: frame, to, reposition: reposition ? repositionFor(p, frame) : null };
}
