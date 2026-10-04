import { describe, it, expect, vi, beforeEach } from "vitest";
import { DECK_CHUNK_FRAMES, openGaplessDeck, supportsGaplessDeck, type DeckDeps, type GaplessDeck } from "./gapless-deck";
import { frameTime, placeTrack, repositionFor } from "./gapless-timeline";
import { parseGaplessInfo, type GaplessInfo } from "./mp3-gapless";
import { FakeMediaSource, mp3Response, settle } from "@/test/helpers/fake-mse";
import { buildMp3 } from "@/test/helpers/mp3";

const SR = 44100;
const FD = 1152 / SR;

class FakeElement extends EventTarget {
	currentTime = 0;
	src = "";
	/** The playhead moves (timeupdate, like playback). */
	play(t: number) {
		this.currentTime = t;
		this.dispatchEvent(new Event("timeupdate"));
	}
}

type FileSpec = Uint8Array | (() => Response);

function setup(files: Record<string, FileSpec>, extra: Partial<DeckDeps> = {}) {
	const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
		const f = files[url];
		if (!f) return new Response("missing", { status: 404 });
		return typeof f === "function" ? f() : mp3Response(f).response;
	});
	const failures: string[] = [];
	const declined: [string, string][] = [];
	const element = new FakeElement();
	const revokeObjectURL = vi.fn();
	const deps: DeckDeps = {
		createElement: () => element as unknown as HTMLAudioElement,
		fetchImpl: fetchImpl as unknown as typeof fetch,
		MediaSourceImpl: FakeMediaSource as unknown as typeof MediaSource,
		createObjectURL: () => "blob:http://localhost/media-source",
		revokeObjectURL,
		onFailure: (r) => failures.push(r),
		onNextDeclined: (id, r) => declined.push([id, r]),
		...extra,
	};
	return { deps, fetchImpl, failures, declined, element, revokeObjectURL };
}

const infoOf = (file: Uint8Array): GaplessInfo => (parseGaplessInfo(file) as { info: GaplessInfo }).info;

async function open(files: Record<string, FileSpec>, extra: Partial<DeckDeps> = {}) {
	const t = setup(files, extra);
	const r = await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
	if (!("deck" in r)) throw new Error(`not opened: ${r.reason}`);
	const ms = FakeMediaSource.instances.at(-1)!;
	ms.open();
	await settle();
	return { ...t, deck: r.deck as GaplessDeck, ms, sb: ms.sb };
}

// 400 frames ≈ 10.4 s; 6000 frames ≈ 156.7 s.
const SHORT = buildMp3({ frames: 400, fill: () => 0xa1 });
const LONG = buildMp3({ frames: 6000, fill: () => 0xa2 });
const NEXT = buildMp3({ frames: 300, delay: 576, padding: 800, fill: () => 0xb1 });

beforeEach(() => FakeMediaSource.reset());

describe("openGaplessDeck — refusals (nothing is left running)", () => {
	it("refuses a browser without MSE for MP3, without fetching", async () => {
		FakeMediaSource.supported = false;
		const t = setup({ "blob:a": SHORT });
		expect(await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps)).toEqual({ ok: false, reason: "unsupported" });
		expect(t.fetchImpl).not.toHaveBeenCalled();
	});

	it.each([
		["fetch", () => new Response("no", { status: 403 })],
		["not-mp3", Uint8Array.from("fLaC\0\0\0\x22" + "\0".repeat(64), (c) => c.charCodeAt(0))],
		["no-lame-tag", buildMp3({ frames: 50, lame: false })],
		["no-info-tag", buildMp3({ frames: 50, tag: null })],
		["too-large", () => mp3Response(SHORT, { contentLength: 65 * 1024 * 1024 }).response],
		["fetch", () => mp3Response(SHORT.subarray(0, 300), { failAfter: 0 }).response],
	] as const)("refuses %s", async (reason, file) => {
		const t = setup({ "blob:a": file as FileSpec });
		expect(await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps)).toEqual({ ok: false, reason });
		expect(FakeMediaSource.instances).toHaveLength(0);
	});

	it("fetches a presigned URL with CORS and no cookies, a blob URL as is", async () => {
		const t = setup({ "https://r2.example/a.mp3": SHORT, "blob:a": SHORT });
		await openGaplessDeck({ trackId: "a", url: "https://r2.example/a.mp3" }, t.deps);
		expect(t.fetchImpl.mock.calls[0][1]).toMatchObject({ mode: "cors", credentials: "omit" });
		await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
		expect(t.fetchImpl.mock.calls[1][1]).not.toHaveProperty("mode");
	});

	it("supportsGaplessDeck survives a throwing isTypeSupported", () => {
		const Throwing = Object.assign(function MediaSource() {}, {
			isTypeSupported: () => {
				throw new Error("x");
			},
		}) as unknown as typeof MediaSource;
		expect(supportsGaplessDeck(Throwing)).toBe(false);
		expect(supportsGaplessDeck(undefined)).toBe(false);
	});
});

describe("openGaplessDeck — downloads", () => {
	it("reads a response without a body stream, and grows its buffer without a Content-Length", async () => {
		const noStream = {
			ok: true,
			status: 200,
			headers: new Headers(),
			body: null,
			arrayBuffer: async () => SHORT.slice().buffer,
		} as unknown as Response;
		const a = await open({ "blob:a": () => noStream });
		expect(a.sb.appends.reduce((n, x) => n + x.frames, 0)).toBe(400);
		const b = await open({ "blob:a": () => mp3Response(SHORT, { chunk: 16 * 1024, contentLength: null }).response });
		expect(b.sb.appends.reduce((n, x) => n + x.frames, 0)).toBe(400);
	});

	it("refuses a file that grows past the size cap", async () => {
		const t = setup({ "blob:a": () => mp3Response(SHORT, { contentLength: null }).response }, { maxFileBytes: 1000 });
		expect(await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps)).toEqual({ ok: false, reason: "too-large" });
	});
});

describe("GaplessDeck — one track", () => {
	it("appends the file in chunks, its music starting at 0 and its encoder delay cut off", async () => {
		const { deck, ms, sb, element } = await open({ "blob:a": SHORT });
		expect(element.src).toBe("blob:http://localhost/media-source");
		const p = placeTrack(infoOf(SHORT), 0);
		expect(ms.duration).toBeCloseTo(repositionFor(p, 0).windowEnd, 9);
		// Chunks of at most DECK_CHUNK_FRAMES, as far as the download got; every frame of music.
		expect(sb.appends.every((a) => a.frames > 0 && a.frames <= DECK_CHUNK_FRAMES)).toBe(true);
		expect(sb.appends.reduce((n, a) => n + a.frames, 0)).toBe(400);
		// Placed once, then continued as is.
		expect(sb.aborts).toBe(1);
		expect(sb.appends[0]).toMatchObject({ windowStart: 0, windowEnd: repositionFor(p, 0).windowEnd });
		expect(sb.appends[0].timestampOffset).toBeCloseTo(-576 / SR, 12);
		expect(sb.appends[1].timestampOffset).toBeCloseTo(frameTime(p, sb.appends[0].frames), 9);
		expect(deck.trackId()).toBe("a");
		expect(deck.sourceUrl()).toBe("blob:a");
		expect(deck.trackDuration()).toBeCloseTo((400 * 1152 - 1576) / SR, 9);
		element.play(4);
		expect(deck.trackTime()).toBe(4);
		expect(deck.bufferedEnd()).toBeCloseTo(deck.trackDuration(), 2);
	});

	it("keeps 60 s ahead of the playhead, then follows it", async () => {
		const { sb, element } = await open({ "blob:a": LONG });
		const appended = () => sb.appends.reduce((n, a) => n + a.frames, 0) * FD;
		expect(appended()).toBeGreaterThanOrEqual(60);
		expect(appended()).toBeLessThan(60 + DECK_CHUNK_FRAMES * FD + 0.1);
		element.play(30);
		await settle();
		expect(appended()).toBeGreaterThanOrEqual(90);
	});

	it("seeks inside the buffer in place, and re-appends from memory outside it", async () => {
		const { deck, sb, element } = await open({ "blob:a": LONG });
		deck.seek(20);
		expect(element.currentTime).toBe(20);
		await settle();
		expect(sb.removes).toEqual([]);
		deck.seek(120);
		await settle();
		expect(sb.removes).toEqual([[0, Infinity]]);
		const p = placeTrack(infoOf(LONG), 0);
		const restart = sb.appends.at(-1)!;
		expect(sb.aborts).toBe(2);
		expect(sb.ranges[0][0]).toBeLessThanOrEqual(120);
		expect(sb.appends.find((a) => a.timestampOffset > 100)?.timestampOffset).toBeCloseTo(frameTime(p, Math.floor((120 - p.frameZero) / FD)), 9);
		expect(restart.windowStart).toBe(0);
		expect(deck.trackTime()).toBe(120);
		// Clamped to the track.
		deck.seek(-3);
		expect(element.currentTime).toBe(0);
	});

	it("ends the stream once the run is decided to end here", async () => {
		const { deck, ms } = await open({ "blob:a": SHORT });
		expect(ms.endOfStreamCalls).toBe(0);
		deck.setNext(null);
		await settle();
		expect(ms.endOfStreamCalls).toBe(1);
		expect(deck.nextDecided()).toBe(true);
		expect(deck.nextTrackId()).toBeNull();
	});

	it("ends the stream on its own when still undecided at the very end", async () => {
		const { ms, element, deck } = await open({ "blob:a": SHORT });
		element.play(deck.trackDuration() - 1);
		await settle();
		expect(ms.endOfStreamCalls).toBe(1);
	});

	it("frees room behind the playhead when the budget is full", async () => {
		// 128 kbps = 16 000 B/s: a 40 s budget.
		const { sb, element } = await open({ "blob:a": LONG }, { budgetBytes: 640_000, aheadS: 30, behindS: 5 });
		element.play(32);
		await settle();
		expect(sb.removes[0][0]).toBe(0);
		expect(sb.removes[0][1]).toBeCloseTo(27, 6);
	});

	it("keeps its one SourceBuffer when the source opens again (ended → open)", async () => {
		const { ms } = await open({ "blob:a": SHORT });
		ms.open();
		expect(ms.sourceBuffers).toHaveLength(1);
	});

	it("reports nothing buffered before the source opens, or away from the playhead", async () => {
		const t = setup({ "blob:a": LONG });
		const r = await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
		const deck = (r as { deck: GaplessDeck }).deck;
		expect(deck.bufferedEnd()).toBe(0);
		FakeMediaSource.instances[0].open();
		await settle();
		deck.seek(140);
		expect(deck.bufferedEnd()).toBe(0);
	});

	it("destroy() revokes the object URL and stops appending", async () => {
		const { deck, sb, element, revokeObjectURL, failures } = await open({ "blob:a": LONG });
		const n = sb.appends.length;
		deck.destroy();
		deck.destroy();
		expect(revokeObjectURL).toHaveBeenCalledTimes(1);
		element.play(50);
		await settle();
		expect(sb.appends).toHaveLength(n);
		sb.dispatchEvent(new Event("error"));
		expect(failures).toEqual([]);
	});
});

describe("GaplessDeck — the next track", () => {
	it("lays the next track on the sample after this one's last, and follows the playhead into it", async () => {
		const { deck, sb, ms, element, fetchImpl } = await open({ "blob:a": SHORT, "blob:b": NEXT });
		deck.setNext({ trackId: "b", url: "blob:b" });
		deck.setNext({ trackId: "b", url: "blob:b" });
		expect(deck.nextTrackId()).toBe("b");
		await settle();
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		const a = placeTrack(infoOf(SHORT), 0);
		const b = placeTrack(infoOf(NEXT), a.end);
		const first = sb.appends.find((x) => x.firstFill === 0xb1)!;
		expect(first.windowStart).toBeCloseTo(a.end, 12);
		expect(first.timestampOffset).toBeCloseTo(b.frameZero, 12);
		expect(first.windowEnd).toBeCloseTo(repositionFor(b, 0).windowEnd, 12);
		expect(ms.duration).toBeCloseTo(repositionFor(b, 0).windowEnd, 9);
		expect(ms.endOfStreamCalls).toBe(0);

		element.play(a.end - 0.1);
		expect(deck.sync()).toBeNull();
		element.play(a.end + 0.05);
		expect(deck.sync()).toBe("b");
		expect(deck.sync()).toBeNull();
		expect(deck.trackId()).toBe("b");
		expect(deck.trackTime()).toBeCloseTo(0.05, 9);
		expect(deck.trackDuration()).toBeCloseTo(b.end - b.start, 9);
		// Undecided again for the new current track.
		expect(deck.nextDecided()).toBe(false);
		deck.setNext(null);
		await settle();
		expect(ms.endOfStreamCalls).toBe(1);
	});

	it("takes back a next track the queue no longer wants", async () => {
		const { deck, sb, fetchImpl } = await open({ "blob:a": SHORT, "blob:b": NEXT, "blob:c": NEXT });
		deck.setNext({ trackId: "b", url: "blob:b" });
		await settle();
		const a = placeTrack(infoOf(SHORT), 0);
		deck.setNext({ trackId: "c", url: "blob:c" });
		await settle();
		expect(sb.removes).toEqual([[a.end, Infinity]]);
		expect(deck.nextTrackId()).toBe("c");
		expect(fetchImpl).toHaveBeenLastCalledWith("blob:c", expect.anything());
		deck.setNext(null);
		await settle();
		expect(deck.nextTrackId()).toBeNull();
		expect(sb.removes).toHaveLength(2);
	});

	it.each([
		["not-mp3", Uint8Array.from("fLaC" + "\0".repeat(64), (c) => c.charCodeAt(0))],
		["no-lame-tag", buildMp3({ frames: 50, lame: false })],
		["cannot-join", buildMp3({ frames: 50, header: [0xfb, 0x94, 0x00] })],
		["fetch", () => new Response(null, { status: 500 })],
	] as const)("declines a next track that can't join (%s): the run ends after this one", async (reason, file) => {
		const { deck, declined, ms } = await open({ "blob:a": SHORT, "blob:b": file as FileSpec });
		deck.setNext({ trackId: "b", url: "blob:b" });
		await settle();
		expect(declined).toEqual([["b", reason]]);
		expect(deck.nextTrackId()).toBeNull();
		expect(ms.endOfStreamCalls).toBe(1);
	});

	it("abandons a next track whose download breaks off, taking its frames back", async () => {
		const big = buildMp3({ frames: 3000, fill: () => 0xb2 });
		const { deck, declined, sb, ms } = await open({ "blob:a": SHORT, "blob:b": () => mp3Response(big, { chunk: 32 * 1024, failAfter: 4 }).response });
		deck.setNext({ trackId: "b", url: "blob:b" });
		await settle(60);
		expect(declined).toEqual([["b", "fetch"]]);
		expect(sb.removes.at(-1)).toEqual([placeTrack(infoOf(SHORT), 0).end, Infinity]);
		expect(ms.endOfStreamCalls).toBe(1);
	});

	it("keeps a next track whose download errors after its last frame of music (was: abandoned, ending the run)", async () => {
		const chunk = 32 * 1024;
		const { deck, declined, sb } = await open({
			"blob:a": SHORT,
			"blob:b": () => mp3Response(NEXT, { chunk, failAfter: Math.ceil(NEXT.length / chunk) }).response,
		});
		deck.setNext({ trackId: "b", url: "blob:b" });
		await settle(60);
		expect(declined).toEqual([]);
		expect(deck.nextTrackId()).toBe("b");
		expect(sb.appends.filter((a) => a.firstFill === 0xb1).reduce((n, a) => n + a.frames, 0)).toBe(placeTrack(infoOf(NEXT), 0).frames);
	});

	it("abandons a next track that breaks off before any of it was appended", async () => {
		const big = buildMp3({ frames: 3000 });
		const { deck, declined, sb } = await open({ "blob:a": LONG, "blob:b": () => mp3Response(big, { failAfter: 1 }).response });
		deck.setNext({ trackId: "b", url: "blob:b" });
		await settle();
		expect(declined).toEqual([["b", "fetch"]]);
		expect(sb.appends.every((a) => a.firstFill === 0xa2)).toBe(true);
	});

	it("lines up only the latest of two quick next tracks", async () => {
		const { deck, declined, sb } = await open({ "blob:a": SHORT, "blob:b": NEXT, "blob:c": buildMp3({ frames: 300, fill: () => 0xc1 }) });
		deck.setNext({ trackId: "b", url: "blob:b" });
		deck.setNext({ trackId: "c", url: "blob:c" });
		await settle();
		expect(declined).toEqual([]);
		expect(deck.nextTrackId()).toBe("c");
		expect(sb.appends.some((a) => a.firstFill === 0xb1)).toBe(false);
		expect(sb.appends.some((a) => a.firstFill === 0xc1)).toBe(true);
	});

	it("abandons a next track whose file is shorter than its tag says", async () => {
		const short = buildMp3({ frames: 300 }).subarray(0, 417 * 100);
		const { deck, declined } = await open({ "blob:a": SHORT, "blob:b": short });
		deck.setNext({ trackId: "b", url: "blob:b" });
		await settle();
		expect(declined).toEqual([["b", "truncated"]]);
	});
});

describe("GaplessDeck — failures (AudioEngine falls back to the plain path)", () => {
	it("a current track shorter than its tag says", async () => {
		const { failures } = await open({ "blob:a": buildMp3({ frames: 400 }).subarray(0, 417 * 200) });
		expect(failures).toEqual(["truncated"]);
	});

	it("a smaller quota than ours shrinks the budget and goes on", async () => {
		const t = setup({ "blob:a": SHORT });
		const r = await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
		const ms = FakeMediaSource.instances[0];
		const onSb = () => ms.sb && (ms.sb.throwOnAppend = { name: "QuotaExceededError", times: 1 });
		ms.addEventListener("sourceopen", onSb);
		ms.open();
		await settle();
		expect("deck" in r).toBe(true);
		expect(t.failures).toEqual([]);
		expect(ms.sb.appends.length).toBeGreaterThan(0);
	});

	it("a quota that never lets an append in", async () => {
		const t = setup({ "blob:a": SHORT });
		await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
		const ms = FakeMediaSource.instances[0];
		ms.addEventListener("sourceopen", () => (ms.sb.throwOnAppend = { name: "QuotaExceededError", times: 99 }));
		ms.open();
		await settle();
		expect(t.failures).toEqual(["append"]);
	});

	it("an append error, and a SourceBuffer error event", async () => {
		const t = setup({ "blob:a": SHORT });
		await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
		const ms = FakeMediaSource.instances[0];
		ms.addEventListener("sourceopen", () => (ms.sb.throwOnAppend = { name: "InvalidStateError", times: 1 }));
		ms.open();
		await settle();
		expect(t.failures).toEqual(["append"]);

		const u = await open({ "blob:a": SHORT });
		u.sb.dispatchEvent(new Event("error"));
		expect(u.failures).toEqual(["append"]);
	});

	it("a Media Source that closed under an append", async () => {
		const t = setup({ "blob:a": SHORT });
		await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
		const ms = FakeMediaSource.instances[0];
		ms.addEventListener("sourceopen", () => {
			ms.sb.appendBuffer = () => {
				ms.readyState = "closed";
				throw new DOMException("closed", "InvalidStateError");
			};
		});
		ms.open();
		await settle();
		expect(t.failures).toEqual(["media-source"]);
	});

	it("no SourceBuffer for audio/mpeg", async () => {
		FakeMediaSource.failAddSourceBuffer = true;
		const t = setup({ "blob:a": SHORT });
		await openGaplessDeck({ trackId: "a", url: "blob:a" }, t.deps);
		FakeMediaSource.instances[0].open();
		expect(t.failures).toEqual(["media-source"]);
	});

	it("no room left at the playhead", async () => {
		const { failures } = await open({ "blob:a": LONG }, { budgetBytes: 1000 });
		expect(failures).toEqual(["out-of-room"]);
	});
});
