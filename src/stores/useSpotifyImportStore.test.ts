import { describe, it, expect, vi, beforeEach } from "vitest";

const api = vi.hoisted(() => ({
	readPlaylist: vi.fn(),
	readTracks: vi.fn(),
	match: vi.fn(),
	save: vi.fn(),
}));
vi.mock("@/lib/spotify/import-api", () => ({ importApi: api }));

import { detectInput, friendlyImportError, useSpotifyImportStore } from "./useSpotifyImportStore";

const PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
const ID = "11hcBLPtbMp4aQI6zGQLub";
const track = { spotifyId: ID, title: "Patient Zero", artists: ["Taylor Swift"], album: "", albumId: null, durationMs: 1, isrc: null, coverUrl: null };
const matched = { status: "matched", strategy: "fuzzy", confidence: 1, deezerTrackId: "42", title: "Patient Zero", artist: "Taylor Swift", album: "", albumId: null, coverUrl: "https://cdn/c.jpg", duration: 1 };

const store = () => useSpotifyImportStore.getState();

describe("useSpotifyImportStore", () => {
	beforeEach(() => {
		Object.values(api).forEach((f) => f.mockReset());
		store().reset();
		useSpotifyImportStore.setState({ open: false, lastImportedId: null });
		api.readPlaylist.mockResolvedValue({ spotifyId: "pl", title: "Hits", description: "", ownerName: "Spotify", coverUrl: null, totalTracks: 1, tracks: [track], source: "embed", limited: false });
		api.match.mockResolvedValue({ results: [matched] });
		api.save.mockResolvedValue({ playlist: { id: "p1", title: "Hits" } });
	});

	it("runs a playlist link to the report and remembers the new playlist", async () => {
		store().setInput(PLAYLIST_URL);
		await store().start();

		expect(store()).toMatchObject({
			phase: "done",
			subject: { title: "Hits", total: 1 },
			matched: 1,
			missed: 0,
			covers: ["https://cdn/c.jpg"],
			lastImportedId: "p1",
			result: { playlist: { id: "p1" }, report: { matched: 1, processed: 1 } },
		});
		expect(store().feed[0]).toMatchObject({ spotifyId: ID, matched: true });
	});

	it("keeps running when the dialog closes mid-import (was: closing was blocked while matching)", async () => {
		let release!: (v: unknown) => void;
		api.match.mockReturnValue(new Promise((r) => (release = r)));
		store().openDialog();
		store().setInput(PLAYLIST_URL);
		const run = store().start();
		await vi.waitFor(() => expect(store().phase).toBe("matching"));

		store().closeDialog();
		expect(store()).toMatchObject({ open: false, phase: "matching" });

		release({ results: [matched] });
		await run;
		expect(store().phase).toBe("done");
	});

	it("cancel goes back to the form, keeps the input and ignores the aborted run", async () => {
		let release!: (v: unknown) => void;
		api.match.mockReturnValue(new Promise((r) => (release = r)));
		store().setInput(PLAYLIST_URL);
		const run = store().start();
		await vi.waitFor(() => expect(store().phase).toBe("matching"));

		store().cancel();
		release({ results: [matched] });
		await run;

		expect(store()).toMatchObject({ phase: "idle", input: PLAYLIST_URL, result: null, lastImportedId: null });
		expect(api.save).not.toHaveBeenCalled();
	});

	it("shows a friendly error and lets the user retry with the same input", async () => {
		api.readPlaylist.mockRejectedValue(Object.assign(new Error("404"), { code: "SPOTIFY_NOT_FOUND" }));
		store().setInput(PLAYLIST_URL);
		await store().start();

		expect(store()).toMatchObject({ phase: "error", error: expect.stringContaining("Playlist not found") });
		store().retry();
		expect(store()).toMatchObject({ phase: "idle", error: null, input: PLAYLIST_URL });
	});

	it("rejects text that is no Spotify link without calling the server", async () => {
		store().setInput("hello");
		await store().start();
		expect(store()).toMatchObject({ phase: "idle", error: expect.stringContaining("doesn't look like") });
		expect(api.readPlaylist).not.toHaveBeenCalled();

		store().setInput("hello!");
		expect(store().error).toBeNull();
	});

	it("names a pasted-links playlist from the title field", async () => {
		api.readTracks.mockResolvedValue({ tracks: [track], failed: [], rateLimited: [] });
		store().setInput(`https://open.spotify.com/track/${ID}`);
		store().setTitle("Road trip");
		await store().start();

		expect(api.save).toHaveBeenCalledWith(expect.objectContaining({ title: "Road trip" }), expect.anything());
	});

	it("closing a finished import starts over next time", async () => {
		vi.useFakeTimers();
		try {
			store().setInput(PLAYLIST_URL);
			await store().start();
			store().closeDialog();
			vi.advanceTimersByTime(300);
			expect(store()).toMatchObject({ phase: "idle", input: "", result: null, lastImportedId: "p1" });
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("detectInput", () => {
	it.each([
		["", null],
		["   ", null],
		["hello", null],
		[PLAYLIST_URL, { kind: "playlist" }],
		[`https://open.spotify.com/track/${ID}\nhttps://open.spotify.com/track/4EoJ151oQ5jY48z4RhSE96`, { kind: "links", count: 2 }],
	])("%j → %j", (text, expected) => {
		expect(detectInput(text)).toEqual(expected);
	});
});

it("friendlyImportError maps known codes and falls back to the message", () => {
	expect(friendlyImportError({ code: "NO_DEEZER_ARL" })).toMatch(/Connect your Deezer/);
	expect(friendlyImportError(new Error("boom"))).toBe("boom");
	expect(friendlyImportError(null)).toBe("Import failed");
});
