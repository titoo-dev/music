// Gapless metadata of an MP3 file: how many samples the encoder added in
// front of the music (encoder delay) and after it (padding), read from the
// LAME extension of the Xing / Info header. Pure and DOM-free so it is
// unit-tested on real header bytes.
//
//   [ID3v2 tag(s)] [Info frame: header · side info · "Xing"|"Info" · flags ·
//   frames · bytes · TOC · quality · LAME extension (36 bytes)] [audio frames…]
//
// Reference: http://gabriel.mp3-tech.org/mp3infotag.html. Deezer files carry
// the extension as "LAME3.99r" or "Lame3.100" (ffmpeg ignores the latter
// because it compares the encoder name case-sensitively).

export interface MpegFrameHeader {
	version: 1 | 2 | 2.5;
	layer: 1 | 2 | 3;
	bitrateKbps: number;
	sampleRate: number;
	channels: 1 | 2;
	/** A CRC-16 follows the 4-byte header. */
	crc: boolean;
	/** Whole frame in bytes, header included. */
	frameLength: number;
	samplesPerFrame: number;
}

export interface GaplessInfo {
	/** Byte offset of the first audio frame (after ID3v2 and the Info frame). */
	audioStart: number;
	/** Byte offset where the audio frames end (from the Info "bytes" field), null = end of file. */
	audioEnd: number | null;
	/** MPEG version (with Layer III and the sample rate: what every frame of the file shares). */
	version: 1 | 2 | 2.5;
	sampleRate: number;
	samplesPerFrame: number;
	channels: 1 | 2;
	bitrateKbps: number;
	/** Audio frames after the Info frame. */
	frameCount: number;
	encoderDelay: number;
	encoderPadding: number;
	/** Samples of music: frameCount × samplesPerFrame − delay − padding. */
	totalSamples: number;
	encoder: string;
}

export type GaplessRejection =
	| "need-more-data"
	| "not-mp3"
	| "not-layer3"
	| "no-info-tag"
	| "no-frame-count"
	| "no-lame-tag"
	| "bad-lame-tag";

export type GaplessParse =
	| { ok: true; info: GaplessInfo }
	| { ok: false; reason: GaplessRejection; /** Bytes needed before parsing can go on ("need-more-data"). */ need?: number };

const BITRATES: Record<string, number[]> = {
	"1-1": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
	"1-2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
	"1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
	"2-1": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
	"2-2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES: Record<string, number[]> = {
	"1": [44100, 48000, 32000],
	"2": [22050, 24000, 16000],
	"2.5": [11025, 12000, 8000],
};

/** How far past the ID3v2 tag the first frame may start (zero padding, junk). */
const SYNC_SEARCH_BYTES = 4096;
/** Size of the LAME extension that follows the Xing fields. */
const LAME_EXTENSION_BYTES = 36;
/** Encoders known to write the LAME extension (LAME itself, ffmpeg's muxer). */
const LAME_ENCODER = /^(lame|l3\.9|lavf|lavc)/i;

/** Parse the 4-byte MPEG audio frame header at `at`; null when it isn't one. */
export function parseFrameHeader(b: Uint8Array, at: number): MpegFrameHeader | null {
	if (at < 0 || at + 4 > b.length) return null;
	const b1 = b[at + 1];
	const b2 = b[at + 2];
	const b3 = b[at + 3];
	if (b[at] !== 0xff || (b1 & 0xe0) !== 0xe0) return null;
	const v = (b1 >> 3) & 3;
	const l = (b1 >> 1) & 3;
	const bitrateIndex = b2 >> 4;
	const rateIndex = (b2 >> 2) & 3;
	if (v === 1 || l === 0 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3 || (b3 & 3) === 2) return null;
	const version = v === 3 ? 1 : v === 2 ? 2 : 2.5;
	const layer = (4 - l) as 1 | 2 | 3;
	const table = BITRATES[`${version === 1 ? 1 : 2}-${version === 1 ? layer : Math.min(layer, 2)}`];
	const bitrateKbps = table[bitrateIndex];
	const sampleRate = SAMPLE_RATES[String(version)][rateIndex];
	const padding = (b2 >> 1) & 1;
	const samplesPerFrame = layer === 1 ? 384 : layer === 2 || version === 1 ? 1152 : 576;
	const frameLength =
		layer === 1
			? (Math.floor((12 * bitrateKbps * 1000) / sampleRate) + padding) * 4
			: Math.floor(((samplesPerFrame / 8) * bitrateKbps * 1000) / sampleRate) + padding;
	return {
		version,
		layer,
		bitrateKbps,
		sampleRate,
		channels: b3 >> 6 === 3 ? 1 : 2,
		crc: (b1 & 1) === 0,
		frameLength,
		samplesPerFrame,
	};
}

/** What every frame of one file shares. */
type StreamKey = Pick<MpegFrameHeader, "version" | "layer" | "sampleRate">;

/** Two frame headers of the same stream (frames of one file never change these). */
export function sameStream(a: StreamKey, b: StreamKey): boolean {
	return a.version === b.version && a.layer === b.layer && a.sampleRate === b.sampleRate;
}

/**
 * Size of the ID3v2 tag(s) at the start of the file (0 when there is none),
 * or null when the bytes so far don't reach the end of a tag's header.
 */
export function id3v2Length(b: Uint8Array): { length: number } | { need: number } {
	let off = 0;
	while (b.length >= off + 3 && b[off] === 0x49 && b[off + 1] === 0x44 && b[off + 2] === 0x33) {
		if (b.length < off + 10) return { need: off + 10 };
		const s = [b[off + 6], b[off + 7], b[off + 8], b[off + 9]];
		if (s.some((x) => x & 0x80)) break; // not a syncsafe size: not a tag
		const size = (s[0] << 21) | (s[1] << 14) | (s[2] << 7) | s[3];
		off += 10 + size + (b[off + 5] & 0x10 ? 10 : 0);
	}
	return { length: off };
}

/** CRC-16/ARC (reflected 0x8005), the checksum of the LAME tag. */
export function crc16(b: Uint8Array, start: number, end: number): number {
	let crc = 0;
	for (let i = start; i < end; i++) {
		crc ^= b[i];
		for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
	}
	return crc;
}

const u32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
const tagAt = (b: Uint8Array, at: number, tag: string) =>
	at + 4 <= b.length && tag.split("").every((c, i) => b[at + i] === c.charCodeAt(0));

/** Find the first frame after `from`: a valid header followed by a second one of the same stream. */
function findFirstFrame(
	b: Uint8Array,
	from: number,
	totalLength: number | undefined
): { at: number; header: MpegFrameHeader } | { need: number } | null {
	const limit = from + SYNC_SEARCH_BYTES;
	for (let i = from; i < limit; i++) {
		if (i + 4 > b.length) break;
		const header = parseFrameHeader(b, i);
		if (!header) continue;
		const nextAt = i + header.frameLength;
		if (totalLength !== undefined && nextAt >= totalLength) return { at: i, header };
		if (nextAt + 4 > b.length) return { need: nextAt + 4 };
		const next = parseFrameHeader(b, nextAt);
		if (next && sameStream(header, next)) return { at: i, header };
	}
	const searched = Math.min(limit, b.length);
	if (searched < limit && (totalLength === undefined || searched < totalLength)) return { need: limit + 4 };
	return null;
}

/**
 * Read the gapless data of an MP3 from its first bytes (usually under 1 KB
 * after the ID3v2 tag). `totalLength` = the file's size when known: a file
 * shorter than what parsing asks for is final, not "need-more-data".
 */
export function parseGaplessInfo(b: Uint8Array, opts: { totalLength?: number } = {}): GaplessParse {
	const more = (need: number): GaplessParse =>
		opts.totalLength !== undefined && b.length >= opts.totalLength
			? { ok: false, reason: "not-mp3" }
			: { ok: false, reason: "need-more-data", need };

	const id3 = id3v2Length(b);
	if ("need" in id3) return more(id3.need);
	if (id3.length > b.length) return more(id3.length + 1024);
	if (tagAt(b, id3.length, "fLaC")) return { ok: false, reason: "not-mp3" };

	const first = findFirstFrame(b, id3.length, opts.totalLength);
	if (!first) return { ok: false, reason: "not-mp3" };
	if ("need" in first) return more(first.need);
	const { at, header } = first;
	if (header.layer !== 3) return { ok: false, reason: "not-layer3" };
	if (at + header.frameLength > b.length) return more(at + header.frameLength);

	const sideInfo = header.version === 1 ? (header.channels === 1 ? 17 : 32) : header.channels === 1 ? 9 : 17;
	const candidates = [at + 4 + sideInfo, at + 6 + sideInfo];
	const x = candidates.find((c) => tagAt(b, c, "Xing") || tagAt(b, c, "Info"));
	if (x === undefined) return { ok: false, reason: "no-info-tag" };

	const flags = u32(b, x + 4);
	let p = x + 8;
	let frameCount: number | null = null;
	let bytes: number | null = null;
	if (flags & 1) {
		frameCount = u32(b, p);
		p += 4;
	}
	if (flags & 2) {
		bytes = u32(b, p);
		p += 4;
	}
	if (flags & 4) p += 100;
	if (flags & 8) p += 4;
	if (frameCount === null || frameCount === 0) return { ok: false, reason: "no-frame-count" };
	if (p + LAME_EXTENSION_BYTES > at + header.frameLength) return { ok: false, reason: "no-lame-tag" };

	const encoder = String.fromCharCode(...b.subarray(p, p + 9)).replace(/[^\x20-\x7e]+$/g, "");
	const crcOk = crc16(b, at, p + 34) === ((b[p + 34] << 8) | b[p + 35]);
	if (!crcOk && !LAME_ENCODER.test(encoder)) return { ok: false, reason: "no-lame-tag" };

	const delays = (b[p + 21] << 16) | (b[p + 22] << 8) | b[p + 23];
	const encoderDelay = delays >> 12;
	const encoderPadding = delays & 0xfff;
	const totalSamples = frameCount * header.samplesPerFrame - encoderDelay - encoderPadding;
	if (totalSamples <= 0) return { ok: false, reason: "bad-lame-tag" };

	// "bytes" counts the Info frame and every audio frame, never the ID3 tag.
	const audioEnd = bytes !== null && bytes > header.frameLength ? at + bytes : null;
	return {
		ok: true,
		info: {
			audioStart: at + header.frameLength,
			audioEnd: audioEnd !== null && opts.totalLength !== undefined && audioEnd > opts.totalLength ? null : audioEnd,
			version: header.version,
			sampleRate: header.sampleRate,
			samplesPerFrame: header.samplesPerFrame,
			channels: header.channels,
			bitrateKbps: header.bitrateKbps,
			frameCount,
			encoderDelay,
			encoderPadding,
			totalSamples,
			encoder,
		},
	};
}

/**
 * Index the complete frames of b[from, end): their byte offsets are pushed
 * to `out`. Stops at the first frame that isn't complete yet (more data to
 * come) or isn't a frame of the same stream (`broken`: a trailing tag or
 * junk ends the audio).
 */
export function scanFrames(
	b: Uint8Array,
	from: number,
	end: number,
	ref: StreamKey,
	out: number[]
): { next: number; broken: boolean } {
	let at = from;
	const limit = Math.min(end, b.length);
	while (at + 4 <= limit) {
		const h = parseFrameHeader(b, at);
		if (!h || !sameStream(h, ref)) return { next: at, broken: true };
		if (at + h.frameLength > limit) break;
		out.push(at);
		at += h.frameLength;
	}
	return { next: at, broken: false };
}
