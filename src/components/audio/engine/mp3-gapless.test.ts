import { describe, it, expect } from "vitest";
import { crc16, id3v2Length, parseFrameHeader, parseGaplessInfo, sameStream, scanFrames } from "./mp3-gapless";
import { ROBOT_ROCK_HEAD, ROBOT_ROCK_LENGTH, SPEAK_TO_ME_HEAD, SPEAK_TO_ME_LENGTH } from "@/test/fixtures/mp3-heads";
import { buildMp3 } from "@/test/helpers/mp3";

const header = (...b: number[]) => Uint8Array.of(0xff, ...b);

function info(bytes: Uint8Array, opts?: { totalLength?: number }) {
	const r = parseGaplessInfo(bytes, opts);
	if (!("info" in r)) throw new Error(`rejected: ${r.reason}`);
	return r.info;
}

describe("parseGaplessInfo — real Deezer headers", () => {
	it('reads a "Lame3.100" tag, which ffmpeg ignores because of its lowercase name', () => {
		expect(info(SPEAK_TO_ME_HEAD, { totalLength: SPEAK_TO_ME_LENGTH })).toEqual({
			audioStart: 417,
			audioEnd: SPEAK_TO_ME_LENGTH,
			version: 1,
			sampleRate: 44100,
			samplesPerFrame: 1152,
			channels: 2,
			bitrateKbps: 128,
			frameCount: 2502,
			encoderDelay: 576,
			encoderPadding: 1362,
			totalSamples: 2502 * 1152 - 576 - 1362,
			encoder: "Lame3.100",
		});
	});

	it('reads a "LAME3.99r" tag', () => {
		const i = info(ROBOT_ROCK_HEAD);
		expect([i.encoder, i.frameCount, i.encoderDelay, i.encoderPadding, i.audioEnd]).toEqual(["LAME3.99r", 14836, 576, 1452, ROBOT_ROCK_LENGTH]);
		// 387.5067 s, what ffprobe reports for the file once trimmed.
		expect(i.totalSamples / i.sampleRate).toBeCloseTo(387.5067, 4);
	});

	it("checks the tag with CRC-16/ARC over the frame up to the CRC field", () => {
		for (const head of [SPEAK_TO_ME_HEAD, ROBOT_ROCK_HEAD]) {
			expect(crc16(head, 0, 190)).toBe((head[190] << 8) | head[191]);
		}
	});

	it("asks for more bytes while the Info frame isn't complete", () => {
		expect(parseGaplessInfo(SPEAK_TO_ME_HEAD.subarray(0, 300))).toEqual({ ok: false, reason: "need-more-data", need: 421 });
		expect(parseGaplessInfo(new Uint8Array(0))).toMatchObject({ reason: "need-more-data" });
	});
});

describe("parseGaplessInfo — layouts", () => {
	it("skips an ID3v2 tag (and its footer) in front of the Info frame", () => {
		const file = buildMp3({ frames: 10, id3: 2048 });
		expect(info(file)).toMatchObject({ audioStart: 2048 + 417, audioEnd: 2048 + 11 * 417, frameCount: 10 });
		const footer = buildMp3({ frames: 10, id3: 2048 });
		footer[5] = 0x10; // the 2048 bytes now end 10 bytes early: a footer follows the tag
		footer.copyWithin(2048, 2048 - 10);
		expect(parseGaplessInfo(footer)).toMatchObject({ ok: true });
	});

	it("waits for the end of a large ID3v2 tag (cover art) before reading the frame", () => {
		const file = buildMp3({ frames: 4, id3: 200_000 });
		expect(parseGaplessInfo(file.subarray(0, 64 * 1024))).toMatchObject({ reason: "need-more-data" });
		expect(parseGaplessInfo(file.subarray(0, 5))).toEqual({ ok: false, reason: "need-more-data", need: 10 });
		expect(info(file).audioStart).toBe(200_000 + 417);
	});

	it("finds the first frame after junk, past a false sync", () => {
		const file = buildMp3({ frames: 4 });
		const junk = Uint8Array.of(0, 0, 0xff, 0xfb, 0x90, 0x00, 0, 7);
		const shifted = new Uint8Array(junk.length + file.length);
		shifted.set(junk);
		shifted.set(file, junk.length);
		expect(info(shifted).audioStart).toBe(junk.length + 417);
	});

	it("accepts a VBR Xing tag like an Info tag", () => {
		expect(info(buildMp3({ frames: 8, tag: "Xing" })).frameCount).toBe(8);
	});

	it("reads MPEG-2 mono frames (9 bytes of side info, 576 samples a frame)", () => {
		// MPEG-2 Layer III, 64 kbps, 22.05 kHz, mono
		const i = info(buildMp3({ frames: 20, header: [0xf3, 0x80, 0xc0], delay: 576, padding: 300 }));
		expect([i.sampleRate, i.samplesPerFrame, i.channels, i.totalSamples]).toEqual([22050, 576, 1, 20 * 576 - 876]);
	});

	it("finds the Info tag after a frame CRC", () => {
		expect(info(buildMp3({ frames: 3, header: [0xfa, 0x90, 0x00] })).frameCount).toBe(3);
	});

	it("leaves the audio end open without a bytes field, or when it points past the file", () => {
		expect(info(buildMp3({ frames: 3, flags: 0x01 })).audioEnd).toBeNull();
		const file = buildMp3({ frames: 3 });
		expect(info(file, { totalLength: 1000 }).audioEnd).toBeNull();
	});

	it("accepts a valid tag CRC whatever the encoder name, and a LAME-family name without one", () => {
		expect(info(buildMp3({ frames: 3, encoder: "Mystery1" })).encoder).toBe("Mystery1");
		expect(info(buildMp3({ frames: 3, encoder: "Lavf58.76", tagCrc: false })).encoder).toBe("Lavf58.76");
	});
});

describe("parseGaplessInfo — rejections (the plain path plays these)", () => {
	const reason = (b: Uint8Array, opts?: { totalLength?: number }) => (parseGaplessInfo(b, opts) as { reason: string }).reason;

	it("not an MP3: FLAC, junk, or a file that ends before a frame", () => {
		expect(reason(Uint8Array.from("fLaC\0\0\0\x22", (c) => c.charCodeAt(0)))).toBe("not-mp3");
		expect(reason(new Uint8Array(8192).fill(7))).toBe("not-mp3");
		expect(reason(Uint8Array.of(0, 1, 2), { totalLength: 3 })).toBe("not-mp3");
	});

	it("not Layer III", () => {
		expect(reason(buildMp3({ frames: 3, header: [0xfd, 0x90, 0x00] }))).toBe("not-layer3");
	});

	it("no Info / Xing tag (plain CBR file, VBRI)", () => {
		expect(reason(buildMp3({ frames: 3, tag: null }))).toBe("no-info-tag");
	});

	it("no frame count", () => {
		expect(reason(buildMp3({ frames: 3, flags: 0x0e }))).toBe("no-frame-count");
	});

	it("no LAME extension, or a foreign one with a wrong CRC", () => {
		expect(reason(buildMp3({ frames: 3, lame: false }))).toBe("no-lame-tag");
		expect(reason(buildMp3({ frames: 3, encoder: "Mystery1", tagCrc: false }))).toBe("no-lame-tag");
		// 48 kbps MPEG-2 mono: a 156-byte frame, too short for the extension after a TOC.
		expect(reason(buildMp3({ frames: 3, header: [0xf3, 0x60, 0xc0] }))).toBe("no-lame-tag");
	});

	it("delay and padding longer than the file", () => {
		expect(reason(buildMp3({ frames: 1, delay: 576, padding: 1000 }))).toBe("bad-lame-tag");
	});
});

describe("parseFrameHeader", () => {
	it("MPEG-1 Layer III: 417 / 418 bytes at 128 kbps, 44.1 kHz", () => {
		expect(parseFrameHeader(header(0xfb, 0x90, 0x00), 0)).toEqual({
			version: 1,
			layer: 3,
			bitrateKbps: 128,
			sampleRate: 44100,
			channels: 2,
			crc: false,
			frameLength: 417,
			samplesPerFrame: 1152,
		});
		expect(parseFrameHeader(header(0xfb, 0x92, 0x00), 0)?.frameLength).toBe(418);
		expect(parseFrameHeader(header(0xfb, 0xe0, 0x00), 0)).toMatchObject({ bitrateKbps: 320, frameLength: 1044 });
	});

	it("Layers I and II, MPEG-2.5", () => {
		expect(parseFrameHeader(header(0xff, 0x90, 0x00), 0)).toMatchObject({ layer: 1, bitrateKbps: 288, samplesPerFrame: 384, frameLength: 312 });
		expect(parseFrameHeader(header(0xfd, 0x90, 0x00), 0)).toMatchObject({ layer: 2, bitrateKbps: 160, samplesPerFrame: 1152 });
		expect(parseFrameHeader(header(0xe3, 0x80, 0x00), 0)).toMatchObject({ version: 2.5, sampleRate: 11025, samplesPerFrame: 576 });
	});

	it("refuses anything that isn't a frame header", () => {
		for (const bad of [
			Uint8Array.of(0xfe, 0xfb, 0x90, 0x00), // no sync
			header(0xeb, 0x90, 0x00), // reserved version
			header(0xf9, 0x90, 0x00), // reserved layer
			header(0xfb, 0x00, 0x00), // free bitrate
			header(0xfb, 0xf0, 0x00), // bad bitrate
			header(0xfb, 0x9c, 0x00), // reserved sample rate
			header(0xfb, 0x90, 0x02), // reserved emphasis
		]) {
			expect(parseFrameHeader(bad, 0)).toBeNull();
		}
		expect(parseFrameHeader(header(0xfb, 0x90), 0)).toBeNull();
		expect(parseFrameHeader(header(0xfb, 0x90, 0x00), -1)).toBeNull();
	});

	it("sameStream compares version, layer and sample rate", () => {
		const a = parseFrameHeader(header(0xfb, 0x90, 0x00), 0)!;
		expect(sameStream(a, parseFrameHeader(header(0xfb, 0xe0, 0xc0), 0)!)).toBe(true);
		expect(sameStream(a, parseFrameHeader(header(0xfb, 0x94, 0x00), 0)!)).toBe(false);
	});
});

describe("id3v2Length", () => {
	it("is 0 without a tag, and stops at a size that isn't syncsafe", () => {
		expect(id3v2Length(Uint8Array.of(0xff, 0xfb))).toEqual({ length: 0 });
		expect(id3v2Length(Uint8Array.from("ID3\x03\0\0\x80\0\0\0", (c) => c.charCodeAt(0)))).toEqual({ length: 0 });
	});

	it("adds up back-to-back tags", () => {
		const two = new Uint8Array(40);
		two.set(Uint8Array.from("ID3\x03\0\0\0\0\0\x0a", (c) => c.charCodeAt(0)));
		two.set(Uint8Array.from("ID3\x03\0\0\0\0\0\x00", (c) => c.charCodeAt(0)), 20);
		expect(id3v2Length(two)).toEqual({ length: 30 });
	});
});

describe("scanFrames", () => {
	const file = buildMp3({ frames: 6, trailer: Uint8Array.from("TAG" + "x".repeat(125), (c) => c.charCodeAt(0)) });
	const ref = parseFrameHeader(file, 0)!;

	it("indexes the complete frames and stops before a partial one", () => {
		const out: number[] = [];
		expect(scanFrames(file, 417, 417 * 4 + 100, ref, out)).toEqual({ next: 417 * 4, broken: false });
		expect(out).toEqual([417, 834, 1251]);
	});

	it("goes on where it stopped, and ends at a trailing tag", () => {
		const out: number[] = [];
		scanFrames(file, 417, 417 * 3, ref, out);
		expect(scanFrames(file, 417 * 3, file.length, ref, out)).toEqual({ next: 417 * 7, broken: true });
		expect(out).toHaveLength(6);
	});

	it("treats a frame of another stream as the end", () => {
		const mixed = buildMp3({ frames: 2 });
		mixed[417 * 2 + 2] = 0x94; // 48 kHz
		expect(scanFrames(mixed, 417, mixed.length, ref, [])).toEqual({ next: 834, broken: true });
	});
});
