// The gapless deck: one <audio> element fed by Media Source Extensions, on
// whose single SourceBuffer the tracks of a run are laid end to end, sample
// for sample (placement in gapless-timeline.ts, LAME tag in mp3-gapless.ts).
//
// Only cached copies play here (IndexedDB blob or presigned R2 URL — never
// the live stream): each file is fetched once, kept in memory, and appended
// in chunks a little ahead of the playhead, so a long DJ mix fits the
// browser's SourceBuffer quota and a seek anywhere re-appends from memory.
// Anything the deck can't handle is reported (onFailure, onNextDeclined) so
// AudioEngine falls back to its plain one-element-per-track path.

import {
	parseGaplessInfo,
	scanFrames,
	type GaplessInfo,
	type GaplessRejection,
} from "./mp3-gapless";
import {
	DECODER_DELAY,
	TIME_EPSILON,
	canJoin,
	placeTrack,
	planPump,
	repositionFor,
	rangeAround,
	trackTimeAt,
	type Placement,
	type PumpCursor,
	type PumpSegment,
} from "./gapless-timeline";

export const DECK_MIME = "audio/mpeg";

/** Bytes the deck keeps in its SourceBuffer: under Chrome's 12 MiB audio quota. */
export const DECK_BUDGET_BYTES = 10 * 1024 * 1024;
/** Seconds kept buffered ahead of the playhead (the next track joins this early). */
export const DECK_AHEAD_S = 60;
/** Seconds kept behind the playhead when room is needed (short rewinds stay in buffer). */
export const DECK_BEHIND_S = 20;
/** Frames per append: about 5 s of audio. */
export const DECK_CHUNK_FRAMES = 192;
/** Still undecided about the next track this close to the end: the run ends after this one. */
export const DECK_END_GUARD_S = 2;
/** Largest file the deck holds in memory (a 70-minute mix at 128 kbps). */
export const DECK_MAX_FILE_BYTES = 64 * 1024 * 1024;

export interface DeckSource {
	trackId: string;
	/** IndexedDB blob URL or presigned R2 URL. */
	url: string;
}

/** Why the deck stopped mid-run. */
export type DeckFailure = "fetch" | "append" | "out-of-room" | "truncated" | "media-source";

/** Why a track can't play on the deck (it plays on the plain path instead). */
export type DeckRejection =
	| "unsupported"
	| "fetch"
	| "too-large"
	| "cannot-join"
	| "truncated"
	| Exclude<GaplessRejection, "need-more-data">;

export interface DeckDeps {
	createElement: () => HTMLAudioElement;
	fetchImpl?: typeof fetch;
	MediaSourceImpl?: typeof MediaSource;
	createObjectURL?: (ms: MediaSource) => string;
	revokeObjectURL?: (url: string) => void;
	decoderDelay?: number;
	budgetBytes?: number;
	/** Largest file the deck loads (default DECK_MAX_FILE_BYTES). */
	maxFileBytes?: number;
	aheadS?: number;
	behindS?: number;
	chunkFrames?: number;
	/** The deck can't go on: AudioEngine leaves the run and plays the track on the plain path. */
	onFailure?: (reason: DeckFailure) => void;
	/** The next track can't join the run: the run ends after the current track. */
	onNextDeclined?: (trackId: string, reason: DeckRejection) => void;
}

export interface GaplessDeck {
	readonly element: HTMLAudioElement;
	/** The track under the playhead. */
	trackId(): string;
	/** Where the current track is read from (blob or presigned URL). */
	sourceUrl(): string;
	/** Track-relative playback position (seconds). */
	trackTime(): number;
	/** Duration of the current track's music. */
	trackDuration(): number;
	/** Track-relative end of what is buffered around the playhead. */
	bufferedEnd(): number;
	/** Seek within the current track (track-relative seconds). */
	seek(trackTime: number): void;
	/** Follow the playhead: the id of the track it just crossed into, else null. */
	sync(): string | null;
	/** The track that follows the current one, or null: the run ends after it. */
	setNext(next: DeckSource | null): void;
	/** The planned next track (loading or joined), null when none. */
	nextTrackId(): string | null;
	/** setNext() was called since the current track became the last one. */
	nextDecided(): boolean;
	destroy(): void;
}

/** MSE with MP3 support (Chrome, Edge, Firefox, desktop Safari). */
export function supportsGaplessDeck(MS: typeof MediaSource | undefined = globalThis.MediaSource): boolean {
	try {
		return typeof MS === "function" && typeof MS.isTypeSupported === "function" && MS.isTypeSupported(DECK_MIME);
	} catch {
		return false;
	}
}

// --- Loading -----------------------------------------------------------------

interface Load {
	bytes: Uint8Array<ArrayBuffer>;
	loaded: number;
	total: number | undefined;
	done: boolean;
	failed: "fetch" | "too-large" | null;
	abort(): void;
}

function startLoad(url: string, fetchImpl: typeof fetch, maxBytes: number, onData: () => void): Load {
	const ctl = new AbortController();
	const load: Load = { bytes: new Uint8Array(0), loaded: 0, total: undefined, done: false, failed: null, abort: () => ctl.abort() };
	const append = (chunk: Uint8Array) => {
		if (load.loaded + chunk.length > maxBytes) throw new RangeError("too large");
		if (load.loaded + chunk.length > load.bytes.length) {
			const grown = new Uint8Array(Math.max(load.total ?? 0, (load.loaded + chunk.length) * 2, 1 << 20));
			grown.set(load.bytes.subarray(0, load.loaded));
			load.bytes = grown;
		}
		load.bytes.set(chunk, load.loaded);
		load.loaded += chunk.length;
	};
	void (async () => {
		try {
			// Presigned R2 URLs are cross-origin (CORS, no cookies); blob: URLs are local.
			const init: RequestInit = url.startsWith("blob:") ? { signal: ctl.signal } : { mode: "cors", credentials: "omit", signal: ctl.signal };
			const res = await fetchImpl(url, init);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const length = Number(res.headers.get("Content-Length"));
			if (length > maxBytes) throw new RangeError("too large");
			if (length > 0) {
				load.total = length;
				load.bytes = new Uint8Array(length);
			}
			const reader = res.body?.getReader();
			if (!reader) {
				append(new Uint8Array(await res.arrayBuffer()));
			} else {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) break;
					append(value);
					onData();
				}
			}
			load.done = true;
		} catch (e) {
			load.failed = e instanceof RangeError ? "too-large" : "fetch";
			ctl.abort();
		}
		onData();
	})();
	return load;
}

type HeaderResult = { ok: true; info: GaplessInfo } | { ok: false; reason: DeckRejection };

/** Load a file and settle as soon as its gapless header can be read (or can't be). */
function loadWithHeader(url: string, fetchImpl: typeof fetch, maxBytes: number, onData: () => void): { load: Load; header: Promise<HeaderResult> } {
	let settle!: (r: HeaderResult) => void;
	const header = new Promise<HeaderResult>((r) => (settle = r));
	let settled = false;
	const done = (r: HeaderResult) => {
		settled = true;
		settle(r);
	};
	const load = startLoad(url, fetchImpl, maxBytes, () => {
		if (!settled) {
			const view = load.bytes.subarray(0, load.loaded);
			const final = load.done || !!load.failed;
			const parsed = parseGaplessInfo(view, { totalLength: final ? load.loaded : load.total });
			if ("info" in parsed) done({ ok: true, info: parsed.info });
			// A file that is all there never asks for more (parseGaplessInfo knows its length).
			else if (parsed.reason !== "need-more-data" || final) done({ ok: false, reason: load.failed ?? (parsed.reason === "need-more-data" ? "not-mp3" : parsed.reason) });
		}
		onData();
	});
	return { load, header };
}

// --- The deck ---------------------------------------------------------------

interface Segment extends PumpSegment {
	source: DeckSource;
	load: Load;
	info: GaplessInfo;
	/** Byte offsets of the audio frames indexed so far. */
	offsets: number[];
	/** Where indexing goes on. */
	scanned: number;
}

function makeSegment(source: DeckSource, load: Load, info: GaplessInfo, placement: Placement): Segment {
	return { source, load, info, placement, offsets: [], scanned: info.audioStart, available: 0, complete: false };
}

/** Index the frames that arrived since the last call. */
function refresh(seg: Segment) {
	if (seg.complete) return;
	const end = seg.info.audioEnd ?? Number.MAX_SAFE_INTEGER;
	const stream = { version: seg.info.version, layer: 3, sampleRate: seg.info.sampleRate } as const;
	const r = scanFrames(seg.load.bytes, seg.scanned, Math.min(seg.load.loaded, end), stream, seg.offsets);
	seg.scanned = r.next;
	seg.available = seg.offsets.length;
	seg.complete = r.broken || seg.load.done || !!seg.load.failed || seg.scanned >= end;
}

/**
 * Open a deck on `first`. Resolves once the file's gapless header was read;
 * `ok: false` when it can't play gaplessly (unsupported browser, not an
 * MP3, no LAME tag, fetch failed) — nothing is left running then.
 */
export async function openGaplessDeck(
	first: DeckSource,
	deps: DeckDeps
): Promise<{ ok: true; deck: GaplessDeck } | { ok: false; reason: DeckRejection }> {
	const MS = deps.MediaSourceImpl ?? globalThis.MediaSource;
	if (!supportsGaplessDeck(MS)) return { ok: false, reason: "unsupported" };
	const fetchImpl = deps.fetchImpl ?? ((input, init) => fetch(input, init));
	const decoderDelay = deps.decoderDelay ?? DECODER_DELAY;
	const aheadS = deps.aheadS ?? DECK_AHEAD_S;
	const behindS = deps.behindS ?? DECK_BEHIND_S;
	const chunkFrames = deps.chunkFrames ?? DECK_CHUNK_FRAMES;
	let budgetBytes = deps.budgetBytes ?? DECK_BUDGET_BYTES;
	const maxFileBytes = deps.maxFileBytes ?? DECK_MAX_FILE_BYTES;

	let pump: () => void = () => {};
	const opening = loadWithHeader(first.url, fetchImpl, maxFileBytes, () => pump());
	const opened = await opening.header;
	if ("reason" in opened) {
		opening.load.abort();
		return opened;
	}

	const element = deps.createElement();
	const ms = new MS();
	const objectUrl = (deps.createObjectURL ?? ((m) => URL.createObjectURL(m)))(ms);
	let sb: SourceBuffer | null = null;
	let destroyed = false;
	let failed = false;

	// The run ahead of the playhead: the current track, then at most one next track.
	const segments: Segment[] = [makeSegment(first, opening.load, opened.info, placeTrack(opened.info, 0, decoderDelay))];
	let pendingNext: { trackId: string; load: Load } | null = null;
	let decided = false;
	let final = false;
	let cursor: PumpCursor | null = null;
	let resetPending = false;
	let removePending: { start: number; end: number } | null = null;

	const current = () => segments[0];
	const closed = () => ms.readyState === "closed";
	const budgetS = () => budgetBytes / (Math.max(...segments.map((s) => s.info.bitrateKbps)) * 125);

	const fail = (reason: DeckFailure) => {
		if (failed || destroyed) return;
		failed = true;
		deps.onFailure?.(reason);
	};

	/** Take the next track back out of the run (and what was appended of it). */
	const removeNext = (seg: Segment) => {
		segments.splice(segments.indexOf(seg), 1);
		seg.load.abort();
		removePending = { start: seg.placement.start, end: Infinity };
		// The current track is all appended once its successor's frames went in.
		if (cursor?.segment === seg) cursor = { segment: current(), frame: current().placement.frames };
	};

	/** The next track can't join after all: the run ends after the current one. */
	const abandonNext = (seg: Segment, reason: DeckRejection) => {
		removeNext(seg);
		final = true;
		deps.onNextDeclined?.(seg.source.trackId, reason);
	};

	pump = () => {
		if (destroyed || failed || !sb || sb.updating || ms.readyState === "closed") return;
		try {
			if (resetPending) {
				// A seek outside the buffer: start over from the new position.
				resetPending = false;
				removePending = null;
				cursor = null;
				sb.remove(0, Infinity);
				return;
			}
			for (const seg of segments) refresh(seg);
			// The next track's download broke off before its last frame of music.
			const next = segments[1];
			if (next?.load.failed && next.available < next.placement.frames) abandonNext(next, next.load.failed);
			if (removePending) {
				const { start, end } = removePending;
				removePending = null;
				sb.remove(start, end);
				return;
			}
			// Seeks are clamped to the duration: cover the whole run from the start.
			const runEnd = repositionFor(segments[segments.length - 1].placement, 0).windowEnd;
			if (ms.readyState === "open" && !(ms.duration >= runEnd)) ms.duration = runEnd;
			const playhead = element.currentTime;
			const undecided = !decided && segments.length === 1 && current().placement.end - playhead < DECK_END_GUARD_S;
			const action = planPump({
				playhead,
				buffered: sb.buffered,
				segments,
				final: final || undecided,
				ended: ms.readyState === "ended",
				cursor,
				aheadS,
				behindS,
				budgetS: budgetS(),
				chunkFrames,
			});
			switch (action.kind) {
				case "append": {
					const seg = action.segment as Segment;
					if (action.reposition) {
						// abort() forgets the last decode timestamp: in "sequence" mode
						// (MP3 has no timestamps of its own) a jump would otherwise be
						// re-sequenced after the previous data instead of placed here.
						sb.abort();
						sb.appendWindowEnd = Infinity;
						sb.appendWindowStart = action.reposition.windowStart;
						sb.appendWindowEnd = action.reposition.windowEnd;
						sb.timestampOffset = action.reposition.timestampOffset;
					}
					const to = action.to < seg.offsets.length ? seg.offsets[action.to] : seg.scanned;
					sb.appendBuffer(seg.load.bytes.subarray(seg.offsets[action.from], to));
					cursor = { segment: seg, frame: action.to };
					return;
				}
				case "remove":
					sb.remove(action.start, action.end);
					return;
				case "end-of-stream":
					ms.endOfStream();
					return;
				case "truncated":
					if (action.segment !== current()) {
						// The next track's file is shorter than its tag says: don't join it.
						abandonNext(action.segment as Segment, "truncated");
						pump();
					} else {
						fail("truncated");
					}
					return;
				case "out-of-room":
					fail("out-of-room");
					return;
				default:
					return;
			}
		} catch (e) {
			if ((e as { name?: string } | null)?.name === "QuotaExceededError" && budgetBytes > 2 * 1024 * 1024) {
				// The browser's quota is smaller than ours: shrink the budget and free room.
				budgetBytes = Math.floor(budgetBytes * 0.6);
				queueMicrotask(pump);
				return;
			}
			fail(closed() ? "media-source" : "append");
		}
	};

	const onSourceOpen = () => {
		if (destroyed || sb) return;
		try {
			sb = ms.addSourceBuffer(DECK_MIME);
		} catch {
			fail("media-source");
			return;
		}
		sb.addEventListener("updateend", pump);
		sb.addEventListener("error", () => fail("append"));
		pump();
	};
	ms.addEventListener("sourceopen", onSourceOpen);
	element.addEventListener("timeupdate", pump);
	element.addEventListener("seeking", pump);
	element.src = objectUrl;

	const dropNext = () => {
		pendingNext?.load.abort();
		pendingNext = null;
		if (segments[1]) removeNext(segments[1]);
	};

	const deck: GaplessDeck = {
		element,
		trackId: () => current().source.trackId,
		sourceUrl: () => current().source.url,
		trackTime: () => trackTimeAt(current().placement, element.currentTime),
		trackDuration: () => current().placement.end - current().placement.start,
		bufferedEnd() {
			const r = sb ? rangeAround(sb.buffered, element.currentTime) : null;
			return r ? trackTimeAt(current().placement, r.end) : 0;
		},
		seek(trackTime) {
			const p = current().placement;
			const t = p.start + Math.min(Math.max(trackTime, 0), p.end - p.start);
			if (!sb || !rangeAround(sb.buffered, t)) resetPending = true;
			element.currentTime = t;
			pump();
		},
		sync() {
			const next = segments[1];
			if (!next || element.currentTime < next.placement.start - TIME_EPSILON) return null;
			segments.shift();
			decided = false;
			final = false;
			return next.source.trackId;
		},
		setNext(next) {
			decided = true;
			if (next && next.trackId === deck.nextTrackId()) return;
			dropNext();
			final = next === null;
			if (next) {
				const base = current();
				const opening = loadWithHeader(next.url, fetchImpl, maxFileBytes, () => pump());
				const pending = { trackId: next.trackId, load: opening.load };
				pendingNext = pending;
				void opening.header.then((r) => {
					if (destroyed || pendingNext !== pending) return;
					pendingNext = null;
					if ("info" in r && canJoin(base.info, r.info) && current() === base && segments.length === 1) {
						segments.push(makeSegment(next, opening.load, r.info, placeTrack(r.info, base.placement.end, decoderDelay)));
					} else {
						opening.load.abort();
						final = true;
						deps.onNextDeclined?.(next.trackId, "reason" in r ? r.reason : "cannot-join");
					}
					pump();
				});
			}
			pump();
		},
		nextTrackId: () => pendingNext?.trackId ?? segments[1]?.source.trackId ?? null,
		nextDecided: () => decided,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			for (const seg of segments) seg.load.abort();
			pendingNext?.load.abort();
			element.removeEventListener("timeupdate", pump);
			element.removeEventListener("seeking", pump);
			ms.removeEventListener("sourceopen", onSourceOpen);
			(deps.revokeObjectURL ?? ((u) => URL.revokeObjectURL(u)))(objectUrl);
		},
	};
	return { ok: true, deck };
}
