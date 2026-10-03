import { describe, it, expect } from "vitest";
import { parsePlaylistInput, parseTrackLinks } from "./parse-url";

const A = "11hcBLPtbMp4aQI6zGQLub";
const B = "4EoJ151oQ5jY48z4RhSE96";

describe("parseTrackLinks", () => {
	it("reads the newline-separated links Spotify desktop copies with Ctrl+A / Ctrl+C", () => {
		const text = `https://open.spotify.com/track/${A}\nhttps://open.spotify.com/track/${B}\n`;
		expect(parseTrackLinks(text)).toEqual([A, B]);
	});

	it("reads links glued together when pasted into a single-line field", () => {
		expect(parseTrackLinks(`https://open.spotify.com/track/${A}https://open.spotify.com/track/${B}`)).toEqual([A, B]);
	});

	it("accepts spotify:track URIs, intl paths and ?si= params", () => {
		const text = `spotify:track:${A} https://open.spotify.com/intl-fr/track/${B}?si=abc`;
		expect(parseTrackLinks(text)).toEqual([A, B]);
	});

	it("drops duplicates, keeping the first position", () => {
		expect(parseTrackLinks(`spotify:track:${A}\nspotify:track:${B}\nspotify:track:${A}`)).toEqual([A, B]);
	});

	it("ignores local files, playlists and other text", () => {
		expect(parseTrackLinks("spotify:local:Artist:Album:Title:200\nhttps://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")).toEqual([]);
	});
});

describe("parsePlaylistInput", () => {
	it("still parses a playlist link", () => {
		expect(parsePlaylistInput("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x")).toBe("37i9dQZF1DXcBWIGoYBM5M");
	});

	it("does not treat a list of track links as a playlist", () => {
		expect(parsePlaylistInput(`https://open.spotify.com/track/${A}`)).toBeNull();
	});
});
