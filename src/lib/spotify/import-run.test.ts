import { describe, it, expect, vi } from "vitest";
import { abortableSleep, runImport, type ImportApi, type ImportEvent } from "./import-run";
import type { MatchResult } from "./match";
import type { SpotifyPlaylistMeta, SpotifyTrackMeta } from "./types";

const ID = (n: number) => String(n).padStart(22, "a");
const sp = (n: number): SpotifyTrackMeta => ({
	spotifyId: ID(n),
	title: `Song ${n}`,
	artists: ["Artist"],
	album: "",
	albumId: null,
	durationMs: 200_000,
	isrc: null,
	coverUrl: null,
});
const hit = (t: SpotifyTrackMeta): MatchResult => ({
	status: "matched",
	strategy: "fuzzy",
	confidence: 0.9,
	deezerTrackId: String(Number(t.spotifyId.replace(/a/g, "")) + 1000),
	title: t.title,
	artist: "Artist",
	album: "",
	albumId: null,
	coverUrl: `https://cdn/${t.spotifyId}.jpg`,
	duration: 200,
});
const miss: MatchResult = { status: "not_found", reason: "nope" };

const playlist = (n: number, extra: Partial<SpotifyPlaylistMeta> = {}): SpotifyPlaylistMeta => ({
	spotifyId: "pl",
	title: "Road trip",
	description: "Summer",
	ownerName: "me",
	coverUrl: "https://cdn/pl.jpg",
	totalTracks: n,
	tracks: Array.from({ length: n }, (_, i) => sp(i + 1)),
	source: "embed",
	limited: false,
	...extra,
});

function fakeApi(over: Partial<ImportApi> = {}): ImportApi & { [K in keyof ImportApi]: ReturnType<typeof vi.fn> } {
	return {
		readPlaylist: vi.fn(async () => playlist(3)),
		readTracks: vi.fn(async (ids: string[]) => ({ tracks: ids.map((id) => ({ ...sp(1), spotifyId: id })), failed: [], rateLimited: [] })),
		match: vi.fn(async (tracks: SpotifyTrackMeta[]) => ({ results: tracks.map(hit) })),
		save: vi.fn(async (body: { title: string }) => ({ playlist: { id: "p1", title: body.title } })),
		...over,
	} as never;
}

const noSleep = vi.fn(async () => {});

describe("runImport", () => {
	it("reads a playlist link, matches it in batches and saves one playlist", async () => {
		const api = fakeApi({ readPlaylist: vi.fn(async () => playlist(120)) });
		const events: ImportEvent[] = [];

		const out = await runImport({ kind: "playlist", url: "https://open.spotify.com/playlist/x" }, { api, onEvent: (e) => events.push(e), sleep: noSleep });

		expect(api.match.mock.calls.map(([t]) => t.length)).toEqual([50, 50, 20]);
		expect(api.save).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Road trip", description: "Summer", coverUrl: "https://cdn/pl.jpg", tracks: expect.any(Array) }),
			expect.anything()
		);
		expect(api.save.mock.calls[0][0].tracks).toHaveLength(120);
		expect(out).toEqual({
			playlist: { id: "p1", title: "Road trip" },
			report: { totalSpotify: 120, processed: 120, matched: 120, notFound: [], truncated: false, limited: false },
		});
		expect(events.filter((e) => e.type === "matching").map((e) => (e as { done: number }).done)).toEqual([0, 50, 100, 120]);
		expect(events.at(-1)).toEqual({ type: "saving" });
	});

	it("imports up to 1000 pasted links and flags the rest as truncated (was: capped at 500)", async () => {
		const api = fakeApi();
		const ids = Array.from({ length: 1200 }, (_, i) => ID(i + 1));

		const out = await runImport({ kind: "links", ids, title: " Mix " }, { api, sleep: noSleep });

		expect(api.readTracks.mock.calls.flatMap(([chunk]) => chunk)).toHaveLength(1000);
		expect(api.match).toHaveBeenCalledTimes(20);
		expect(api.save.mock.calls[0][0].title).toBe("Mix");
		expect(out.report).toMatchObject({ totalSpotify: 1200, processed: 1000, truncated: true });
	});

	it("counts unreadable links as processed misses, listed first", async () => {
		const api = fakeApi({
			readTracks: vi.fn(async () => ({ tracks: [sp(1)], failed: [ID(2)], rateLimited: [] })),
			match: vi.fn(async () => ({ results: [miss] })),
		});

		const out = await runImport({ kind: "links", ids: [ID(1), ID(2)] }, { api, sleep: noSleep });

		expect(out.playlist).toBeNull();
		expect(api.save).not.toHaveBeenCalled();
		expect(out.report.processed).toBe(2);
		expect(out.report.notFound.map((n) => n.spotifyId)).toEqual([ID(2), ID(1)]);
	});

	it("fails when Spotify served none of the pasted links", async () => {
		const api = fakeApi({ readTracks: vi.fn(async (ids: string[]) => ({ tracks: [], failed: ids, rateLimited: [] })) });
		await expect(runImport({ kind: "links", ids: [ID(1)] }, { api, sleep: noSleep })).rejects.toMatchObject({ code: "SPOTIFY_UNREADABLE" });
		expect(api.match).not.toHaveBeenCalled();
	});

	it("retries a failed batch, then reports its tracks as misses instead of losing the import (was: one Deezer hiccup failed the whole import)", async () => {
		const api = fakeApi({
			readPlaylist: vi.fn(async () => playlist(60)),
			match: vi
				.fn()
				.mockRejectedValueOnce(new Error("502"))
				.mockRejectedValueOnce(new Error("502"))
				.mockImplementation(async (tracks: SpotifyTrackMeta[]) => ({ results: tracks.map(hit) })),
		});

		const out = await runImport({ kind: "playlist", url: "x" }, { api, sleep: noSleep, retries: 1 });

		expect(api.match).toHaveBeenCalledTimes(3);
		expect(out.report).toMatchObject({ matched: 10, processed: 60 });
		expect(out.report.notFound).toHaveLength(50);
	});

	it("stops at once on an error no retry can fix", async () => {
		const api = fakeApi({ match: vi.fn(async () => Promise.reject(Object.assign(new Error("no arl"), { code: "NO_DEEZER_ARL" }))) });
		await expect(runImport({ kind: "playlist", url: "x" }, { api, sleep: noSleep })).rejects.toMatchObject({ code: "NO_DEEZER_ARL" });
		expect(api.match).toHaveBeenCalledTimes(1);
	});

	it("aborts between batches and never saves", async () => {
		const ctrl = new AbortController();
		const api = fakeApi({
			readPlaylist: vi.fn(async () => playlist(100)),
			match: vi.fn(async (tracks: SpotifyTrackMeta[]) => {
				ctrl.abort();
				return { results: tracks.map(hit) };
			}),
		});

		await expect(runImport({ kind: "playlist", url: "x" }, { api, signal: ctrl.signal, sleep: noSleep })).rejects.toMatchObject({ name: "AbortError" });
		expect(api.match).toHaveBeenCalledTimes(1);
		expect(api.save).not.toHaveBeenCalled();
	});

	it("reports what each batch resolved, for the live feed", async () => {
		const api = fakeApi({ match: vi.fn(async (tracks: SpotifyTrackMeta[]) => ({ results: [hit(tracks[0]), miss, miss] })) });
		const events: ImportEvent[] = [];

		await runImport({ kind: "playlist", url: "x" }, { api, onEvent: (e) => events.push(e), sleep: noSleep });

		const resolved = events.find((e) => e.type === "resolved");
		expect(resolved).toEqual({
			type: "resolved",
			tracks: [
				expect.objectContaining({ spotifyId: ID(1), matched: true, coverUrl: `https://cdn/${ID(1)}.jpg` }),
				expect.objectContaining({ spotifyId: ID(2), matched: false, coverUrl: null }),
				expect.objectContaining({ spotifyId: ID(3), matched: false }),
			],
		});
	});
});

describe("abortableSleep", () => {
	it("rejects with an AbortError when aborted mid-wait", async () => {
		const ctrl = new AbortController();
		const p = abortableSleep(10_000, ctrl.signal);
		ctrl.abort();
		await expect(p).rejects.toMatchObject({ name: "AbortError" });
	});
});
