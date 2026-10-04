// @vitest-environment node
import { describe, it, expect } from "vitest";
import Metaflac from "metaflac-js2";
import { tagID3Buffer, tagFLACBuffer } from "./tagger";
import { DEFAULT_SETTINGS } from "./settings";
import type Track from "./types/Track";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG_1X1 = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
	"base64"
);

function track(): Track {
	return {
		id: 1,
		title: "Song",
		artists: ["Artist"],
		artist: { Main: ["Artist"] },
		mainArtist: { name: "Artist", save: true },
		artistsString: "Artist",
		album: {
			title: "Album",
			artists: ["Artist"],
			mainArtist: { name: "Artist", save: true },
			genre: [],
			trackTotal: 1,
			discTotal: 1,
			label: "Label",
			barcode: "123",
			embeddedCoverPath: "",
		},
		trackNumber: 1,
		discNumber: 1,
		date: { year: "2020", month: "01", day: "02", format: () => "2020-01-02" },
		dateString: "2020-01-02",
		duration: 200,
		ISRC: "ISRC",
		bpm: 0,
		lyrics: null,
		contributors: {},
		copyright: "",
		explicit: false,
		replayGain: "",
		playlist: null,
	} as unknown as Track;
}

/** Minimal FLAC: marker + last STREAMINFO block + some frame bytes. */
function flac(): Buffer {
	const header = Buffer.from([0x80, 0, 0, 34]);
	return Buffer.concat([Buffer.from("fLaC"), header, Buffer.alloc(34), Buffer.from("frames-bytes")]);
}

describe("buffer taggers (progressive persists tag in memory, never the spooled file)", () => {
	it("ID3-tags an MP3 buffer without modifying the input and keeps the audio intact", async () => {
		const audio = Buffer.from("\xff\xfbMP3-FRAMES-PAYLOAD", "latin1");
		const before = Buffer.from(audio);

		const tagged = await tagID3Buffer(audio, track(), { ...DEFAULT_SETTINGS.tags, saveID3v1: false }, JPEG);

		expect(audio.equals(before)).toBe(true);
		expect(tagged.subarray(0, 3).toString()).toBe("ID3");
		expect(tagged.subarray(tagged.length - audio.length).equals(audio)).toBe(true);
		expect(tagged.includes(Buffer.from("image/jpeg"))).toBe(true);
	});

	it("appends an ID3v1 trailer when asked", async () => {
		const tagged = await tagID3Buffer(Buffer.from("\xff\xfbAUDIO", "latin1"), track(), { ...DEFAULT_SETTINGS.tags, saveID3v1: true });
		expect(tagged.subarray(-128, -125).toString()).toBe("TAG");
	});

	it("works on a view into a larger buffer", async () => {
		const big = Buffer.from("xxxx\xff\xfbAUDIOyyyy", "latin1");
		const view = big.subarray(4, 11);
		const tagged = await tagID3Buffer(view, track(), { ...DEFAULT_SETTINGS.tags, saveID3v1: false });
		expect(tagged.subarray(tagged.length - view.length).toString("latin1")).toBe("\xff\xfbAUDIO");
	});

	it("Vorbis-tags a FLAC buffer and returns the tagged bytes", async () => {
		const input = flac();
		const before = Buffer.from(input);

		const tagged = await tagFLACBuffer(input, track(), DEFAULT_SETTINGS.tags, PNG_1X1);

		expect(input.equals(before)).toBe(true);
		// metaflac-js2 does not parse comments back: check the raw blocks.
		expect(tagged.subarray(0, 4).toString()).toBe("fLaC");
		expect(tagged.includes(Buffer.from("TITLE=Song"))).toBe(true);
		expect(tagged.includes(Buffer.from("image/png"))).toBe(true);
		expect(() => new Metaflac(tagged)).not.toThrow();
		expect(tagged.subarray(tagged.length - "frames-bytes".length).toString()).toBe("frames-bytes");
	});
});
