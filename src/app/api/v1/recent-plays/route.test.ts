// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/repositories/recentPlays", () => ({
	listRecentPlays: vi.fn(),
	recordPlayWithCap: vi.fn(),
	hasRecentPlay: vi.fn(),
}));
vi.mock("@/lib/library", () => ({ maybeEvictFile: vi.fn(async () => {}) }));

import { GET, POST } from "./route";
import { listRecentPlays, recordPlayWithCap } from "@/lib/repositories/recentPlays";
import { maybeEvictFile } from "@/lib/library";

const listMock = vi.mocked(listRecentPlays);
const recordMock = vi.mocked(recordPlayWithCap);
const maybeEvictFileMock = vi.mocked(maybeEvictFile);

beforeEach(() => {
	clearSession();
	listMock.mockReset();
	listMock.mockResolvedValue([]);
	recordMock.mockReset();
	recordMock.mockResolvedValue([]);
	maybeEvictFileMock.mockReset();
	maybeEvictFileMock.mockResolvedValue(undefined as never);
});

describe("GET /api/v1/recent-plays", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(401);
	});

	it("lists with default limit 50", async () => {
		setSessionUser("u1");
		listMock.mockResolvedValue([{ id: "r1" }] as never);
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { items: unknown[] } }>(res);
		expect(body?.data.items).toHaveLength(1);
		expect(listMock).toHaveBeenCalledWith("u1", 50);
	});

	it.each([
		["?limit=10", 10],
		["?limit=999", 100],
		["?limit=-5", 1],
		["?limit=0", 50],
		["?limit=abc", 50],
	])("clamps %s → %i", async (qs, expected) => {
		setSessionUser("u1");
		await GET(makeNextRequest({ url: `http://localhost:3000/api/v1/recent-plays${qs}` }));
		expect(listMock).toHaveBeenCalledWith("u1", expected);
	});

	it("returns 500 when the repo throws", async () => {
		setSessionUser("u1");
		listMock.mockRejectedValue(new Error("db down"));
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string; message: string } }>(res);
		expect(body?.error.code).toBe("INTERNAL_ERROR");
		expect(body?.error.message).toBe("db down");
	});
});

describe("POST /api/v1/recent-plays", () => {
	const post = (body: unknown) =>
		POST(makeNextRequest({ method: "POST", body }));

	it("returns 401 when not authenticated", async () => {
		expect((await post({ trackId: "1" })).status).toBe(401);
	});

	it.each([{}, { trackId: "" }, { trackId: 42 }])(
		"returns 400 INVALID_BODY for %o",
		async (body) => {
			setSessionUser("u1");
			const res = await post(body);
			expect(res.status).toBe(400);
			const b = await readJson<{ error: { code: string } }>(res);
			expect(b?.error.code).toBe("INVALID_BODY");
		},
	);

	it("returns 400 when body is not JSON", async () => {
		setSessionUser("u1");
		const res = await POST(
			makeNextRequest({ method: "POST", body: "not-json{{", headers: { "Content-Type": "application/json" } }),
		);
		expect(res.status).toBe(400);
	});

	it("records and evicts nothing when under cap", async () => {
		setSessionUser("u1");
		recordMock.mockResolvedValue([]);
		const res = await post({ trackId: "track-1", title: "Hi", artist: "Me" });
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { logged: boolean } }>(res);
		expect(body?.data).toEqual({ logged: true });
		expect(recordMock).toHaveBeenCalledWith(
			"u1",
			expect.objectContaining({ trackId: "track-1", title: "Hi", artist: "Me" }),
			100,
		);
		expect(maybeEvictFileMock).not.toHaveBeenCalled();
	});

	it("evicts each returned trackId when over cap", async () => {
		setSessionUser("u1");
		recordMock.mockResolvedValue(["t-old1", "t-old2"]);
		const res = await post({ trackId: "fresh" });
		expect(res.status).toBe(200);
		expect(maybeEvictFileMock).toHaveBeenCalledTimes(2);
		expect(maybeEvictFileMock).toHaveBeenCalledWith("t-old1");
		expect(maybeEvictFileMock).toHaveBeenCalledWith("t-old2");
	});

	it("swallows individual eviction errors and still succeeds", async () => {
		setSessionUser("u1");
		recordMock.mockResolvedValue(["t-old1"]);
		maybeEvictFileMock.mockRejectedValueOnce(new Error("disk error"));
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await post({ trackId: "fresh" });
		expect(res.status).toBe(200);
		errSpy.mockRestore();
	});

	it("returns 500 when recordPlayWithCap throws", async () => {
		setSessionUser("u1");
		recordMock.mockRejectedValue(new Error("db oops"));
		const res = await post({ trackId: "track-1" });
		expect(res.status).toBe(500);
	});
});
