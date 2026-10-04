// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams } from "@/test/helpers/nextRequest";

const { serverStateMock, afterMock, preferredMock } = vi.hoisted(() => ({
	serverStateMock: {
		getWaveletApp: vi.fn(),
		getUserDz: vi.fn(),
		setUserDz: vi.fn(),
		getGuestDz: vi.fn(),
	},
	afterMock: vi.fn(),
	preferredMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/server-state", () => serverStateMock);
vi.mock("next/server", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/server")>()),
	after: afterMock,
}));
vi.mock("@/lib/wavelet/utils/getPreferredBitrate", () => ({ getPreferredBitrate: preferredMock }));

import { GET } from "./route";
import { gwTrackCache, gwTrackKey } from "@/lib/wavelet/cache/deezer-track-cache";

const gwTrack = {
	SNG_ID: 1,
	SNG_TITLE: "T",
	TRACK_TOKEN: "token-of-a",
	FILESIZE_MP3_128: "100",
	EXPLICIT_TRACK_CONTENT: {},
	MEDIA: [],
};

function dzFor(deezerUserId: number) {
	return {
		loggedIn: true,
		currentUser: { id: deezerUserId, can_stream_hq: false, can_stream_lossless: false },
		gw: { get_track_with_fallback: vi.fn(async () => gwTrack) },
	};
}

function arrange(dz: unknown) {
	setSessionUser("u1");
	serverStateMock.getUserDz.mockReturnValue(dz);
	serverStateMock.getWaveletApp.mockResolvedValue({
		freshSettings: vi.fn(async () => ({ maxBitrate: 1 })),
		storageProvider: {},
	});
}

async function warm(trackId = "1") {
	return GET(makeNextRequest({ url: `http://localhost:3000/api/v1/stream-warm/${trackId}` }), makeParams({ trackId }));
}

describe("GET /api/v1/stream-warm/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		vi.clearAllMocks();
		gwTrackCache.delete(gwTrackKey(111, "1"));
		gwTrackCache.delete(gwTrackKey(222, "1"));
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
	});

	it("returns 401 without a session", async () => {
		const res = await warm();
		expect(res.status).toBe(401);
	});

	it("warms an uncached track in after() and caches the gw answer under the caller's Deezer user", async () => {
		const dz = dzFor(111);
		arrange(dz);

		const res = await warm();
		expect(res.status).toBe(204);
		expect(afterMock).toHaveBeenCalledOnce();
		await (afterMock.mock.calls[0][0] as () => Promise<void>)();
		expect(dz.gw.get_track_with_fallback).toHaveBeenCalledWith("1");
		expect(gwTrackCache.get(gwTrackKey(111, "1"))).toBe(gwTrack);
		expect(gwTrackCache.get(gwTrackKey(222, "1"))).toBeNull();
		expect(preferredMock).toHaveBeenCalled();
	});

	it("does not reuse another Deezer user's warm gw answer (was: the trackId-only cache served user A's TRACK_TOKEN to user B)", async () => {
		gwTrackCache.set(gwTrackKey(111, "1"), gwTrack);
		arrange(dzFor(222));

		const res = await warm();
		expect(res.status).toBe(204);
		expect(afterMock).toHaveBeenCalledOnce();
	});

	it("skips the work when this user's gw answer is already warm", async () => {
		gwTrackCache.set(gwTrackKey(111, "1"), gwTrack);
		arrange(dzFor(111));

		const res = await warm();
		expect(res.status).toBe(204);
		expect(afterMock).not.toHaveBeenCalled();
	});

	it("swallows warming failures", async () => {
		const dz = dzFor(111);
		dz.gw.get_track_with_fallback.mockRejectedValue(new Error("gw down"));
		arrange(dz);

		await warm();
		await expect((afterMock.mock.calls[0][0] as () => Promise<void>)()).resolves.toBeUndefined();
	});
});
