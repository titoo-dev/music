import { describe, it, expect, vi, beforeEach } from "vitest";
import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/repositories/playlists", () => ({ isPlaylistOwned: vi.fn() }));
vi.mock("@/lib/library", () => ({
	addToPlaylist: vi.fn(),
	removeFromPlaylist: vi.fn(),
	reorderPlaylist: vi.fn(),
}));

import { PATCH } from "./route";
import { reorderPlaylist } from "@/lib/library";
import { isPlaylistOwned } from "@/lib/repositories/playlists";
const isPlaylistOwnedMock = vi.mocked(isPlaylistOwned);

const reorderPlaylistMock = vi.mocked(reorderPlaylist);

beforeEach(() => {
	isPlaylistOwnedMock.mockReset();
	clearSession();
	reorderPlaylistMock.mockReset();
});

describe("PATCH /api/v1/playlists/[id]/tracks", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { trackIds: ["a", "b"] } }),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(401);
		expect(reorderPlaylistMock).not.toHaveBeenCalled();
	});

	it("returns 404 when the playlist doesn't belong to the user", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(false);

		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { trackIds: ["a"] } }),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(404);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_FOUND");
		expect(reorderPlaylistMock).not.toHaveBeenCalled();
	});

	it("returns 400 when trackIds is missing or not an array", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(true);

		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { trackIds: "not-an-array" } }),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(400);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("MISSING_TRACK_IDS");
	});

	it("happy path: forwards stringified trackIds to reorderPlaylist and returns its result", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(true);
		reorderPlaylistMock.mockResolvedValue({ reordered: 3 });

		const res = await PATCH(
			makeNextRequest({
				method: "PATCH",
				body: { trackIds: ["c", "a", "b"] },
			}),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { reordered: number } }>(res);
		expect(body?.data.reordered).toBe(3);
		expect(reorderPlaylistMock).toHaveBeenCalledWith("pl1", ["c", "a", "b"]);
	});

	it("coerces non-string trackIds to strings before forwarding", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(true);
		reorderPlaylistMock.mockResolvedValue({ reordered: 2 });

		await PATCH(
			makeNextRequest({
				method: "PATCH",
				body: { trackIds: [42, "abc"] },
			}),
			makeParams({ id: "pl1" })
		);
		expect(reorderPlaylistMock).toHaveBeenCalledWith("pl1", ["42", "abc"]);
	});

	it("maps REORDER_LENGTH_MISMATCH from the lib to a 400 with the same code", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(true);
		reorderPlaylistMock.mockRejectedValue(new Error("REORDER_LENGTH_MISMATCH"));

		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { trackIds: ["a"] } }),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(400);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("REORDER_LENGTH_MISMATCH");
	});

	it("maps REORDER_DUPLICATE_TRACK to a 400 with the same code", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(true);
		reorderPlaylistMock.mockRejectedValue(new Error("REORDER_DUPLICATE_TRACK"));

		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { trackIds: ["a", "a"] } }),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(400);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("REORDER_DUPLICATE_TRACK");
	});

	it("maps REORDER_UNKNOWN_TRACK to a 400 with the same code", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(true);
		reorderPlaylistMock.mockRejectedValue(new Error("REORDER_UNKNOWN_TRACK"));

		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { trackIds: ["a", "z"] } }),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(400);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("REORDER_UNKNOWN_TRACK");
	});

	it("returns 500 on any other thrown error", async () => {
		setSessionUser("u1");
		isPlaylistOwnedMock.mockResolvedValue(true);
		reorderPlaylistMock.mockRejectedValue(new Error("ECONNREFUSED"));

		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { trackIds: ["a", "b"] } }),
			makeParams({ id: "pl1" })
		);
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("INTERNAL_ERROR");
	});
});
