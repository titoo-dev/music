import { describe, it, expect, vi, beforeEach } from "vitest";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/library", () => ({ addToPlaylist: vi.fn() }));

import { POST } from "./route";
import { addToPlaylist } from "@/lib/library";

const addToPlaylistMock = vi.mocked(addToPlaylist);
const row = (id: string, cover: string | null = "https://cdn/c.jpg") => ({ trackId: id, title: `T${id}`, artist: "A", album: "Al", albumId: null, coverUrl: cover, duration: 200 });

type Body = { data: { playlist: { id: string } }; error?: { code: string } };

describe("POST /api/v1/playlists/import/spotify/save", () => {
	beforeEach(() => {
		clearSession();
		resetPrismaMock();
		addToPlaylistMock.mockReset();
		prismaMock.playlist.create.mockResolvedValue({ id: "pl1", title: "Road trip" } as never);
	});

	it("returns 401 when not authenticated", async () => {
		const res = await POST(makeNextRequest({ method: "POST", body: { tracks: [row("1")] } }));
		expect(res.status).toBe(401);
		expect(prismaMock.playlist.create).not.toHaveBeenCalled();
	});

	it("creates the playlist with the matched tracks, de-duplicated", async () => {
		setSessionUser("u1");
		const res = await POST(makeNextRequest({ method: "POST", body: { title: "  Road trip ", description: "Summer", tracks: [row("1", null), row("2"), row("1")] } }));

		expect(res.status).toBe(200);
		expect((await readJson<Body>(res))?.data.playlist.id).toBe("pl1");
		expect(prismaMock.playlist.create).toHaveBeenCalledWith({
			data: { userId: "u1", title: "Road trip", description: "Summer", coverUrl: null },
		});
		expect(addToPlaylistMock.mock.calls[0][1].map((r) => r.trackId)).toEqual(["1", "2"]);
	});

	it("uses the Spotify cover, else the first track's, and a default name", async () => {
		setSessionUser("u1");
		await POST(makeNextRequest({ method: "POST", body: { coverUrl: "https://spotify/pl.jpg", tracks: [row("1")] } }));
		expect(prismaMock.playlist.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ title: "Spotify import", coverUrl: "https://spotify/pl.jpg" }) });

		await POST(makeNextRequest({ method: "POST", body: { coverUrl: "http://insecure", tracks: [row("1")] } }));
		expect(prismaMock.playlist.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ coverUrl: "https://cdn/c.jpg" }) });
	});

	it("accepts 1000 tracks and refuses 1001", async () => {
		setSessionUser("u1");
		const many = (n: number) => Array.from({ length: n }, (_, i) => row(String(i + 1)));

		expect((await POST(makeNextRequest({ method: "POST", body: { tracks: many(1000) } }))).status).toBe(200);
		const res = await POST(makeNextRequest({ method: "POST", body: { tracks: many(1001) } }));
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe("TOO_MANY_TRACKS");
	});

	it.each([
		["no tracks", {}],
		["an empty list", { tracks: [] }],
		["a malformed row", { tracks: [{ trackId: "abc", title: "x", artist: "y" }] }],
	])("returns 400 INVALID_TRACKS for %s", async (_, payload) => {
		setSessionUser("u1");
		const res = await POST(makeNextRequest({ method: "POST", body: payload }));
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe("INVALID_TRACKS");
		expect(prismaMock.playlist.create).not.toHaveBeenCalled();
	});
});
