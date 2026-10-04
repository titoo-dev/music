// HTTP side of a progressive play, shared by /stream-progressive and the
// public share stream: Range handling (C2), same-instance followers and the
// cross-instance persist lease (C4), response headers.

import { after, type NextRequest } from "next/server";
import type { Deezer } from "@/lib/deezer";
import type { WaveletApp } from "@/lib/wavelet-app";
import type { Settings } from "@/lib/wavelet/types/Settings";
import {
	startProgressiveStream,
	followProgressiveStream,
	type ProgressiveResult,
	type SharedSpool,
} from "@/lib/wavelet/progressive-stream";
import { acquirePersistLease, type PersistLease } from "@/lib/wavelet/storage/persist-lease";
import { RangeNotSatisfiableError, RangeNotSupportedError } from "@/lib/wavelet/stream-errors";
import { fail } from "../../_lib/helpers";

export type ParsedRange =
	/** No usable Range header: a normal play. */
	| { kind: "none" }
	/** "bytes=0-": a normal play answered with 206 when the CDN allows ranges. */
	| { kind: "open-start" }
	/** Any other single range: live-only, never persisted. */
	| { kind: "range"; start: number; end?: number };

/**
 * Single "bytes=a-b" / "bytes=a-" ranges. Multi-ranges, suffix ranges
 * ("bytes=-n") and malformed headers are ignored (RFC 9110 allows it): the
 * request is then served as a normal play.
 */
export function parseRangeHeader(header: string | null): ParsedRange {
	const m = header?.trim().match(/^bytes=(\d+)-(\d*)$/);
	if (!m) return { kind: "none" };
	const start = Number(m[1]);
	const end = m[2] === "" ? undefined : Number(m[2]);
	if (!Number.isSafeInteger(start) || (end !== undefined && (!Number.isSafeInteger(end) || end < start))) {
		return { kind: "none" };
	}
	if (start === 0 && end === undefined) return { kind: "open-start" };
	return { kind: "range", start, end };
}

export interface PlayContext {
	request: NextRequest;
	dz: Deezer;
	app: WaveletApp;
	trackId: string;
	userId: string;
	settings: Settings;
	/** Server maxBitrate (M). */
	bitrate: number;
	/** Quality this listener may get (M capped by licence): the lock / lease key. */
	requestedBitrate: number;
	cacheControl: string;
}

function fullResponse(result: ProgressiveResult, ctx: PlayContext, rangeRequested: boolean): Response {
	const headers: Record<string, string> = {
		"Content-Type": result.contentType,
		"Cache-Control": ctx.cacheControl,
		"Accept-Ranges": result.rangeSupported ? "bytes" : "none",
	};
	if (result.contentLength > 0) headers["Content-Length"] = String(result.contentLength);
	if (rangeRequested && result.rangeSupported && result.totalLength) {
		headers["Content-Range"] = `bytes 0-${result.totalLength - 1}/${result.totalLength}`;
		return new Response(result.body, { status: 206, headers });
	}
	return new Response(result.body, { status: 200, headers });
}

/** Streams the track without persisting it, at the listener's pace. */
async function liveFull(ctx: PlayContext, rangeRequested: boolean): Promise<Response> {
	const result = await startProgressiveStream({
		dz: ctx.dz,
		trackId: ctx.trackId,
		bitrate: ctx.bitrate,
		settings: ctx.settings,
		storageProvider: ctx.app.storageProvider!,
		userId: ctx.userId,
		persist: false,
		signal: ctx.request.signal,
	});
	return fullResponse(result, ctx, rangeRequested);
}

/**
 * A normal play: persists the track unless another request already does.
 *  - same instance: follow the holder's in-progress spool (no waiting for its
 *    persist; live stream if the holder never opened one);
 *  - another instance holds the PersistLease: stream live without persisting.
 */
async function persistingPlay(ctx: PlayContext, rangeRequested: boolean): Promise<Response> {
	const lock = ctx.app.acquireDownloadLock(ctx.trackId, ctx.requestedBitrate);
	if (lock.alreadyInProgress) {
		const shared = await lock.follow<SharedSpool>();
		const followed = shared ? followProgressiveStream(shared) : null;
		if (followed) return fullResponse(followed, ctx, rangeRequested);
		return liveFull(ctx, rangeRequested);
	}

	if (!ctx.app.storageProvider) {
		lock.release();
		return fail("STORAGE_UNAVAILABLE", "Storage provider not initialized.", 500);
	}

	let lease: PersistLease | undefined;
	try {
		const r = await acquirePersistLease(ctx.trackId, ctx.requestedBitrate);
		if (!r.acquired) {
			lock.release();
			return liveFull(ctx, rangeRequested);
		}
		lease = r.lease;
	} catch (e) {
		// Fail open: a duplicate persist is harmless, never persisting is not.
		console.warn("[stream-progressive] persist lease unavailable, persisting without it:", e);
	}

	let result: ProgressiveResult;
	try {
		result = await startProgressiveStream({
			dz: ctx.dz,
			trackId: ctx.trackId,
			bitrate: ctx.bitrate,
			settings: ctx.settings,
			storageProvider: ctx.app.storageProvider,
			userId: ctx.userId,
			lock: { release: lock.release, publish: lock.publish },
			lease,
			persist: true,
		});
	} catch (e) {
		lock.release();
		await lease?.release();
		throw e;
	}

	// Keep the function alive until the file is tagged, uploaded and recorded.
	after(() => result.persisted);
	return fullResponse(result, ctx, rangeRequested);
}

/**
 * C2: "bytes=a-b" (other than "bytes=0-") → 206 live-only, lock-free; a CDN
 * that refuses ranges → normal play (200, Accept-Ranges: none); past the end
 * → 416. Everything else is a normal play.
 */
export async function servePlay(ctx: PlayContext): Promise<Response> {
	const range = parseRangeHeader(ctx.request.headers.get("range"));
	if (range.kind === "range") {
		try {
			const result = await startProgressiveStream({
				dz: ctx.dz,
				trackId: ctx.trackId,
				bitrate: ctx.bitrate,
				settings: ctx.settings,
				storageProvider: ctx.app.storageProvider!,
				userId: ctx.userId,
				persist: false,
				range: { start: range.start, end: range.end },
				signal: ctx.request.signal,
			});
			const headers: Record<string, string> = {
				"Content-Type": result.contentType,
				"Cache-Control": ctx.cacheControl,
				"Accept-Ranges": "bytes",
				"Content-Length": String(result.contentLength),
				"Content-Range": `bytes ${result.start}-${result.end}/${result.totalLength}`,
			};
			return new Response(result.body, { status: 206, headers });
		} catch (e) {
			if (e instanceof RangeNotSatisfiableError) {
				return new Response(null, {
					status: 416,
					headers: {
						"Content-Range": `bytes */${e.totalLength ?? "*"}`,
						"Cache-Control": ctx.cacheControl,
					},
				});
			}
			if (!(e instanceof RangeNotSupportedError)) throw e;
			// The CDN ignores Range for this file: serve the whole track (200).
			return persistingPlay(ctx, false);
		}
	}
	return persistingPlay(ctx, range.kind === "open-start");
}
