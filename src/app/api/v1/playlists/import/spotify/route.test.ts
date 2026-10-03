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
});
