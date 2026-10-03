import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { prismaMock } from "@/test/helpers/mockPrisma";
import { embedHtml } from "@/lib/spotify/embed.fixture";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

import { POST } from "./route";

const fetchMock = vi.fn();
const URL_IN = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc";

type Body = { data: { title: string; totalTracks: number; tracks: Array<{ title: string }> }; error?: { code: string } };

describe("POST /api/v1/playlists/import/spotify/playlist", () => {
	beforeEach(() => {
		clearSession();
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
		delete process.env.SPOTIFY_CLIENT_ID;
		delete process.env.SPOTIFY_CLIENT_SECRET;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns 401 when not authenticated", async () => {
		const res = await POST(makeNextRequest({ method: "POST", body: { url: URL_IN } }));
		expect(res.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("reads the playlist without matching anything", async () => {
		setSessionUser("u1");
		fetchMock.mockResolvedValue(new Response(embedHtml({ tracks: [{ title: "Patient Zero", subtitle: "Taylor Swift", duration: 225_868 }] }), { status: 200 }));

		const res = await POST(makeNextRequest({ method: "POST", body: { url: URL_IN } }));
		const body = await readJson<Body>(res);

		expect(res.status).toBe(200);
		expect(body?.data.title).toBe("Today’s Top Hits");
		expect(body?.data.tracks.map((t) => t.title)).toEqual(["Patient Zero"]);
	});

	it.each([
		["no url", {}, "MISSING_URL"],
		["a non-playlist url", { url: "https://example.com" }, "INVALID_URL"],
	])("returns 400 for %s", async (_, payload, code) => {
		setSessionUser("u1");
		const res = await POST(makeNextRequest({ method: "POST", body: payload }));
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe(code);
	});

	it("returns 404 SPOTIFY_NOT_FOUND when Spotify has no such playlist", async () => {
		setSessionUser("u1");
		fetchMock.mockResolvedValue(new Response("", { status: 404 }));
		const res = await POST(makeNextRequest({ method: "POST", body: { url: URL_IN } }));
		expect(res.status).toBe(404);
		expect((await readJson<Body>(res))?.error?.code).toBe("SPOTIFY_NOT_FOUND");
	});

	it("returns 400 EMPTY_PLAYLIST for a playlist without tracks", async () => {
		setSessionUser("u1");
		fetchMock.mockResolvedValue(new Response(embedHtml({ tracks: [] }), { status: 200 }));
		const res = await POST(makeNextRequest({ method: "POST", body: { url: URL_IN } }));
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe("EMPTY_PLAYLIST");
	});
});
