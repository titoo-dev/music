// Size of a hover "head" prefetch (?preview=1&head=1): a few seconds of audio
// at the quality being streamed, so the browser's <audio> reaches canplay.
// A flat 64 KiB was ~0.5 s of FLAC, so FLAC heads rebuffered at the handoff.

import { TrackFormats } from "@/lib/deezer";

/** Floor: an MP3 header plus a couple of seconds of 128 kbps audio. */
export const HEAD_MIN_BYTES = 64 * 1024;
/** Ceiling, so a sliding-window prefetch over a list stays cheap. */
export const HEAD_MAX_BYTES = 512 * 1024;
const HEAD_SECONDS = 3;

// Approximate bytes per second for each format (FLAC is VBR: ~960 kbps typical).
const BYTES_PER_SECOND: Record<number, number> = {
	[TrackFormats.MP3_128]: 16_000,
	[TrackFormats.MP3_320]: 40_000,
	[TrackFormats.FLAC]: 120_000,
};

export function headPrefetchBytes(bitrate: number): number {
	const bytesPerSecond = BYTES_PER_SECOND[bitrate];
	if (!bytesPerSecond) return HEAD_MIN_BYTES;
	return Math.min(HEAD_MAX_BYTES, Math.max(HEAD_MIN_BYTES, HEAD_SECONDS * bytesPerSecond));
}
