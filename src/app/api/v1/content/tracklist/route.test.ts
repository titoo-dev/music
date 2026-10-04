import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/helpers/mockPrisma";
import { authMock } from "@/test/helpers/mockAuth";
import { makeNextRequest } from "@/test/helpers/nextRequest";
import { DeezerNetworkError, GWAPIError } from "@/lib/deezer/errors";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { dzMock } = vi.hoisted(() => ({
	dzMock: {
		gw: {
			get_album_page: vi.fn(),
			get_album_tracks: vi.fn(),
			get_playlist_page: vi.fn(),
			get_playlist_tracks: vi.fn(),
			get_artist_page: vi.fn(),
			get_artist_top_tracks: vi.fn(),
			get_artist_discography_tabs: vi.fn(),
		},
	},
}));

vi.mock("../../_lib/helpers", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../_lib/helpers")>()),
	getGuestOrUserDz: vi.fn(async () => ({ dz: dzMock, userId: "u1" })),
}));

import { GET } from "./route";

const req = (query: string) => makeNextRequest({ url: `http://localhost:3000/api/v1/content/tracklist?${query}` });

describe("GET /api/v1/content/tracklist", () => {
	beforeEach(() => {
		for (const fn of Object.values(dzMock.gw)) fn.mockReset();
	});

	it("returns an album with its tracks", async () => {
		dzMock.gw.get_album_page.mockResolvedValue({ DATA: { ALB_ID: "302127" } });
		dzMock.gw.get_album_tracks.mockResolvedValue([{ SNG_ID: "3135553" }]);
		const res = await GET(req("id=302127&type=album"));
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.tracks).toHaveLength(1);
	});

	it("rejects a non-numeric Deezer id with 400 (was: parsed as 0 → Deezer PERMISSION_ERROR → 500)", async () => {
		const res = await GET(req("id=cmutygpqr000ja4whepfcgw7s&type=playlist"));
		expect(res.status).toBe(400);
		expect((await res.json()).error.code).toBe("INVALID_ID");
		expect(dzMock.gw.get_playlist_page).not.toHaveBeenCalled();
	});

	it("answers 404 when Deezer refuses or doesn't know the id (was: 500 INTERNAL_ERROR)", async () => {
		dzMock.gw.get_playlist_page.mockRejectedValue(
			new GWAPIError('{"PERMISSION_ERROR":"4887612382 is not allowed to access 123"}')
		);
		const res = await GET(req("id=123&type=playlist"));
		expect(res.status).toBe(404);
		expect((await res.json()).error.code).toBe("NOT_FOUND");
	});

	it("answers 502 when Deezer is unreachable", async () => {
		dzMock.gw.get_album_page.mockRejectedValue(new DeezerNetworkError("gw-light deezer.pageAlbum: timeout"));
		const res = await GET(req("id=302127&type=album"));
		expect(res.status).toBe(502);
		expect((await res.json()).error.code).toBe("UPSTREAM_ERROR");
	});

	it("keeps 400 for missing params and invalid type", async () => {
		expect((await GET(req("type=album"))).status).toBe(400);
		expect((await GET(req("id=1&type=track"))).status).toBe(400);
	});
});
