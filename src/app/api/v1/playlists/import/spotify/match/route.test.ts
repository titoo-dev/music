import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { prismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../../../../_lib/helpers", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../../../_lib/helpers")>();
	return { ...actual, requireDeezer: vi.fn() };
});

import { POST } from "./route";
import { requireDeezer } from "../../../../_lib/helpers";

const requireDeezerMock = vi.mocked(requireDeezer);
const ID = (n: number) => String(n).padStart(22, "a");
const track = (n: number, extra = {}) => ({ spotifyId: ID(n), title: n === 1 ? "Patient Zero" : `Song ${n}`, artists: ["Taylor Swift"], durationMs: 225_868, ...extra });

const dz = {
	api: {
		getTrackByISRC: vi.fn(async () => ({ id: 7, title: "Patient Zero", duration: 226, artist: { name: "Taylor Swift" }, album: { id: 3, title: "Album", cover_medium: "https://c" } })),
		advanced_search: vi.fn(async () => ({ data: [] })),
		search_track: vi.fn(async (q: string) => ({
			data: q.startsWith("Patient Zero") ? [{ id: 42, title: "Patient Zero", duration: 226, artist: { name: "Taylor Swift" }, album: { title: "Album" } }] : [],
		})),
	},
};

type Body = { data: { results: Array<{ status: string; deezerTrackId?: string; strategy?: string }> }; error?: { code: string } };

describe("POST /api/v1/playlists/import/spotify/match", () => {
	beforeEach(() => {
		Object.values(dz.api).forEach((f) => f.mockClear());
		requireDeezerMock.mockResolvedValue({ userId: "u1", dz: dz as never, error: null });
	});

	it("returns one result per track, in order", async () => {
		const res = await POST(makeNextRequest({ method: "POST", body: { tracks: [track(2), track(1)] } }));
		const body = await readJson<Body>(res);

		expect(res.status).toBe(200);
		expect(body?.data.results.map((r) => r.status)).toEqual(["not_found", "matched"]);
		expect(body?.data.results[1].deezerTrackId).toBe("42");
	});

	it("uses the ISRC of playlist-link tracks (exact match first)", async () => {
		const res = await POST(makeNextRequest({ method: "POST", body: { tracks: [track(1, { isrc: "USUM71703861", album: "Album" })] } }));
		const body = await readJson<Body>(res);

		expect(dz.api.getTrackByISRC).toHaveBeenCalledWith("USUM71703861");
		expect(body?.data.results[0]).toMatchObject({ strategy: "isrc", deezerTrackId: "7" });
	});

	it("rejects more than 50 tracks per call", async () => {
		const tracks = Array.from({ length: 51 }, (_, i) => track(i + 2));
		const res = await POST(makeNextRequest({ method: "POST", body: { tracks } }));
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe("TOO_MANY_TRACKS");
		expect(dz.api.search_track).not.toHaveBeenCalled();
	});

	it.each([
		["no tracks", {}],
		["an empty list", { tracks: [] }],
		["a malformed track", { tracks: [{ spotifyId: "x" }] }],
	])("returns 400 INVALID_TRACKS for %s", async (_, payload) => {
		const res = await POST(makeNextRequest({ method: "POST", body: payload }));
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe("INVALID_TRACKS");
	});

	it("passes the auth / Deezer guard's error through", async () => {
		requireDeezerMock.mockResolvedValue({ userId: null, dz: null, error: new Response(null, { status: 401 }) } as never);
		const res = await POST(makeNextRequest({ method: "POST", body: { tracks: [track(1)] } }));
		expect(res.status).toBe(401);
	});
});
