// Flow control between the decrypted Deezer stream, the HTTP response and the
// persist pipeline. Kept free of Deezer / storage imports so the rules can be
// unit-tested (tee-pump.test.ts):
//
//  - Persisting plays are disk-first. Every decrypted byte goes straight to a
//    temp file (TrackSpool) at the pace of the CDN and the disk, never at the
//    listener's: a paused <audio> must not stall the R2 upload until the
//    function times out. The HTTP response, and any same-instance follower of
//    the same track, is a tail reader of that file that follows its own
//    client's backpressure, so the server never holds the unread remainder
//    of a track in memory.
//  - Preview and live-only streams (pumpTee) keep in-memory backpressure:
//    nothing is persisted, so the CDN is read at the listener's pace.

import { promises as fsp } from "fs";
import type { FileHandle } from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { Readable, type PassThrough } from "stream";

/** Where persisting plays spool their decrypted bytes (/tmp on Vercel). */
export const SPOOL_DIR = path.join(tmpdir(), "wavelet-spool");
/** Largest chunk a tail reader hands to the response (= the decoder's chunks). */
export const SPOOL_READ_BYTES = 64 * 1024;
/**
 * A disposed spool still read by a stalled client is removed after this long
 * anyway (the route's maxDuration is 300 s; an open fd keeps reading on Linux).
 */
export const SPOOL_LINGER_MS = 330_000;
/** Spool files older than this are leftovers of a killed invocation. */
export const SPOOL_MAX_AGE_MS = 60 * 60 * 1000;
const SWEEP_EVERY_MS = 10 * 60 * 1000;

/**
 * Append-only temp file of one persisting play. One writer (pumpToSpool),
 * any number of tail readers (createReader). The file is removed once the
 * owner disposed it and the last reader closed.
 */
export class TrackSpool {
	readonly path: string;
	/** Settles with the byte count once complete; rejects when the stream failed. */
	readonly done: Promise<number>;
	private fh: FileHandle | null;
	private written = 0;
	private state: "open" | "complete" | "failed" = "open";
	private failure: Error | null = null;
	private waiters: Array<() => void> = [];
	private readers = new Set<Readable>();
	private disposed = false;
	private removed = false;
	private settle!: { resolve: (n: number) => void; reject: (e: Error) => void };

	private constructor(file: string, fh: FileHandle) {
		this.path = file;
		this.fh = fh;
		this.done = new Promise<number>((resolve, reject) => {
			this.settle = { resolve, reject };
		});
		// Owners await it; never let a failure surface as an unhandled rejection.
		this.done.catch(() => {});
	}

	static async create(dir = SPOOL_DIR): Promise<TrackSpool> {
		await fsp.mkdir(dir, { recursive: true });
		maybeSweep(dir);
		const file = path.join(dir, `${randomUUID()}.part`);
		return new TrackSpool(file, await fsp.open(file, "w"));
	}

	get bytesWritten(): number {
		return this.written;
	}
	get complete(): boolean {
		return this.state === "complete";
	}
	get failed(): boolean {
		return this.state === "failed";
	}
	get error(): Error | null {
		return this.failure;
	}
	/** True once the temp file has been deleted. */
	get removedFromDisk(): boolean {
		return this.removed;
	}

	/** Appends a chunk; resolves once it is on disk and visible to readers. */
	async write(chunk: Uint8Array): Promise<void> {
		if (this.state !== "open" || !this.fh) throw this.failure ?? new Error("spool is closed");
		let off = 0;
		while (off < chunk.byteLength) {
			const { bytesWritten } = await this.fh.write(chunk, off, chunk.byteLength - off, this.written + off);
			off += bytesWritten;
		}
		this.written += chunk.byteLength;
		this.wake();
	}

	/** The writer is done: readers end at the current size. */
	async finish(): Promise<number> {
		if (this.state !== "open") return this.done;
		try {
			await this.closeHandle();
		} catch (e) {
			await this.fail(e as Error);
			return this.done;
		}
		this.state = "complete";
		this.wake();
		this.settle.resolve(this.written);
		return this.written;
	}

	/** The stream failed (or was disposed): readers error, `done` rejects. */
	async fail(err: Error): Promise<void> {
		if (this.state !== "open") return;
		this.state = "failed";
		this.failure = err;
		await this.closeHandle().catch(() => {});
		this.wake();
		this.settle.reject(err);
	}

	/**
	 * A tail reader from byte `start`: it reads what is on disk, waits for the
	 * writer while the spool is open, ends when it completes and errors when it
	 * fails. Null once the file is gone.
	 */
	createReader(start = 0): Readable | null {
		if (this.removed) return null;
		const reader: Readable = new SpoolReader(this, start, () => {
			this.readers.delete(reader);
			this.maybeRemove();
		});
		this.readers.add(reader);
		return reader;
	}

	/** The whole file (only meaningful once complete). */
	async readAll(): Promise<Buffer> {
		return fsp.readFile(this.path);
	}

	/** The owner is done with the file: delete it once no reader needs it. */
	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		if (this.state === "open") void this.fail(new Error("spool disposed"));
		this.maybeRemove();
		if (!this.removed) {
			// A client that stalls past the function's lifetime: close its reader
			// (and fd) and delete the file anyway.
			const timer = setTimeout(() => {
				for (const reader of this.readers) reader.destroy();
				this.remove();
			}, SPOOL_LINGER_MS);
			timer.unref?.();
		}
	}

	/** Resolves at the next write / finish / fail. */
	waitForChange(): Promise<void> {
		return new Promise((resolve) => this.waiters.push(resolve));
	}

	private wake() {
		const waiters = this.waiters;
		this.waiters = [];
		for (const w of waiters) w();
	}

	private async closeHandle() {
		const fh = this.fh;
		this.fh = null;
		if (fh) await fh.close();
	}

	private maybeRemove() {
		if (this.disposed && this.readers.size === 0) this.remove();
	}

	private remove() {
		if (this.removed) return;
		this.removed = true;
		void fsp.rm(this.path, { force: true }).catch(() => {});
	}
}

class SpoolReader extends Readable {
	private fh: FileHandle | null = null;
	private pos: number;
	private busy = false;

	constructor(
		private readonly spool: TrackSpool,
		start: number,
		private readonly onClose: () => void
	) {
		super({ highWaterMark: SPOOL_READ_BYTES });
		this.pos = start;
	}

	_construct(callback: (error?: Error | null) => void): void {
		fsp.open(this.spool.path, "r").then(
			(fh) => {
				this.fh = fh;
				callback();
			},
			(err) => callback(err)
		);
	}

	_read(): void {
		void this.step();
	}

	// One read loop at a time; `busy` is cleared right before each push so a
	// _read triggered by that push starts the next loop.
	private async step() {
		if (this.busy) return;
		this.busy = true;
		try {
			for (;;) {
				if (this.destroyed || !this.fh) {
					this.busy = false;
					return;
				}
				const available = this.spool.bytesWritten - this.pos;
				if (available > 0) {
					const n = Math.min(available, SPOOL_READ_BYTES);
					// Not pooled: the response hands a view of it to the web stream.
					const buf = Buffer.allocUnsafeSlow(n);
					const { bytesRead } = await this.fh.read(buf, 0, n, this.pos);
					if (this.destroyed) {
						this.busy = false;
						return;
					}
					if (bytesRead === 0) throw new Error("spool file is shorter than its writer reported");
					this.pos += bytesRead;
					this.busy = false;
					this.push(bytesRead === n ? buf : buf.subarray(0, bytesRead));
					return;
				}
				if (this.spool.failed) throw this.spool.error ?? new Error("spool failed");
				if (this.spool.complete) {
					this.busy = false;
					this.push(null);
					return;
				}
				await this.spool.waitForChange();
			}
		} catch (e) {
			this.busy = false;
			this.destroy(e as Error);
		}
	}

	_destroy(error: Error | null, callback: (error?: Error | null) => void): void {
		const fh = this.fh;
		this.fh = null;
		const done = () => {
			this.onClose();
			callback(error);
		};
		if (fh) fh.close().then(done, done);
		else done();
	}
}

export interface SpoolPumpOptions {
	source: AsyncIterable<unknown>;
	spool: TrackSpool;
	/** Closes the upstream Deezer connection. */
	abort: () => void;
}

/**
 * Writes the decrypted stream into the spool at the pace of the CDN and the
 * disk. It never waits for a listener. Any upstream error (truncation, idle
 * timeout, reset) fails the spool, so nothing gets persisted.
 */
export async function pumpToSpool({ source, spool, abort }: SpoolPumpOptions): Promise<void> {
	try {
		for await (const chunk of source) await spool.write(chunk as Uint8Array);
		await spool.finish();
	} catch (e) {
		abort();
		await spool.fail(e instanceof Error ? e : new Error(String(e)));
	}
}

let lastSweep = 0;

function maybeSweep(dir: string) {
	const now = Date.now();
	if (now - lastSweep < SWEEP_EVERY_MS) return;
	lastSweep = now;
	void sweepStaleSpools(dir).catch(() => {});
}

/** Deletes spool files older than `maxAgeMs` (leftovers of killed invocations). */
export async function sweepStaleSpools(
	dir = SPOOL_DIR,
	maxAgeMs = SPOOL_MAX_AGE_MS,
	now = Date.now()
): Promise<number> {
	let removed = 0;
	const names = await fsp.readdir(dir).catch(() => [] as string[]);
	for (const name of names) {
		if (!name.endsWith(".part")) continue;
		const file = path.join(dir, name);
		try {
			const st = await fsp.stat(file);
			if (now - st.mtimeMs > maxAgeMs) {
				await fsp.rm(file, { force: true });
				removed++;
			}
		} catch {
			// Raced with its owner: already gone.
		}
	}
	return removed;
}

export interface TeePumpOptions {
	source: AsyncIterable<unknown>;
	responseBranch: PassThrough;
	/** Cap the response at this many bytes (head prefetch). */
	maxBytes?: number;
	/** Closes the upstream Deezer connection. */
	abort: () => void;
}

function drained(stream: PassThrough): Promise<void> {
	if (stream.destroyed || !stream.writableNeedDrain) return Promise.resolve();
	return new Promise<void>((resolve) => {
		const done = () => {
			stream.off("drain", done);
			stream.off("close", done);
			resolve();
		};
		stream.once("drain", done);
		stream.once("close", done);
	});
}

/**
 * Live-only streams (preview, head prefetch, ranges, plays persisted by
 * another holder): follow the listener's pace, stop pulling from Deezer as
 * soon as the listener hangs up, and cap the body at maxBytes.
 */
export async function pumpTee(opts: TeePumpOptions): Promise<void> {
	const { source, responseBranch, maxBytes, abort } = opts;
	let responseClosed = false;
	const markResponseClosed = () => {
		responseClosed = true;
	};
	responseBranch.on("close", markResponseClosed);
	responseBranch.on("error", markResponseClosed);

	let bytesWritten = 0;
	try {
		for await (const chunk of source) {
			if (responseClosed || responseBranch.destroyed) {
				// Nobody else wants the bytes: close the CDN connection.
				abort();
				return;
			}
			let toWrite = chunk as Buffer;
			let last = false;
			// Trim the chunk if we'd overshoot maxBytes — this keeps the
			// emitted byte count exact so the audio element knows the
			// duration of the head segment.
			if (maxBytes && bytesWritten + toWrite.length >= maxBytes) {
				toWrite = toWrite.subarray(0, maxBytes - bytesWritten);
				last = true;
			}
			if (!responseBranch.write(toWrite)) await drained(responseBranch);
			bytesWritten += toWrite.length;
			if (last) {
				// Reached the head cap — close the response cleanly and stop
				// pulling from Deezer.
				if (!responseBranch.destroyed) responseBranch.end();
				responseClosed = true;
				abort();
				return;
			}
		}
		if (!responseClosed && !responseBranch.destroyed) responseBranch.end();
	} catch (e) {
		abort();
		if (!responseBranch.destroyed) responseBranch.destroy(e as Error);
	}
}

/**
 * Node Readable → web ReadableStream for a Response body.
 *
 * Hand-rolled instead of Readable.toWeb: the built-in bridge races on client
 * disconnect (a final 'data' chunk is enqueued into a controller the cancel
 * signal already closed — "Invalid state: Controller is already closed" as an
 * uncaughtException in dev). Every controller call is guarded, pause/resume
 * carries the client's backpressure to the source, and chunks are enqueued as
 * views of the source buffers (no copy per chunk).
 */
export function toWebStream(source: Readable): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			let closed = false;
			const enqueue = (chunk: Buffer) => {
				if (closed) return;
				try {
					controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
				} catch {
					closed = true;
				}
				if (
					!closed &&
					controller.desiredSize !== null &&
					controller.desiredSize <= 0 &&
					!source.isPaused()
				) {
					source.pause();
				}
			};
			const close = () => {
				if (closed) return;
				closed = true;
				try {
					controller.close();
				} catch {}
			};
			const fail = (err: unknown) => {
				if (closed) return;
				closed = true;
				try {
					controller.error(err);
				} catch {}
			};
			source.on("data", enqueue);
			source.on("end", close);
			source.on("close", close);
			source.on("error", fail);
		},
		pull() {
			if (source.isPaused() && !source.destroyed) source.resume();
		},
		cancel() {
			// Client aborted — tear the source down (a spool reader releases the
			// file; a live stream closes the CDN connection).
			if (!source.destroyed) source.destroy();
		},
	});
}
