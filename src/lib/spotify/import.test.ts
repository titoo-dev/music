import { describe, it, expect } from "vitest";
import { collectMatches, parseClientTracks, parseImportedRows, unreadableRows } from "./import";
import type { MatchResult } from "./match";
import type { SpotifyTrackMeta } from "./types";

const ID = (n: number) => String(n).padStart(22, "a");
const sp = (n: number, title = `Song ${n}`): SpotifyTrackMeta => ({
	spotifyId: ID(n),
	title,
	artists: ["Artist"],
	album: "Album",
	albumId: null,
	durationMs: 200_000,
	isrc: null,
	coverUrl: null,
});
const hit = (id: string): MatchResult => ({
	status: "matched",
	strategy: "fuzzy",
	confidence: 0.9,
	deezerTrackId: id,
	title: `T${id}`,
	artist: "A",
	album: "Al",
	albumId: null,
	coverUrl: "https://cdn/c.jpg",
	duration: 200,
});

describe("parseClientTracks", () => {
	it("drops album and ISRC by default (pasted links carry neither)", () => {
		const [t] = parseClientTracks([{ ...sp(1), isrc: "USUM71703861" }])!;
		expect(t).toMatchObject({ album: "", isrc: null });
	});

	it("keeps album and a valid ISRC with keepMeta (playlist-link tracks)", () => {
		const [t] = parseClientTracks([{ ...sp(1), isrc: "usum71703861" }], { keepMeta: true })!;
		expect(t).toMatchObject({ album: "Album", isrc: "USUM71703861" });
	});

	it("ignores a malformed ISRC instead of sending it to Deezer", () => {
		const [t] = parseClientTracks([{ ...sp(1), isrc: "not-an-isrc" }], { keepMeta: true })!;
		expect(t.isrc).toBeNull();
	});

	it.each([
		["not an array", "nope"],
		["a bad id", [{ ...sp(1), spotifyId: "short" }]],
		["a blank title", [{ ...sp(1), title: "  " }]],
		["no duration", [{ ...sp(1), durationMs: "1" }]],
	])("rejects %s", (_, input) => {
		expect(parseClientTracks(input)).toBeNull();
	});
});

describe("parseImportedRows", () => {
	const row = { trackId: "42", title: "T", artist: "A", album: "Al", albumId: "7", coverUrl: "https://cdn/c.jpg", duration: 200.4 };

	it("keeps a well-formed row and rounds the duration", () => {
		expect(parseImportedRows([row])).toEqual([{ ...row, duration: 200 }]);
	});

	it("drops a non-https cover and a non-numeric album id", () => {
		expect(parseImportedRows([{ ...row, coverUrl: "javascript:alert(1)", albumId: "x" }])![0]).toMatchObject({ coverUrl: null, albumId: null });
	});

	it.each([
		["a non-numeric track id", { ...row, trackId: "abc" }],
		["a missing title", { ...row, title: "" }],
		["a missing artist", { ...row, artist: undefined }],
	])("rejects %s", (_, bad) => {
		expect(parseImportedRows([bad])).toBeNull();
	});
});

describe("collectMatches", () => {
	it("splits rows and misses, keeping the Spotify metadata of a miss", () => {
		const { rows, notFound } = collectMatches([sp(1), sp(2, "Lost")], [hit("10"), { status: "not_found", reason: "nope" }]);
		expect(rows.map((r) => r.trackId)).toEqual(["10"]);
		expect(notFound).toEqual([{ spotifyId: ID(2), title: "Lost", artist: "Artist", album: "Album", reason: "nope" }]);
	});

	it("drops a Deezer track already matched in an earlier batch (shared `seen`)", () => {
		const seen = new Set<string>();
		collectMatches([sp(1)], [hit("10")], seen);
		const { rows } = collectMatches([sp(2), sp(3)], [hit("10"), hit("11")], seen);
		expect(rows.map((r) => r.trackId)).toEqual(["11"]);
	});

	it("treats a missing result as a miss", () => {
		expect(collectMatches([sp(1)], []).notFound).toHaveLength(1);
	});
});

it("unreadableRows reports pasted links Spotify never served", () => {
	expect(unreadableRows([ID(1)])[0]).toMatchObject({ spotifyId: ID(1), title: `spotify:track:${ID(1)}` });
});
