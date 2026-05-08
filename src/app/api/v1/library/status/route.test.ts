import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/library", () => ({
	getSavedTrackIds: vi.fn(),
	getSavedAlbumIds: vi.fn(),
}));

import { POST } from "./route";
import { getSavedTrackIds, getSavedAlbumIds } from "@/lib/library";

const getSavedTrackIdsMock = vi.mocked(getSavedTrackIds);
const getSavedAlbumIdsMock = vi.mocked(getSavedAlbumIds);

beforeEach(() => {
	resetPrismaMock();
	clearSession();
	getSavedTrackIdsMock.mockReset();
	getSavedAlbumIdsMock.mockReset();
});

describe("POST /api/v1/library/status", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await POST(
			makeNextRequest({
				method: "POST",
				body: { trackIds: ["t1"], albumIds: ["a1"] },
			})
		);
		expect(res.status).toBe(401);
	});

	it("returns saved track + album IDs as arrays", async () => {
		setSessionUser("u1");
		getSavedTrackIdsMock.mockResolvedValue(new Set(["t1", "t3"]));
		getSavedAlbumIdsMock.mockResolvedValue(new Set(["a2"]));

		const res = await POST(
			makeNextRequest({
				method: "POST",
				body: {
					trackIds: ["t1", "t2", "t3"],
					albumIds: ["a1", "a2"],
				},
			})
		);
		expect(res.status).toBe(200);
		const body = await readJson<{
			data: { tracks: string[]; albums: string[] };
		}>(res);
		expect(body?.data.tracks.sort()).toEqual(["t1", "t3"]);
		expect(body?.data.albums).toEqual(["a2"]);

		expect(getSavedTrackIdsMock).toHaveBeenCalledWith("u1", [
			"t1",
			"t2",
			"t3",
		]);
		expect(getSavedAlbumIdsMock).toHaveBeenCalledWith("u1", ["a1", "a2"]);
	});

	it("treats missing arrays as empty arrays (returns empty results)", async () => {
		setSessionUser("u1");
		getSavedTrackIdsMock.mockResolvedValue(new Set());
		getSavedAlbumIdsMock.mockResolvedValue(new Set());

		const res = await POST(
			makeNextRequest({ method: "POST", body: {} })
		);
		expect(res.status).toBe(200);
		const body = await readJson<{
			data: { tracks: string[]; albums: string[] };
		}>(res);
		expect(body?.data.tracks).toEqual([]);
		expect(body?.data.albums).toEqual([]);

		expect(getSavedTrackIdsMock).toHaveBeenCalledWith("u1", []);
		expect(getSavedAlbumIdsMock).toHaveBeenCalledWith("u1", []);
	});

	it("treats non-array trackIds/albumIds as empty (no validation error)", async () => {
		// TODO: route currently silently coerces invalid shapes to []
		// instead of returning 400 INVALID_BODY.
		setSessionUser("u1");
		getSavedTrackIdsMock.mockResolvedValue(new Set());
		getSavedAlbumIdsMock.mockResolvedValue(new Set());

		const res = await POST(
			makeNextRequest({
				method: "POST",
				body: { trackIds: "not-an-array", albumIds: 42 },
			})
		);
		expect(res.status).toBe(200);
		expect(getSavedTrackIdsMock).toHaveBeenCalledWith("u1", []);
		expect(getSavedAlbumIdsMock).toHaveBeenCalledWith("u1", []);
	});

	it("coerces array entries to strings via String()", async () => {
		setSessionUser("u1");
		getSavedTrackIdsMock.mockResolvedValue(new Set());
		getSavedAlbumIdsMock.mockResolvedValue(new Set());

		await POST(
			makeNextRequest({
				method: "POST",
				body: { trackIds: [42, "t1"], albumIds: [7] },
			})
		);
		expect(getSavedTrackIdsMock).toHaveBeenCalledWith("u1", ["42", "t1"]);
		expect(getSavedAlbumIdsMock).toHaveBeenCalledWith("u1", ["7"]);
	});

	it("treats invalid JSON as an empty body (defaults to empty arrays)", async () => {
		setSessionUser("u1");
		getSavedTrackIdsMock.mockResolvedValue(new Set());
		getSavedAlbumIdsMock.mockResolvedValue(new Set());

		const res = await POST(
			makeNextRequest({
				method: "POST",
				body: "{not json",
				headers: { "Content-Type": "application/json" },
			})
		);
		expect(res.status).toBe(200);
		const body = await readJson<{
			data: { tracks: string[]; albums: string[] };
		}>(res);
		expect(body?.data.tracks).toEqual([]);
		expect(body?.data.albums).toEqual([]);
	});

	it("returns 500 when getSavedTrackIds throws", async () => {
		setSessionUser("u1");
		getSavedTrackIdsMock.mockRejectedValue(new Error("db"));
		getSavedAlbumIdsMock.mockResolvedValue(new Set());

		const res = await POST(
			makeNextRequest({
				method: "POST",
				body: { trackIds: ["t1"], albumIds: [] },
			})
		);
		expect(res.status).toBe(500);
	});
});
