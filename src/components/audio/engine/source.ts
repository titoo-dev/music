// Source policy for the player's <audio> elements: which URL a track plays
// from, and how to recover when that URL fails. DOM-free so the decisions
// are unit-testable.

import type { TimeRangesLike } from "@/lib/seek";
import { progressiveUrl, type PresignedUrls } from "./presigned-urls";

export type SourceKind = "none" | "blob" | "presigned" | "progressive" | "proxy";

/**
 * What kind of URL an element plays: an IndexedDB blob, a presigned R2 URL,
 * the live progressive stream or the range-capable proxy /api/v1/stream.
 * `pageOrigin` keeps an emptied element (src "" resolves to the page URL)
 * from being mistaken for a presigned URL.
 */
export function classifySource(src: string | null | undefined, pageOrigin?: string): SourceKind {
	if (!src) return "none";
	if (src.startsWith("blob:")) return "blob";
	if (src.includes("/api/v1/stream-progressive/")) return "progressive";
	if (src.includes("/api/v1/stream/")) return "proxy";
	if (!/^https?:\/\//i.test(src)) return "none";
	if (pageOrigin && src.startsWith(`${pageOrigin}/`)) return "none";
	return "presigned";
}

/** An https page can't play http audio (mixed content). */
export function isMixedContent(url: string, pageProtocol: string): boolean {
	return pageProtocol === "https:" && url.startsWith("http://");
}

export type Recovery =
	/** Drop the corrupt IndexedDB copy and reload from the network at the same position. */
	| { action: "evict-blob" }
	/** Fetch a fresh presigned URL (the old one expired during a long pause) and resume. */
	| { action: "resign" }
	/** Refuse presigned for this track only; resume on the range-capable proxy. */
	| { action: "proxy" }
	| { action: "retry"; delayMs: number }
	| { action: "give-up" };

/**
 * What to do when the current element errors. An expired presigned URL is
 * re-signed once; a presigned URL that fails while still valid (or again
 * after re-signing) is refused for that track — never for the whole session
 * (was: one failure disabled presigned playback until reload). A blob is
 * never retried: its cache entry is removed.
 */
export function planRecovery(input: {
	source: SourceKind;
	/** A fresh presigned URL was already tried for this track. */
	resigned: boolean;
	/** The failing presigned URL is past (or unknown to) its usable window. */
	urlExpired: boolean;
	/** Retries already spent on the network stream. */
	retryCount: number;
	maxRetries: number;
	/** A signed-out user gets the same 401 on every retry. */
	knownGuest: boolean;
}): Recovery {
	if (input.source === "blob") return { action: "evict-blob" };
	if (input.source === "presigned") {
		return !input.resigned && input.urlExpired ? { action: "resign" } : { action: "proxy" };
	}
	if (input.knownGuest || input.retryCount >= input.maxRetries) return { action: "give-up" };
	return { action: "retry", delayMs: 1000 * (input.retryCount + 1) };
}

/**
 * Before resuming a paused element on a presigned URL: re-sign when the URL
 * is (about to be) expired and the rest of the track isn't buffered — the
 * next range request would get a 403.
 */
export function needsResign(opts: {
	usableUntil: number | null;
	now: number;
	currentTime: number;
	duration: number;
	buffered: TimeRangesLike;
}): boolean {
	if (opts.usableUntil === null || opts.usableUntil > opts.now) return false;
	const { buffered, currentTime, duration } = opts;
	if (!isFinite(duration) || duration <= 0) return true;
	for (let i = 0; i < buffered.length; i++) {
		if (buffered.start(i) <= currentTime + 0.5 && buffered.end(i) >= duration - 0.5) return false;
	}
	return true;
}

/**
 * The URL a track should play from. Priority: IndexedDB blob (instant, no
 * network) → presigned R2 URL (cached server-side, range-capable) → the
 * progressive endpoint (live from Deezer; `persist: false` asks for a
 * preview stream that never makes the server store the track).
 */
export async function resolvePlaybackUrl(
	trackId: string,
	deps: {
		urls: PresignedUrls;
		blobUrl?: (trackId: string) => Promise<string | null>;
		pageProtocol?: string;
		skipBlob?: boolean;
		persist?: boolean;
	}
): Promise<string> {
	if (!deps.skipBlob && deps.blobUrl) {
		const blob = await deps.blobUrl(trackId).catch(() => null);
		if (blob) return blob;
	}
	const presigned = await deps.urls.get(trackId);
	if (presigned) {
		if (!isMixedContent(presigned, deps.pageProtocol ?? "")) return presigned;
		// Per track: the next track pays one cheap sign call, not a failed load.
		deps.urls.deny(trackId);
	}
	return progressiveUrl(trackId, { preview: deps.persist === false });
}
