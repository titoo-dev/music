// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/library", () => ({ unsaveAlbum: vi.fn() }));
vi.mock("@/lib/repositories/albums", () => ({
	getSavedAlbumWithTracks: vi.fn(),
	getSavedAlbumDeezerId: vi.fn(),
}));

import { GET, DELETE } from "./route";
import { unsaveAlbum } from "@/lib/library";
import {
	getSavedAlbumWithTracks,
	getSavedAlbumDeezerId,
} from "@/lib/repositories/albums";

const unsaveAlbumMock = vi.mocked(unsaveAlbum);
const withTracksMock = vi.mocked(getSavedAlbumWithTracks);
const deezerIdMock = vi.mocked(getSavedAlbumDeezerId);

beforeEach(() => {
	clearSession();
	unsaveAlbumMock.mockReset();
	withTracksMock.mockReset();
	deezerIdMock.mockReset();
});

describe("GET /api/v1/library/albums/[albumId]", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await GET(makeNextRequest(), makeParams({ albumId: "alb-1" }));
		expect(res.status).toBe(401);
	});

	it("returns 404 when the album doesn't belong to the user", async () => {
		setSessionUser("u1");
		withTracksMock.mockResolvedValue(null as never);
		const res = await GET(makeNextRequest(), makeParams({ albumId: "alb-1" }));
		expect(res.status).toBe(404);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_FOUND");
	});

	it("returns the album with tracks", async () => {
		setSessionUser("u1");
		const album = { id: "alb-1", userId: "u1", tracks: [{ trackId: "t1", trackNumber: 1 }] };
		withTracksMock.mockResolvedValue(album as never);
		const res = await GET(makeNextRequest(), makeParams({ albumId: "alb-1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: unknown }>(res);
		expect(body?.data).toEqual(album);
		expect(withTracksMock).toHaveBeenCalledWith("alb-1", "u1");
	});
});

describe("DELETE /api/v1/library/albums/[albumId]", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await DELETE(makeNextRequest({ method: "DELETE" }), makeParams({ albumId: "alb-1" }));
		expect(res.status).toBe(401);
	});

	it("returns 404 when the album is not in the library", async () => {
		setSessionUser("u1");
		deezerIdMock.mockResolvedValue(null as never);
		const res = await DELETE(makeNextRequest({ method: "DELETE" }), makeParams({ albumId: "alb-1" }));
		expect(res.status).toBe(404);
		expect(unsaveAlbumMock).not.toHaveBeenCalled();
	});

	it("calls unsaveAlbum with the looked-up deezerAlbumId", async () => {
		setSessionUser("u1");
		deezerIdMock.mockResolvedValue({ deezerAlbumId: "dz-99" } as never);
		unsaveAlbumMock.mockResolvedValue(undefined as never);
		const res = await DELETE(makeNextRequest({ method: "DELETE" }), makeParams({ albumId: "alb-1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { unsaved: boolean } }>(res);
		expect(body?.data.unsaved).toBe(true);
		expect(deezerIdMock).toHaveBeenCalledWith("alb-1", "u1");
		expect(unsaveAlbumMock).toHaveBeenCalledWith("u1", "dz-99");
	});

	it("returns 500 when unsaveAlbum throws", async () => {
		setSessionUser("u1");
		deezerIdMock.mockResolvedValue({ deezerAlbumId: "dz-99" } as never);
		unsaveAlbumMock.mockRejectedValue(new Error("boom"));
		const res = await DELETE(makeNextRequest({ method: "DELETE" }), makeParams({ albumId: "alb-1" }));
		expect(res.status).toBe(500);
	});
});
