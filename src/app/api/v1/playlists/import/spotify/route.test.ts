import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { embedHtml } from "@/lib/spotify/embed.fixture";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/library", () => ({ addToPlaylist: vi.fn() }));
vi.mock("../../../_lib/helpers", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../../_lib/helpers")>();
	return { ...actual, requireDeezer: vi.fn() };
});

import { POST } from "./route";
import { addToPlaylist } from "@/lib/library";
import { requireDeezer } from "../../../_lib/helpers";

const requireDeezerMock = vi.mocked(requireDeezer);
const addToPlaylistMock = vi.mocked(addToPlaylist);
const fetchMock = vi.fn();

const URL_IN = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc";

// Deezer stub: no ISRC on embed tracks, so the matcher goes straight to search.
const dz = {
	api: {
		getTrackByISRC: vi.fn(),
		advanced_search: vi.fn(async (filters: { track?: string }) => ({
			data:
				filters.track === "Patient Zero"
					? [{ id: 42, title: "Patient Zero", duration: 226, artist: { name: "Taylor Swift" }, album: { title: "Album", cover_medium: "c" } }]
					: [],
		})),
		search_track: vi.fn(async () => ({ data: [] })),
	},
};

type Body = {
	data: {
		playlist: { id: string } | null;
		report: { matched: number; processed: number; limited: boolean; notFound: Array<{ title: string }> };
	};
	error?: { code: string };
};

describe("POST /api/v1/playlists/import/spotify", () => {
	beforeEach(() => {
		resetPrismaMock();
		addToPlaylistMock.mockReset();
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
		delete process.env.SPOTIFY_CLIENT_ID;
		delete process.env.SPOTIFY_CLIENT_SECRET;
		Object.values(dz.api).forEach((f) => f.mockClear());
		requireDeezerMock.mockResolvedValue({ userId: "u1", dz: dz as never, error: null });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("imports a public playlist without Spotify API credentials (was: 503 SPOTIFY_NOT_CONFIGURED)", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				embedHtml({
					tracks: [
						{ title: "Patient Zero", subtitle: "Taylor Swift", duration: 225_868 },
						{ title: "Nowhere", subtitle: "Nobody", duration: 100_000 },
					],
				}),
				{ status: 200 }
			)
		);
		prismaMock.playlist.create.mockResolvedValue({ id: "pl1", title: "Today’s Top Hits" } as never);

		const res = await POST(makeNextRequest({ method: "POST", body: { url: URL_IN } }));
		const body = await readJson<Body>(res);

		expect(res.status).toBe(200);
		expect(body?.data.playlist?.id).toBe("pl1");
		expect(body?.data.report).toMatchObject({ matched: 1, processed: 2, limited: false });
		expect(body?.data.report.notFound.map((n) => n.title)).toEqual(["Nowhere"]);
		expect(addToPlaylistMock).toHaveBeenCalledWith("pl1", [
			expect.objectContaining({ trackId: "42", title: "Patient Zero", artist: "Taylor Swift" }),
		]);
	});

	it("returns 404 SPOTIFY_NOT_FOUND when the embed has no such playlist", async () => {
		fetchMock.mockResolvedValue(new Response("", { status: 404 }));

		const res = await POST(makeNextRequest({ method: "POST", body: { url: URL_IN } }));
		const body = await readJson<Body>(res);

		expect(res.status).toBe(404);
		expect(body?.error?.code).toBe("SPOTIFY_NOT_FOUND");
		expect(prismaMock.playlist.create).not.toHaveBeenCalled();
	});

	it("rejects a non-playlist URL", async () => {
		const res = await POST(makeNextRequest({ method: "POST", body: { url: "https://example.com" } }));
		expect(res.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	describe("tracks read from pasted links (Spotify desktop Ctrl+A / Ctrl+C)", () => {
		const PZ = "11hcBLPtbMp4aQI6zGQLub";
		const NOWHERE = "4EoJ151oQ5jY48z4RhSE96";
		const GONE = "0000000000000000000000";
		const track = (spotifyId: string, title: string, artists: string[], durationMs: number) => ({ spotifyId, title, artists, durationMs });
		const tracks = [track(PZ, "Patient Zero", ["Taylor Swift"], 225_868), track(NOWHERE, "Nowhere", ["Nobody"], 1000)];

		beforeEach(() => {
			prismaMock.playlist.create.mockResolvedValue({ id: "pl2", title: "Road trip" } as never);
		});

		it("matches the tracks and names the playlist (was: link imports capped at the embed's 100 tracks)", async () => {
			const res = await POST(makeNextRequest({ method: "POST", body: { tracks, unreadable: [GONE], total: 3, title: "  Road trip " } }));
			const body = await readJson<Body>(res);

			expect(res.status).toBe(200);
			expect(body?.data.report).toMatchObject({ matched: 1, processed: 3, limited: false, truncated: false });
			expect(body?.data.report.notFound.map((n) => n.title)).toEqual([`spotify:track:${GONE}`, "Nowhere"]);
			expect(prismaMock.playlist.create).toHaveBeenCalledWith({
				data: expect.objectContaining({ userId: "u1", title: "Road trip", coverUrl: "c" }),
			});
			expect(addToPlaylistMock).toHaveBeenCalledWith("pl2", [expect.objectContaining({ trackId: "42" })]);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("names the playlist \"Spotify import\" when no title is given", async () => {
			await POST(makeNextRequest({ method: "POST", body: { tracks } }));
			expect(prismaMock.playlist.create).toHaveBeenCalledWith({
				data: expect.objectContaining({ title: "Spotify import" }),
			});
		});

		it.each([
			["an empty list", []],
			["a bad track id", [track("nope", "x", ["a"], 1)]],
			["a missing title", [{ spotifyId: PZ, artists: ["a"], durationMs: 1 }]],
			["non-string artists", [{ spotifyId: PZ, title: "x", artists: [1], durationMs: 1 }]],
		])("returns 400 INVALID_TRACKS for %s", async (_, bad) => {
			const res = await POST(makeNextRequest({ method: "POST", body: { tracks: bad } }));
			expect(res.status).toBe(400);
			expect((await readJson<Body>(res))?.error?.code).toBe("INVALID_TRACKS");
			expect(prismaMock.playlist.create).not.toHaveBeenCalled();
		});

		it("keeps only the matcher fields from the client", async () => {
			await POST(makeNextRequest({ method: "POST", body: { tracks: [{ ...tracks[0], isrc: "FAKE", album: "x".repeat(10_000) }] } }));
			const targets = dz.api.advanced_search.mock.calls.length + dz.api.search_track.mock.calls.length;
			expect(targets).toBeGreaterThan(0);
			expect(dz.api.getTrackByISRC).not.toHaveBeenCalled();
		});

		it("imports up to 1000 links (was: capped at 500)", async () => {
			const many = Array.from({ length: 1000 }, (_, i) => track(String(i).padStart(22, "x"), "Patient Zero", ["Taylor Swift"], 225_868));

			const res = await POST(makeNextRequest({ method: "POST", body: { tracks: many, total: 1000 } }));
			const body = await readJson<Body & { data: { report: { truncated: boolean; totalSpotify: number } } }>(res);

			expect(body?.data.report).toMatchObject({ truncated: false, totalSpotify: 1000, processed: 1000 });
		});

		it("flags a paste above 1000 links as truncated", async () => {
			const many = Array.from({ length: 1001 }, (_, i) => track(String(i).padStart(22, "x"), "Patient Zero", ["Taylor Swift"], 225_868));

			const res = await POST(makeNextRequest({ method: "POST", body: { tracks: many, total: 1200 } }));
			const body = await readJson<Body & { data: { report: { truncated: boolean; totalSpotify: number } } }>(res);

			expect(body?.data.report).toMatchObject({ truncated: true, totalSpotify: 1200, processed: 1000 });
		});
	});
});
