import { describe, it, expect } from "vitest";
import {
	DECODER_DELAY,
	canJoin,
	frameIndexAt,
	frameTime,
	placeTrack,
	planPump,
	rangeAround,
	repositionFor,
	trackTimeAt,
	type PumpInput,
	type PumpSegment,
} from "./gapless-timeline";

const SR = 44100;
const FD = 1152 / SR;
// "Robot Rock / Oh Yeah" (Alive 2007): 14836 frames, delay 576, padding 1452.
const ROBOT = { sampleRate: SR, samplesPerFrame: 1152, frameCount: 14836, encoderDelay: 576, totalSamples: 14836 * 1152 - 576 - 1452 };
// "Speak to Me": 2502 frames, delay 576, padding 1362.
const SPEAK = { sampleRate: SR, samplesPerFrame: 1152, frameCount: 2502, encoderDelay: 576, totalSamples: 2502 * 1152 - 576 - 1362 };

type Ranges = PumpInput["buffered"];
const ranges = (...pairs: [number, number][]): Ranges => ({
	length: pairs.length,
	start: (i) => pairs[i][0],
	end: (i) => pairs[i][1],
});

describe("placeTrack", () => {
	it("starts the music at `start` and puts the encoder delay before it (decoder delay as measured in Chrome: 0)", () => {
		expect(DECODER_DELAY).toBe(0);
		const p = placeTrack(ROBOT, 0);
		expect(p.start).toBe(0);
		expect(p.frameZero).toBeCloseTo(-576 / SR, 12);
		expect(p.end).toBeCloseTo(387.506667, 6);
		expect(p.frameDuration).toBeCloseTo(FD, 12);
		// The last frame is all padding (1452 > 1152): not worth appending.
		expect(p.frames).toBe(14835);
	});

	it("lays the next track's first sample on the previous one's last", () => {
		const a = placeTrack(SPEAK, 0);
		const b = placeTrack(ROBOT, a.end);
		expect(b.start).toBe(a.end);
		expect(b.frameZero).toBeCloseTo(a.end - 576 / SR, 12);
		// A decoder delay pushes the frames earlier still.
		expect(placeTrack(ROBOT, 10, 529).frameZero).toBeCloseTo(10 - 1105 / SR, 12);
	});

	it("keeps every frame when the padding is shorter than a frame", () => {
		expect(placeTrack({ ...SPEAK, totalSamples: 2502 * 1152 - 576 - 200 }, 0).frames).toBe(2502);
	});
});

describe("timeline helpers", () => {
	const p = placeTrack(ROBOT, 100);

	it("frameTime / frameIndexAt are inverse, clamped to the frames worth appending", () => {
		expect(frameTime(p, 0)).toBe(p.frameZero);
		expect(frameIndexAt(p, frameTime(p, 40))).toBe(40);
		expect(frameIndexAt(p, frameTime(p, 40) + FD / 2)).toBe(40);
		expect(frameIndexAt(p, -5)).toBe(0);
		expect(frameIndexAt(p, 1e9)).toBe(p.frames - 1);
	});

	it("trackTimeAt maps the timeline to the track, clamped to it", () => {
		expect(trackTimeAt(p, 130)).toBeCloseTo(30, 9);
		expect(trackTimeAt(p, 50)).toBe(0);
		expect(trackTimeAt(p, 1e9)).toBeCloseTo(p.end - p.start, 9);
	});

	it("rangeAround finds the range the playhead plays from", () => {
		const r = ranges([0, 10], [20, 30]);
		expect(rangeAround(r, 5)).toEqual({ start: 0, end: 10 });
		expect(rangeAround(r, 19.97)).toEqual({ start: 20, end: 30 });
		expect(rangeAround(r, 15)).toBeNull();
	});

	it("canJoin: same rate, channels and frame size", () => {
		const a = { sampleRate: SR, channels: 2 as const, samplesPerFrame: 1152 };
		expect(canJoin(a, { ...a })).toBe(true);
		expect(canJoin(a, { ...a, sampleRate: 48000 })).toBe(false);
		expect(canJoin(a, { ...a, channels: 1 })).toBe(false);
	});

	it("repositionFor opens the window at the music and closes it at the end of the last music frame", () => {
		expect(repositionFor(p, 7)).toEqual({ timestampOffset: frameTime(p, 7), windowStart: 100, windowEnd: frameTime(p, p.frames) });
		expect(frameTime(p, p.frames)).toBeGreaterThan(p.end);
	});
});

describe("planPump", () => {
	const a: PumpSegment = { placement: placeTrack(SPEAK, 0), available: 2502, complete: true };
	const b: PumpSegment = { placement: placeTrack(ROBOT, a.placement.end), available: 14836, complete: true };
	const base: PumpInput = {
		playhead: 0,
		buffered: ranges(),
		segments: [a],
		final: false,
		ended: false,
		cursor: null,
		aheadS: 60,
		behindS: 20,
		budgetS: 600,
		chunkFrames: 192,
	};
	const plan = (o: Partial<PumpInput>) => planPump({ ...base, ...o });

	it("starts at the playhead, placing the frames", () => {
		expect(plan({})).toEqual({ kind: "append", segment: a, from: 0, to: 192, reposition: repositionFor(a.placement, 0) });
		const mid = plan({ playhead: 30 });
		expect(mid).toMatchObject({ kind: "append", from: frameIndexAt(a.placement, 30) });
		expect(mid.kind === "append" && mid.reposition?.timestampOffset).toBeCloseTo(frameTime(a.placement, frameIndexAt(a.placement, 30)), 9);
	});

	it("continues from the cursor without touching the placement", () => {
		expect(plan({ cursor: { segment: a, frame: 192 }, buffered: ranges([0, 5]) })).toEqual({
			kind: "append",
			segment: a,
			from: 192,
			to: 384,
			reposition: null,
		});
	});

	it("stops at the frames worth appending", () => {
		expect(plan({ playhead: 60, cursor: { segment: a, frame: 2490 } })).toMatchObject({ kind: "append", from: 2490, to: a.placement.frames });
	});

	it("idles once enough is buffered ahead", () => {
		expect(plan({ cursor: { segment: a, frame: 2400 }, buffered: ranges([0, 62]) })).toEqual({ kind: "idle" });
	});

	it("goes straight from the end of a track into the next one, placed at its first sample", () => {
		expect(plan({ playhead: 50, segments: [a, b], cursor: { segment: a, frame: a.placement.frames } })).toEqual({
			kind: "append",
			segment: b,
			from: 0,
			to: 192,
			reposition: repositionFor(b.placement, 0),
		});
	});

	it("ends the stream after the last track of a finished run — once", () => {
		const done = { cursor: { segment: a, frame: a.placement.frames }, playhead: 60 };
		expect(plan({ ...done, final: true })).toEqual({ kind: "end-of-stream" });
		expect(plan({ ...done, final: true, ended: true })).toEqual({ kind: "idle" });
		expect(plan({ ...done, final: false })).toEqual({ kind: "idle" });
	});

	it("waits for bytes still loading; a file that ended early is truncated", () => {
		const loading = { ...a, available: 100, complete: false };
		expect(plan({ segments: [loading], cursor: { segment: loading, frame: 100 } })).toEqual({ kind: "wait" });
		const short = { ...a, available: 100, complete: true };
		expect(plan({ segments: [short], cursor: { segment: short, frame: 100 } })).toEqual({ kind: "truncated", segment: short });
	});

	it("starts over at the playhead when the cursor's track left the run", () => {
		expect(plan({ playhead: 10, cursor: { segment: b, frame: 5 } })).toMatchObject({ segment: a, from: frameIndexAt(a.placement, 10) });
	});

	it("frees room behind the playhead when the budget is full", () => {
		const full = { budgetS: 60, playhead: 40, buffered: ranges([0, 59]), cursor: { segment: a, frame: 2300 } };
		expect(plan(full)).toEqual({ kind: "remove", start: 0, end: 20 });
	});

	it("waits for the playhead when nothing is left to free, and gives up when it is about to run dry", () => {
		const full = { budgetS: 60, playhead: 10, cursor: { segment: a, frame: 2300 } };
		expect(plan({ ...full, buffered: ranges([0, 59]) })).toEqual({ kind: "wait" });
		expect(plan({ ...full, playhead: 58.5, behindS: 60, buffered: ranges([0, 59]) })).toEqual({ kind: "out-of-room" });
		expect(plan({ ...full, budgetS: 1, buffered: ranges() })).toEqual({ kind: "out-of-room" });
	});

	it("idles with no track at all", () => {
		expect(plan({ segments: [] })).toEqual({ kind: "idle" });
	});
});
