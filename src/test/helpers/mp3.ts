// Synthetic MP3 files for the gapless tests: an optional ID3v2 tag, an
// Info/Xing frame with a LAME extension (valid tag CRC), then silent audio
// frames whose payload byte tells them apart.

import { crc16, parseFrameHeader } from "@/components/audio/engine/mp3-gapless";

export interface Mp3Options {
	/** Audio frames after the Info frame. */
	frames: number;
	delay?: number;
	padding?: number;
	encoder?: string;
	/** "Info" (CBR), "Xing" (VBR), or null for no tag frame at all. */
	tag?: "Info" | "Xing" | null;
	/** Xing flags (default 0x0f: frames, bytes, TOC, quality). */
	flags?: number;
	/** Write the LAME extension (default true). */
	lame?: boolean;
	/** Store a valid LAME tag CRC (default true). */
	tagCrc?: boolean;
	/** Size of an ID3v2 tag in front (0 = none). */
	id3?: number;
	/** Bytes 1-3 of every frame header (default MPEG-1 Layer III, 128 kbps, 44.1 kHz, stereo). */
	header?: [number, number, number];
	/** Payload byte of audio frame `i` (default i & 0xff). */
	fill?: (i: number) => number;
	/** Bytes after the last frame (an ID3v1 tag, junk). */
	trailer?: Uint8Array;
}

export const MPEG1_128K: [number, number, number] = [0xfb, 0x90, 0x00];

function id3v2(size: number): Uint8Array {
	const tag = new Uint8Array(size);
	const body = size - 10;
	tag.set([0x49, 0x44, 0x33, 3, 0, 0, (body >> 21) & 0x7f, (body >> 14) & 0x7f, (body >> 7) & 0x7f, body & 0x7f]);
	return tag;
}

export function buildMp3(o: Mp3Options): Uint8Array {
	const header = o.header ?? MPEG1_128K;
	const h = parseFrameHeader(Uint8Array.of(0xff, ...header), 0);
	if (!h) throw new Error("bad test header");
	const len = h.frameLength;
	const id3 = o.id3 ? id3v2(o.id3) : new Uint8Array(0);
	const tagFrames = o.tag === null ? 0 : 1;
	const trailer = o.trailer ?? new Uint8Array(0);
	const out = new Uint8Array(id3.length + (tagFrames + o.frames) * len + trailer.length);
	out.set(id3);
	let at = id3.length;

	if (tagFrames) {
		const f = out.subarray(at, at + len);
		f.set([0xff, ...header]);
		const sideInfo = h.version === 1 ? (h.channels === 1 ? 17 : 32) : h.channels === 1 ? 9 : 17;
		let p = 4 + (h.crc ? 2 : 0) + sideInfo;
		const u32 = (v: number) => {
			f.set([(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff], p);
			p += 4;
		};
		const flags = o.flags ?? 0x0f;
		f.set([...(o.tag ?? "Info")].map((c) => c.charCodeAt(0)), p);
		p += 4;
		u32(flags);
		if (flags & 1) u32(o.frames);
		if (flags & 2) u32((o.frames + 1) * len);
		if (flags & 4) {
			for (let i = 0; i < 100; i++) f[p + i] = Math.floor((i * 256) / 100);
			p += 100;
		}
		if (flags & 8) u32(0);
		if (o.lame !== false && p + 36 <= len) {
			const encoder = (o.encoder ?? "LAME3.100").padEnd(9, "\0").slice(0, 9);
			f.set([...encoder].map((c) => c.charCodeAt(0)), p);
			const delays = ((o.delay ?? 576) << 12) | (o.padding ?? 1000);
			f.set([(delays >> 16) & 0xff, (delays >> 8) & 0xff, delays & 0xff], p + 21);
			const music = (o.frames + 1) * len;
			f.set([(music >>> 24) & 0xff, (music >>> 16) & 0xff, (music >>> 8) & 0xff, music & 0xff], p + 28);
			const crc = o.tagCrc === false ? 0xbeef : crc16(f, 0, p + 34);
			f.set([crc >> 8, crc & 0xff], p + 34);
		}
		at += len;
	}

	for (let i = 0; i < o.frames; i++) {
		out.set([0xff, ...header], at);
		out.fill(o.fill ? o.fill(i) : i & 0xff, at + 4, at + len);
		at += len;
	}
	out.set(trailer, at);
	return out;
}
