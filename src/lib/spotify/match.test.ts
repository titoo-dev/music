import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchTrack } from "./match";
import type { SpotifyTrackMeta } from "./types";
import type { Deezer } from "@/lib/deezer/deezer";

const hit = { id: 42, title: "Dreams", duration: 257, artist: { name: "Fleetwood Mac" }, album: { title: "Rumours", cover_medium: "c" } };

const api = {
	getTrackByISRC: vi.fn(),
	advanced_search: vi.fn(),
	search_track: vi.fn(),
};
const dz = { api } as unknown as Deezer;

// What a pasted track link / playlist embed gives: no ISRC, no album.
const fromEmbed: SpotifyTrackMeta = {
	spotifyId: "x",
	title: "Dreams - 2004 Remaster",
	artists: ["Fleetwood Mac"],
	album: "",
	albumId: null,
	durationMs: 257_000,
	isrc: null,
	coverUrl: null,
};

describe("matchTrack", () => {
	beforeEach(() => {
		api.getTrackByISRC.mockReset();
		api.advanced_search.mockReset().mockResolvedValue({ data: [] });
		api.search_track.mockReset().mockResolvedValue({ data: [] });
	});

	it("tries free-text search before the artist-filtered search (was: 3 Deezer calls per track, Deezer's artist: filter returns nothing)", async () => {
		api.search_track.mockResolvedValue({ data: [hit] });

		const res = await matchTrack(dz, fromEmbed);

		expect(res).toMatchObject({ status: "matched", strategy: "fuzzy", deezerTrackId: "42" });
		expect(api.search_track).toHaveBeenCalledWith("Dreams Fleetwood Mac", { limit: 10 });
		expect(api.advanced_search).not.toHaveBeenCalled();
		expect(api.getTrackByISRC).not.toHaveBeenCalled();
	});

	it("falls back to the artist-filtered search when free text misses", async () => {
		api.advanced_search.mockResolvedValue({ data: [hit] });

		const res = await matchTrack(dz, fromEmbed);

		expect(res).toMatchObject({ status: "matched", strategy: "advanced-clean" });
		expect(api.advanced_search).toHaveBeenCalledWith({ artist: "Fleetwood Mac", track: "Dreams" }, { limit: 10 });
	});

	it("uses the ISRC first when there is one", async () => {
		api.getTrackByISRC.mockResolvedValue({ id: 7, title: "Dreams", duration: 257, artist: { name: "Fleetwood Mac" }, album: { id: 1, title: "Rumours", cover_medium: "c" } });

		const res = await matchTrack(dz, { ...fromEmbed, isrc: "USWB10400049" });

		expect(res).toMatchObject({ strategy: "isrc", deezerTrackId: "7" });
		expect(api.search_track).not.toHaveBeenCalled();
	});

	it("rejects a weak candidate instead of importing the wrong track", async () => {
		api.search_track.mockResolvedValue({ data: [{ ...hit, title: "Solar Eclipse", artist: { name: "Dream, Ivory" } }] });

		const res = await matchTrack(dz, fromEmbed);
		expect(res.status).toBe("not_found");
	});
});
