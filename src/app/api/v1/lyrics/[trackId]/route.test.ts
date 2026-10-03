import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";
import { clearLyricsCache } from "@/lib/lyrics/cache";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("../../_lib/helpers", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../_lib/helpers")>();
	return { ...actual, requireDeezer: vi.fn() };
});
vi.mock("@/lib/lyrics/resolve", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/lyrics/resolve")>();
	return { ...actual, findLyrics: vi.fn() };
});

import { GET } from "./route";
import { requireDeezer } from "../../_lib/helpers";
import { findLyrics, NO_LYRICS, type FindLyricsOptions } from "@/lib/lyrics/resolve";

const requireDeezerMock = vi.mocked(requireDeezer);
const findLyricsMock = vi.mocked(findLyrics);

const dz = {
	api: { getTrack: vi.fn() },
	gw: { get_track_lyrics: vi.fn() },
};
const withDeezer = () => requireDeezerMock.mockResolvedValue({ userId: "u1", dz, error: null } as never);
const withoutDeezer = () =>
	requireDeezerMock.mockResolvedValue({ userId: null, dz: null, error: new Response(null, { status: 401 }) } as never);

const FOUND = { source: "lrclib" as const, syncedLyrics: "[00:01.00]a\n[00:02.00]b", plainLyrics: "a\nb", instrumental: false };
const url = (qs = "") => `http://localhost:3000/api/v1/lyrics/42${qs}`;
const get = (qs = "") => GET(makeNextRequest({ url: url(qs) }), makeParams({ trackId: "42" }));
type Body = { data: typeof FOUND; error?: { code: string } };

describe("GET /api/v1/lyrics/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		clearLyricsCache();
		withoutDeezer();
		dz.api.getTrack.mockReset();
		dz.gw.get_track_lyrics.mockReset();
		findLyricsMock.mockResolvedValue(FOUND);
		prismaMock.savedTrack.findUnique.mockResolvedValue(null);
		prismaMock.recentPlay.findUnique.mockResolvedValue(null);
	});

	it("returns 401 when not authenticated", async () => {
		const res = await get();
		expect(res.status).toBe(401);
	});

	it("uses the metadata sent by the client without touching the DB", async () => {
		setSessionUser("u1");
		const res = await get("?title=Blinding%20Lights&artist=The%20Weeknd&album=After%20Hours&duration=200");
		expect(res.status).toBe(200);
		expect((await readJson<Body>(res))?.data).toEqual(FOUND);
		expect(findLyricsMock.mock.calls[0][0]).toEqual({ title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 200 });
		expect(prismaMock.savedTrack.findUnique).not.toHaveBeenCalled();
		expect(requireDeezerMock).not.toHaveBeenCalled();
	});

	it("falls back to SavedTrack then RecentPlay for missing fields", async () => {
		setSessionUser("u1");
		prismaMock.savedTrack.findUnique.mockResolvedValue({ title: "Saved", artist: "", album: null } as never);
		prismaMock.recentPlay.findUnique.mockResolvedValue({ title: "Recent", artist: "Artist", album: "Album" } as never);
		await get("?duration=180");
		expect(findLyricsMock.mock.calls[0][0]).toEqual({ title: "Saved", artist: "Artist", album: "Album", duration: 180 });
	});

	it("fills metadata from the Deezer track API (was: 400 MISSING_METADATA for tracks neither saved nor recent)", async () => {
		setSessionUser("u1");
		withDeezer();
		dz.api.getTrack.mockResolvedValue({ title: "Song", artist: { name: "Artist" }, album: { title: "LP" }, duration: 215 });
		const res = await get();
		expect(res.status).toBe(200);
		expect(dz.api.getTrack).toHaveBeenCalledWith("42");
		expect(findLyricsMock.mock.calls[0][0]).toEqual({ title: "Song", artist: "Artist", album: "LP", duration: 215 });
		expect(requireDeezerMock).toHaveBeenCalledTimes(1);
	});

	it("keeps going when the Deezer track lookup throws", async () => {
		setSessionUser("u1");
		withDeezer();
		dz.api.getTrack.mockRejectedValue(new Error("DataException"));
		const res = await get("?title=A&artist=B");
		expect(res.status).toBe(200);
		expect(findLyricsMock.mock.calls[0][0]).toEqual({ title: "A", artist: "B", album: null, duration: null });
	});

	it("asks Deezer lyrics alone when no metadata exists but Deezer is connected", async () => {
		setSessionUser("u1");
		withDeezer();
		dz.api.getTrack.mockResolvedValue(null);
		const res = await get();
		expect(res.status).toBe(200);
		expect(findLyricsMock.mock.calls[0][0]).toBeNull();
	});

	it("returns 400 MISSING_METADATA when there is neither metadata nor Deezer", async () => {
		setSessionUser("u1");
		const res = await get();
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe("MISSING_METADATA");
		expect(findLyricsMock).not.toHaveBeenCalled();
	});

	it("ignores a non-numeric duration", async () => {
		setSessionUser("u1");
		await get("?title=A&artist=B&duration=abc");
		expect(findLyricsMock.mock.calls[0][0]?.duration).toBeNull();
	});

	it("feeds Deezer GW lyrics to the resolver as LRC", async () => {
		setSessionUser("u1");
		withDeezer();
		dz.gw.get_track_lyrics.mockResolvedValue({
			LYRICS_TEXT: "I'm here",
			LYRICS_SYNC_JSON: [{ milliseconds: "1000", line: "I&#039;m here" }],
		});
		await get("?title=A&artist=B&duration=100");
		const opts = findLyricsMock.mock.calls[0][1] as FindLyricsOptions;
		expect(await opts.deezer!()).toEqual({ plainLyrics: "I'm here", syncedLyrics: "[00:01.00]I'm here" });

		dz.gw.get_track_lyrics.mockResolvedValue(null);
		expect(await opts.deezer!()).toBeNull();
		dz.gw.get_track_lyrics.mockResolvedValue({ LYRICS_TEXT: "" });
		expect(await opts.deezer!()).toEqual({ plainLyrics: null, syncedLyrics: null });
	});

	it("passes a Deezer callback that resolves to null without a session", async () => {
		setSessionUser("u1");
		await get("?title=A&artist=B&duration=100");
		const opts = findLyricsMock.mock.calls[0][1] as FindLyricsOptions;
		expect(await opts.deezer!()).toBeNull();
	});

	it("caches results per track + metadata", async () => {
		setSessionUser("u1");
		await get("?title=A&artist=B&duration=100");
		const again = await get("?title=a&artist=b&duration=100.2");
		expect((await readJson<Body>(again))?.data).toEqual(FOUND);
		expect(findLyricsMock).toHaveBeenCalledTimes(1);

		findLyricsMock.mockResolvedValue(NO_LYRICS);
		await get("?title=Other&artist=B&duration=100");
		expect(findLyricsMock).toHaveBeenCalledTimes(2);
	});

	it("maps unexpected errors to a 500", async () => {
		setSessionUser("u1");
		findLyricsMock.mockRejectedValue(new Error("boom"));
		const res = await get("?title=A&artist=B&duration=100");
		expect(res.status).toBe(500);
	});
});
