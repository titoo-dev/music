import { describe, expect, it } from "vitest";
import {
	GENRES,
	albumProps,
	albumSubtitle,
	artistProps,
	artistSubtitle,
	formatCompact,
	hasMorePages,
	isMainEmpty,
	mainTotals,
	parseRecent,
	parseTab,
	pickTopResult,
	playlistProps,
	playlistSubtitle,
	plural,
	pushRecent,
	randomGenre,
	removeRecent,
	seedFromHex,
	trackCover,
} from "./search-model";

describe("parseTab", () => {
	it("accepts known tabs and falls back to all", () => {
		expect(parseTab("album")).toBe("album");
		expect(parseTab("playlist")).toBe("playlist");
		expect(parseTab(null)).toBe("all");
		expect(parseTab("podcast")).toBe("all");
	});
});

describe("genres", () => {
	it("has the twelve mobile tiles", () => {
		expect(GENRES.map((g) => g.name)).toEqual(["Pop", "Hip-Hop", "Rock", "Electronic", "R&B", "Jazz", "Afro", "Lo-fi", "Classical", "Reggae", "K-Pop", "Metal"]);
	});

	it("turns a seed hex into an OKLCH hue + chroma factor", () => {
		const pink = seedFromHex("#E91E63");
		expect(pink.hue).toBeGreaterThan(0);
		expect(pink.hue).toBeLessThan(20);
		expect(pink.chroma).toBe(1);
		const indigo = seedFromHex("3F51B5");
		expect(indigo.hue).toBeGreaterThan(250);
		expect(indigo.hue).toBeLessThan(290);
	});

	it("gives grey seeds no chroma and malformed seeds the brand seed", () => {
		expect(seedFromHex("#424242").chroma).toBe(0);
		expect(seedFromHex("nope")).toEqual({ hue: 277, chroma: 1 });
	});

	it("picks a random genre within bounds", () => {
		expect(randomGenre(() => 0)).toBe("Pop");
		expect(randomGenre(() => 0.9999)).toBe("Metal");
		expect(randomGenre(() => 1)).toBe("Metal");
	});
});

describe("recent searches", () => {
	it("puts the newest first, de-duplicates case-insensitively and caps", () => {
		expect(pushRecent(["daft punk", "muse"], "  Muse ")).toEqual(["Muse", "daft punk"]);
		expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
	});

	it("ignores blank terms", () => {
		expect(pushRecent(["a"], "   ")).toEqual(["a"]);
	});

	it("removes one entry", () => {
		expect(removeRecent(["a", "b"], "a")).toEqual(["b"]);
	});

	it("parses stored values defensively", () => {
		expect(parseRecent(null)).toEqual([]);
		expect(parseRecent("{bad")).toEqual([]);
		expect(parseRecent('{"a":1}')).toEqual([]);
		expect(parseRecent('["a", 3, "", "b"]')).toEqual(["a", "b"]);
	});
});

describe("formatting", () => {
	it("compacts numbers and pluralises", () => {
		expect(formatCompact(5215084)).toBe("5.2M");
		expect(plural(1, "track")).toBe("1 track");
		expect(plural(14, "track")).toBe("14 tracks");
	});
});

describe("normalizers", () => {
	it("reads GW albums with a year", () => {
		const a = albumProps({ ALB_ID: "302127", ALB_TITLE: "Discovery", ART_NAME: "Daft Punk", ALB_PICTURE: "abc", PHYSICAL_RELEASE_DATE: "2001-03-07" });
		expect(a).toEqual({ id: "302127", title: "Discovery", artist: "Daft Punk", artistId: null, cover: "https://e-cdns-images.dzcdn.net/images/cover/abc/500x500-000000-80-0-0.jpg", year: "2001" });
		expect(albumSubtitle(a)).toBe("Daft Punk · 2001");
	});

	it("reads public-API albums without a year", () => {
		const a = albumProps({ id: 1, title: "X", artist: { name: "Y" }, cover_big: "http://c" });
		expect(a).toMatchObject({ id: "1", artist: "Y", cover: "http://c", year: null });
		expect(albumProps({ id: 1, artist: { id: 27, name: "Daft Punk" } }).artistId).toBe("27");
		expect(albumProps({ ALB_ID: "1", ART_ID: "27" }).artistId).toBe("27");
		expect(albumSubtitle(a)).toBe("Y");
		expect(albumSubtitle(albumProps({ id: 2 }))).toBeUndefined();
	});

	it("reads artists with fans from either shape", () => {
		expect(artistSubtitle(artistProps({ ART_ID: "27", ART_NAME: "Daft Punk", NB_FAN: 5215084, ART_PICTURE: "p" }))).toBe("5.2M fans");
		expect(artistProps({ id: 3, name: "Z", nb_fan: "12", picture_xl: "http://p" })).toEqual({ id: "3", name: "Z", picture: "http://p", fans: 12 });
		expect(artistSubtitle(artistProps({ id: 4, name: "W" }))).toBe("Artist");
	});

	it("reads playlists with a track count or a creator", () => {
		const p = playlistProps({ PLAYLIST_ID: "6", TITLE: "French Touch", NB_SONG: 50, PLAYLIST_PICTURE: "h", PARENT_USERNAME: "Laeti" });
		expect(p.picture).toBe("https://e-cdns-images.dzcdn.net/images/playlist/h/500x500-000000-80-0-0.jpg");
		expect(playlistSubtitle(p)).toBe("50 tracks");
		expect(playlistSubtitle(playlistProps({ id: 7, title: "Q", user: { name: "Ann" } }))).toBe("Ann");
		expect(playlistSubtitle(playlistProps({ id: 8 }))).toBeUndefined();
	});

	it("finds a large track cover", () => {
		expect(trackCover({ ALB_PICTURE: "x" }, 250)).toBe("https://e-cdns-images.dzcdn.net/images/cover/x/250x250-000000-80-0-0.jpg");
		expect(trackCover({ album: { cover_big: "http://b" } })).toBe("http://b");
		expect(trackCover(null)).toBeNull();
	});
});

describe("search/main overview", () => {
	const main = {
		TRACK: { total: 120, data: [{ SNG_ID: "1", SNG_TITLE: "Starboy" }] },
		ALBUM: { count: 59, data: [{ ALB_ID: "302127" }] },
		ARTIST: { data: [{ ART_ID: "27", ART_NAME: "Daft Punk" }] },
	};

	it("reads totals per type", () => {
		expect(mainTotals(main)).toEqual({ track: 120, album: 59, artist: 1, playlist: null });
		expect(mainTotals(null)).toEqual({ track: null, album: null, artist: null, playlist: null });
	});

	it("knows when nothing matched", () => {
		expect(isMainEmpty(main)).toBe(false);
		expect(isMainEmpty({ TRACK: { data: [] } })).toBe(true);
		expect(isMainEmpty(null)).toBe(true);
	});

	it("prefers an exact artist match, then the first track, then the first album", () => {
		expect(pickTopResult(main, " daft PUNK ")?.kind).toBe("artist");
		expect(pickTopResult(main, "daft")?.kind).toBe("track");
		expect(pickTopResult({ ALBUM: main.ALBUM }, "daft")?.kind).toBe("album");
		expect(pickTopResult({}, "daft")).toBeNull();
	});

	it("trusts Deezer’s TOP_RESULT when it is a known kind", () => {
		const top = { SNG_ID: "9", __TYPE__: "track" };
		expect(pickTopResult({ ...main, TOP_RESULT: [top] }, "daft punk")).toEqual({ kind: "track", raw: top });
		expect(pickTopResult({ ...main, TOP_RESULT: [{ __TYPE__: "playlist" }] }, "daft punk")?.kind).toBe("artist");
		expect(pickTopResult({ ...main, TOP_RESULT: [] }, "daft")?.kind).toBe("track");
	});

	it("pages typed results until the total is reached", () => {
		expect(hasMorePages({ data: [1, 2], total: 3 })).toBe(true);
		expect(hasMorePages({ data: [1, 2, 3], total: 3 })).toBe(false);
		expect(hasMorePages({ data: [1] })).toBe(false);
		expect(hasMorePages(null)).toBe(false);
	});
});
