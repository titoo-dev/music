import { describe, it, expect } from "vitest";
import { parseEmbedHtml, splitArtists, EMBED_TRACK_LIMIT } from "./embed";
import { embedHtml } from "./embed.fixture";

describe("parseEmbedHtml", () => {
	it("extracts playlist metadata and tracks", () => {
		const pl = parseEmbedHtml(
			embedHtml({
				tracks: [
					{ title: "Patient Zero", subtitle: "Taylor Swift", duration: 225_868, uri: "spotify:track:11hcBLPtbMp4aQI6zGQLub" },
					{ title: "Duet", subtitle: "A, B", duration: 1000 },
				],
			})
		);

		expect(pl).toMatchObject({
			spotifyId: "37i9dQZF1DXcBWIGoYBM5M",
			title: "Today’s Top Hits",
			ownerName: "Spotify",
			coverUrl: "https://i.scdn.co/image/cover",
			totalTracks: 2,
			source: "embed",
			limited: false,
		});
		expect(pl.tracks[0]).toEqual({
			spotifyId: "11hcBLPtbMp4aQI6zGQLub",
			title: "Patient Zero",
			artists: ["Taylor Swift"],
			album: "",
			albumId: null,
			durationMs: 225_868,
			isrc: null,
			coverUrl: null,
		});
		expect(pl.tracks[1].artists).toEqual(["A", "B"]);
	});

	it("skips episodes and local files", () => {
		const pl = parseEmbedHtml(
			embedHtml({
				tracks: [
					{ title: "Pod", subtitle: "Show", duration: 1, entityType: "episode" },
					{ title: "Local", subtitle: "Me", duration: 1, uri: "spotify:local:a:b:c:1" },
					{ title: "Song", subtitle: "Artist", duration: 1 },
				],
			})
		);
		expect(pl.tracks.map((t) => t.title)).toEqual(["Song"]);
	});

	it("flags a playlist that hit the embed's 100-track cap as limited", () => {
		const tracks = Array.from({ length: EMBED_TRACK_LIMIT }, (_, i) => ({ title: `t${i}`, subtitle: "a", duration: 1 }));
		expect(parseEmbedHtml(embedHtml({ tracks })).limited).toBe(true);
	});

	it("throws when the page has no playlist payload", () => {
		expect(() => parseEmbedHtml("<html></html>")).toThrow(/embed/i);
		expect(() =>
			parseEmbedHtml('<script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>')
		).toThrow(/embed/i);
	});
});

describe("splitArtists", () => {
	it("splits the comma-joined subtitle", () => {
		expect(splitArtists("Taylor Swift, Ed Sheeran")).toEqual(["Taylor Swift", "Ed Sheeran"]);
	});

	it("keeps artists whose name contains a comma intact", () => {
		expect(splitArtists("Tyler, The Creator, Kali Uchis")).toEqual(["Tyler, The Creator", "Kali Uchis"]);
	});

	it("returns [] for an empty subtitle", () => {
		expect(splitArtists("")).toEqual([]);
	});
});
