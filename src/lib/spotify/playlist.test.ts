import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./client", async (importOriginal) => {
	const actual = await importOriginal<typeof import("./client")>();
	return { ...actual, spotifyGet: vi.fn() };
});

import { fetchPlaylist } from "./playlist";
import { spotifyGet, SpotifyAPIError, SpotifyConfigError } from "./client";
import { embedHtml } from "./embed.fixture";

const spotifyGetMock = vi.mocked(spotifyGet);
const fetchMock = vi.fn();

const ID = "37i9dQZF1DXcBWIGoYBM5M";

const apiTrack = (id: string, name: string) => ({
	id,
	name,
	duration_ms: 200_000,
	type: "track",
	external_ids: { isrc: "usabc1234567" },
	artists: [{ id: "a", name: "Artist" }],
	album: { id: "al", name: "Album", images: [] },
});

describe("fetchPlaylist", () => {
	beforeEach(() => {
		spotifyGetMock.mockReset();
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
		fetchMock.mockResolvedValue(
			new Response(embedHtml({ tracks: [{ title: "Song", subtitle: "A, B", duration: 180_000 }] }), { status: 200 })
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("falls back to the public embed when Spotify credentials are missing (was: 503 SPOTIFY_NOT_CONFIGURED)", async () => {
		spotifyGetMock.mockRejectedValue(new SpotifyConfigError("missing"));

		const pl = await fetchPlaylist(ID);

		expect(pl.source).toBe("embed");
		expect(pl.title).toBe("Today’s Top Hits");
		expect(pl.tracks).toHaveLength(1);
		expect(pl.tracks[0]).toMatchObject({ title: "Song", artists: ["A", "B"], durationMs: 180_000, isrc: null });
		expect(fetchMock).toHaveBeenCalledWith(`https://open.spotify.com/embed/playlist/${ID}`, expect.anything());
	});

	it("falls back to the embed when the API only returns metadata (was: dev-mode apps get no playlist items since Feb 2026)", async () => {
		spotifyGetMock.mockResolvedValue({
			id: ID,
			name: "Today’s Top Hits",
			description: "",
			images: [],
			owner: { id: "spotify", display_name: "Spotify" },
		});

		const pl = await fetchPlaylist(ID);

		expect(pl.source).toBe("embed");
		expect(pl.tracks).toHaveLength(1);
	});

	it("falls back to the embed on 403 (was: SPOTIFY_FORBIDDEN for dev-mode apps)", async () => {
		spotifyGetMock.mockRejectedValue(new SpotifyAPIError("Forbidden", 403));

		const pl = await fetchPlaylist(ID);
		expect(pl.source).toBe("embed");
	});

	it("does not mask a 404 from the API with the embed", async () => {
		spotifyGetMock.mockRejectedValue(new SpotifyAPIError("Not found", 404));

		await expect(fetchPlaylist(ID)).rejects.toMatchObject({ status: 404 });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("reads the Feb-2026 `items.items[].item` shape and follows `next` (was: `tracks` field no longer returned)", async () => {
		spotifyGetMock
			.mockResolvedValueOnce({
				id: ID,
				name: "Mine",
				description: "desc",
				images: [{ url: "big" }, { url: "mid" }],
				owner: { id: "me", display_name: "Me" },
				items: {
					items: [{ item: apiTrack("t1", "One") }, { item: null }],
					next: `https://api.spotify.com/v1/playlists/${ID}/items?offset=100&limit=100`,
					total: 2,
				},
			})
			.mockResolvedValueOnce({ items: [{ item: apiTrack("t2", "Two") }], next: null, total: 2 });

		const pl = await fetchPlaylist(ID);

		expect(pl.source).toBe("api");
		expect(pl.coverUrl).toBe("mid");
		expect(pl.tracks.map((t) => t.title)).toEqual(["One", "Two"]);
		expect(pl.tracks[0].isrc).toBe("USABC1234567");
		expect(spotifyGetMock).toHaveBeenLastCalledWith(`playlists/${ID}/items?offset=100&limit=100`);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("still reads the legacy `tracks.items[].track` shape", async () => {
		spotifyGetMock.mockResolvedValueOnce({
			id: ID,
			name: "Legacy",
			description: null,
			images: [],
			owner: { id: "me" },
			tracks: { items: [{ track: apiTrack("t1", "One") }], next: null, total: 1 },
		});

		const pl = await fetchPlaylist(ID);
		expect(pl.source).toBe("api");
		expect(pl.ownerName).toBe("me");
		expect(pl.tracks).toHaveLength(1);
	});

	it("maps an embed 404 to SpotifyAPIError(404)", async () => {
		spotifyGetMock.mockRejectedValue(new SpotifyConfigError("missing"));
		fetchMock.mockResolvedValue(new Response("nope", { status: 404 }));

		await expect(fetchPlaylist(ID)).rejects.toMatchObject({ status: 404, code: "SPOTIFY_API_ERROR" });
	});
});
