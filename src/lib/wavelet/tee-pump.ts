// Drives the decrypted Deezer stream into the HTTP response branch and, when
// persisting, a second branch that feeds the R2 upload. Kept free of Deezer /
// storage imports so the flow-control rules can be unit-tested.

import type { PassThrough } from "stream";

export interface TeePumpOptions {
	source: AsyncIterable<unknown>;
	responseBranch: PassThrough;
	/** null in preview mode — nothing is written server-side. */
	persistBranch: PassThrough | null;
	/** Cap the response at this many bytes (head prefetch). */
	maxBytes?: number;
	/** Closes the upstream Deezer connection. */
	abort: () => void;
}

export async function pumpTee(opts: TeePumpOptions): Promise<void> {
	const { source, responseBranch, persistBranch, maxBytes, abort } = opts;
	let responseClosed = false;
	const markResponseClosed = () => {
		responseClosed = true;
	};
	responseBranch.on("close", markResponseClosed);
	responseBranch.on("error", markResponseClosed);

	let bytesWritten = 0;
	try {
		for await (const chunk of source) {
			const buf = chunk as Buffer;

			if (persistBranch && !persistBranch.destroyed) {
				persistBranch.write(buf);
			}

			if (responseBranch.destroyed) responseClosed = true;

			// Preview mode: bail out early when client disconnects, since
			// no other consumer wants the bytes.
			if (responseClosed && !persistBranch) break;

			// Feed response only if still open. Preview streams follow the
			// listener's pace (backpressure). Persisting streams never wait
			// for the listener: a paused <audio> stops reading, and waiting
			// would stall the R2 upload until the function times out — the
			// track then never becomes seekable. The unread tail stays
			// buffered in responseBranch (at most one track) instead.
			// Trim the chunk if we'd overshoot maxBytes — this keeps the
			// emitted byte count exact so the audio element knows the
			// duration of the head segment.
			if (!responseClosed && !responseBranch.destroyed) {
				let toWrite: Buffer = buf;
				let shouldClose = false;
				if (maxBytes && bytesWritten + buf.length >= maxBytes) {
					toWrite = buf.subarray(0, maxBytes - bytesWritten);
					shouldClose = true;
				}
				try {
					if (!responseBranch.write(toWrite) && !persistBranch) {
						await new Promise<void>((resolve) => {
							const done = () => {
								responseBranch.off("drain", done);
								responseBranch.off("close", done);
								resolve();
							};
							responseBranch.once("drain", done);
							responseBranch.once("close", done);
						});
					}
					bytesWritten += toWrite.length;
				} catch {
					responseClosed = true;
				}
				if (shouldClose) {
					// Reached the head cap — close the response cleanly. If
					// nothing else is consuming bytes (preview + maxBytes),
					// abort upstream so we don't keep pulling from Deezer.
					if (!responseBranch.destroyed) responseBranch.end();
					responseClosed = true;
					if (!persistBranch) {
						abort();
						break;
					}
				}
			}
		}
		if (persistBranch && !persistBranch.destroyed) persistBranch.end();
		if (!responseClosed && !responseBranch.destroyed) responseBranch.end();
	} catch (e) {
		abort();
		if (persistBranch && !persistBranch.destroyed) {
			persistBranch.destroy(e as Error);
		}
		if (!responseClosed && !responseBranch.destroyed) {
			responseBranch.destroy(e as Error);
		}
	}
}
