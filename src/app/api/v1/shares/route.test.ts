import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/library", () => ({ shareTrack: vi.fn() }));

import { GET, POST } from "./route";
import { shareTrack } from "@/lib/library";

const shareTrackMock = vi.mocked(shareTrack);

type Body = { data: { shareId: string }; error: { code: string } };

const meta = { trackId: "42", title: "Song", artist: "Band", album: "LP", coverUrl: "https://e-cdns-images.dzcdn.net/images/cover/x/250x250-000000-80-0-0.jpg", duration: 200 };

function post(body: unknown) {
	return POST(makeNextRequest({ method: "POST", body }));
}

beforeEach(() => {
	resetPrismaMock();
	clearSession();
	shareTrackMock.mockReset();
	shareTrackMock.mockImplementation(async (_u, t, o) => ({ shareId: "new", ...t, expiresAt: o?.expiresAt ?? null }) as never);
	prismaMock.sharedTrack.deleteMany.mockResolvedValue({ count: 0 });
});

describe("POST /api/v1/shares", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await post(meta);
		expect(res.status).toBe(401);
	});

	it("returns 400 without a trackId", async () => {
		setSessionUser("u1");
		const res = await post({ title: "Song", artist: "Band" });
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error.code).toBe("MISSING_TRACK_ID");
	});

	it("refuses a share without title or artist (was: the web dialog sent only trackId, so public pages showed an empty title)", async () => {
		setSessionUser("u1");
		for (const body of [{ trackId: "42" }, { trackId: "42", title: "Song" }, { trackId: "42", title: "  ", artist: "Band" }]) {
			const res = await post(body);
			expect(res.status).toBe(400);
			expect((await readJson<Body>(res))?.error.code).toBe("MISSING_METADATA");
		}
		expect(shareTrackMock).not.toHaveBeenCalled();
	});

	it("stores the track metadata sent by the client", async () => {
		setSessionUser("u1");
		prismaMock.sharedTrack.findFirst.mockResolvedValue(null);
		const res = await post({ ...meta, expiresIn: 24 });
		expect(res.status).toBe(201);
		expect(shareTrackMock).toHaveBeenCalledWith(
			"u1",
			{ trackId: "42", title: "Song", artist: "Band", album: "LP", coverUrl: meta.coverUrl, duration: 200 },
			{ expiresAt: expect.any(Date) }
		);
	});

	it("drops a foreign cover and caps the text it stores (was: any title and any coverUrl went to the public page and the OG renderer)", async () => {
		setSessionUser("u1");
		prismaMock.sharedTrack.findFirst.mockResolvedValue(null);
		const res = await post({ ...meta, title: "x".repeat(500), coverUrl: "https://169.254.169.254/latest", duration: "200" });
		expect(res.status).toBe(201);
		expect(shareTrackMock).toHaveBeenCalledWith(
			"u1",
			{ trackId: "42", title: "x".repeat(200), artist: "Band", album: "LP", coverUrl: null, duration: null },
			{ expiresAt: null }
		);
	});

	it("reuses the user's live share for the same track", async () => {
		setSessionUser("u1");
		const live = { shareId: "old", trackId: "42", userId: "u1", expiresAt: null };
		prismaMock.sharedTrack.findFirst.mockResolvedValue(live as never);
		const res = await post(meta);
		expect(res.status).toBe(200);
		expect((await readJson<Body>(res))?.data.shareId).toBe("old");
		expect(shareTrackMock).not.toHaveBeenCalled();
	});

	it("never reuses an expired share and creates a fresh link (was: returned the dead link forever)", async () => {
		setSessionUser("u1");
		prismaMock.sharedTrack.findFirst.mockResolvedValue(null);
		const res = await post({ ...meta, expiresIn: 168 });
		expect(res.status).toBe(201);
		expect((await readJson<Body>(res))?.data.shareId).toBe("new");

		const where = prismaMock.sharedTrack.findFirst.mock.calls[0][0]?.where as unknown as { userId: string; trackId: string; OR: unknown };
		expect(where.userId).toBe("u1");
		expect(where.trackId).toBe("42");
		expect(where.OR).toEqual([{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }]);
		// The dead links of this user + track are dropped so they stop anchoring the file.
		expect(prismaMock.sharedTrack.deleteMany).toHaveBeenCalledWith({
			where: { userId: "u1", trackId: "42", expiresAt: { lte: expect.any(Date) } },
		});
	});
});

describe("GET /api/v1/shares", () => {
	it("lists the user's shares, newest first", async () => {
		setSessionUser("u1");
		prismaMock.sharedTrack.findMany.mockResolvedValue([{ shareId: "a" }] as never);
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(200);
		expect(prismaMock.sharedTrack.findMany).toHaveBeenCalledWith({ where: { userId: "u1" }, orderBy: { createdAt: "desc" } });
	});
});
