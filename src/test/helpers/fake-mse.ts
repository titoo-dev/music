// A fake MediaSource / SourceBuffer pair for the gapless deck tests. Appends
// are parsed (MP3 frames counted) and placed the way Chrome does in
// "sequence" mode: at timestampOffset, clipped to the append window, after
// which timestampOffset moves to the end of the appended frames. Operations
// complete on the next macrotask, like the real ones.

import { parseFrameHeader } from "@/components/audio/engine/mp3-gapless";

export interface FakeAppend {
	bytes: number;
	frames: number;
	timestampOffset: number;
	windowStart: number;
	windowEnd: number;
	/** Payload byte of the first frame (tests tag frames by it). */
	firstFill: number;
}

const EPS = 1e-6;

export class FakeSourceBuffer extends EventTarget {
	updating = false;
	mode = "sequence";
	timestampOffset = 0;
	appendWindowStart = 0;
	appendWindowEnd = Infinity;
	appends: FakeAppend[] = [];
	removes: [number, number][] = [];
	aborts = 0;
	/** appendBuffer() throws a DOMException with this name (`times` times). */
	throwOnAppend: { name: string; times: number } | null = null;
	ranges: [number, number][] = [];

	constructor(private readonly ms: FakeMediaSource) {
		super();
	}

	get buffered() {
		const r = this.ranges;
		return { length: r.length, start: (i: number) => r[i][0], end: (i: number) => r[i][1] };
	}

	private finish(apply: () => void) {
		this.updating = true;
		if (this.ms.readyState === "ended") this.ms.readyState = "open";
		setTimeout(() => {
			apply();
			this.updating = false;
			this.dispatchEvent(new Event("updateend"));
		}, 0);
	}

	appendBuffer(data: Uint8Array) {
		if (this.updating) throw new DOMException("still updating", "InvalidStateError");
		if (this.throwOnAppend && this.throwOnAppend.times > 0) {
			this.throwOnAppend.times--;
			throw new DOMException("refused", this.throwOnAppend.name);
		}
		let frames = 0;
		let at = 0;
		let duration = 0;
		while (at + 4 <= data.length) {
			const h = parseFrameHeader(data, at);
			if (!h) break;
			frames++;
			duration += h.samplesPerFrame / h.sampleRate;
			at += h.frameLength;
		}
		const start = this.timestampOffset;
		const end = start + duration;
		this.appends.push({
			bytes: data.length,
			frames,
			timestampOffset: start,
			windowStart: this.appendWindowStart,
			windowEnd: this.appendWindowEnd,
			firstFill: data[4],
		});
		this.timestampOffset = end;
		const from = Math.max(start, this.appendWindowStart);
		const to = Math.min(end, this.appendWindowEnd);
		this.finish(() => {
			if (to > from) this.add(from, to);
		});
	}

	remove(start: number, end: number) {
		if (this.updating) throw new DOMException("still updating", "InvalidStateError");
		this.removes.push([start, end]);
		this.finish(() => {
			const out: [number, number][] = [];
			for (const [s, e] of this.ranges) {
				if (s < start) out.push([s, Math.min(e, start)]);
				if (e > end) out.push([Math.max(s, end), e]);
			}
			this.ranges = out.filter(([s, e]) => e - s > EPS);
		});
	}

	abort() {
		this.aborts++;
		this.appendWindowStart = 0;
		this.appendWindowEnd = Infinity;
	}

	private add(start: number, end: number) {
		const all = [...this.ranges, [start, end] as [number, number]].sort((x, y) => x[0] - y[0]);
		const merged: [number, number][] = [];
		for (const r of all) {
			const last = merged[merged.length - 1];
			if (last && r[0] <= last[1] + EPS) last[1] = Math.max(last[1], r[1]);
			else merged.push([r[0], r[1]]);
		}
		this.ranges = merged;
	}
}

export class FakeMediaSource extends EventTarget {
	static instances: FakeMediaSource[] = [];
	static supported = true;
	static failAddSourceBuffer = false;
	static isTypeSupported(type: string) {
		return FakeMediaSource.supported && type === "audio/mpeg";
	}
	static reset() {
		FakeMediaSource.instances = [];
		FakeMediaSource.supported = true;
		FakeMediaSource.failAddSourceBuffer = false;
	}

	readyState: "closed" | "open" | "ended" = "closed";
	duration = NaN;
	sourceBuffers: FakeSourceBuffer[] = [];
	endOfStreamCalls = 0;

	constructor() {
		super();
		FakeMediaSource.instances.push(this);
	}

	addSourceBuffer(type: string) {
		if (FakeMediaSource.failAddSourceBuffer || type !== "audio/mpeg") throw new DOMException("no", "NotSupportedError");
		const sb = new FakeSourceBuffer(this);
		this.sourceBuffers.push(sb);
		return sb;
	}

	endOfStream() {
		if (this.readyState !== "open") throw new DOMException("not open", "InvalidStateError");
		this.readyState = "ended";
		this.endOfStreamCalls++;
	}

	/** The element attached the source. */
	open() {
		this.readyState = "open";
		this.dispatchEvent(new Event("sourceopen"));
	}

	get sb() {
		return this.sourceBuffers[0];
	}
}

/**
 * An MP3 HTTP response streamed in chunks. `hold` pauses the body after that
 * many chunks until release(); `failAfter` errors the body after that many.
 */
export function mp3Response(
	bytes: Uint8Array,
	opts: { chunk?: number; hold?: number; failAfter?: number; status?: number; contentLength?: number | null } = {}
): { response: Response; release: () => void } {
	const chunk = opts.chunk ?? 64 * 1024;
	let sent = 0;
	let release!: () => void;
	const released = new Promise<void>((r) => (release = r));
	const body = new ReadableStream<Uint8Array>({
		async pull(ctl) {
			const n = sent / chunk;
			if (opts.failAfter !== undefined && n >= opts.failAfter) {
				ctl.error(new TypeError("network error"));
				return;
			}
			if (opts.hold !== undefined && n >= opts.hold) await released;
			if (sent >= bytes.length) {
				ctl.close();
				return;
			}
			ctl.enqueue(bytes.slice(sent, sent + chunk));
			sent += chunk;
		},
	});
	const headers: Record<string, string> = { "Content-Type": "audio/mpeg" };
	const length = opts.contentLength === undefined ? bytes.length : opts.contentLength;
	if (length !== null) headers["Content-Length"] = String(length);
	return { response: new Response(body, { status: opts.status ?? 200, headers }), release };
}

/** Let fetches, stream reads and fake SourceBuffer operations run. */
export async function settle(rounds = 30) {
	for (let i = 0; i < rounds; i++) await new Promise((r) => setTimeout(r, 0));
}
