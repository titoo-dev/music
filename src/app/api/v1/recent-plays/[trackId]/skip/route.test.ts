// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/repositories/recentPlays", () => ({ hasRecentPlay: vi.fn() }));
vi.mock("@/lib/library", () => ({
	maybeEvictFile: vi.fn(async () => {}),
	getTrackRefCount: vi.fn(),
}));

import { POST } from "./route";
import { hasRecentPlay } from "@/lib/repositories/recentPlays";
import { maybeEvictFile, getTrackRefCount } from "@/lib/library";

const hasRecentPlayMock = vi.mocked(hasRecentPlay);
const maybeEvictFileMock = vi.mocked(maybeEvictFile);
const getTrackRefCountMock = vi.mocked(getTrackRefCount);

beforeEach(() => {
	clearSession();
	hasRecentPlayMock.mockReset();
	maybeEvictFileMock.mockReset();
	maybeEvictFileMock.mockResolvedValue(undefined as never);
	getTrackRefCountMock.mockReset();
});

describe("POST /api/v1/recent-plays/[trackId]/skip", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t1" }));
		expect(res.status).toBe(401);
	});

	it("kept=already_played when the user has played the track", async () => {
		setSessionUser("u1");
		hasRecentPlayMock.mockResolvedValue(true);
		const res = await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { kept: boolean; reason: string } }>(res);
		expect(body?.data).toEqual({ kept: true, reason: "already_played" });
		expect(getTrackRefCountMock).not.toHaveBeenCalled();
		expect(maybeEvictFileMock).not.toHaveBeenCalled();
	});

	it("kept=anchored when other refs exist", async () => {
		setSessionUser("u1");
		hasRecentPlayMock.mockResolvedValue(false);
		getTrackRefCountMock.mockResolvedValue({ total: 3 } as never);
		const res = await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { kept: boolean; reason: string } }>(res);
		expect(body?.data).toEqual({ kept: true, reason: "anchored" });
		expect(maybeEvictFileMock).not.toHaveBeenCalled();
	});

	it("evicts when no prior play and no anchors", async () => {
		setSessionUser("u1");
		hasRecentPlayMock.mockResolvedValue(false);
		getTrackRefCountMock.mockResolvedValue({ total: 0 } as never);
		const res = await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { evicted: boolean } }>(res);
		expect(body?.data).toEqual({ evicted: true });
		expect(maybeEvictFileMock).toHaveBeenCalledWith("t1");
	});

	it("queries with the correct trackId", async () => {
		setSessionUser("u1");
		hasRecentPlayMock.mockResolvedValue(true);
		await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t-special" }));
		expect(hasRecentPlayMock).toHaveBeenCalledWith("u1", "t-special");
	});

	it("returns 500 when hasRecentPlay throws", async () => {
		setSessionUser("u1");
		hasRecentPlayMock.mockRejectedValue(new Error("db down"));
		const res = await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t1" }));
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string; message: string } }>(res);
		expect(body?.error.code).toBe("INTERNAL_ERROR");
	});

	it("returns 500 when getTrackRefCount throws", async () => {
		setSessionUser("u1");
		hasRecentPlayMock.mockResolvedValue(false);
		getTrackRefCountMock.mockRejectedValue(new Error("ref fail"));
		const res = await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t1" }));
		expect(res.status).toBe(500);
	});

	it("returns 500 when maybeEvictFile throws", async () => {
		setSessionUser("u1");
		hasRecentPlayMock.mockResolvedValue(false);
		getTrackRefCountMock.mockResolvedValue({ total: 0 } as never);
		maybeEvictFileMock.mockRejectedValue(new Error("disk fail"));
		const res = await POST(makeNextRequest({ method: "POST" }), makeParams({ trackId: "t1" }));
		expect(res.status).toBe(500);
	});
});
