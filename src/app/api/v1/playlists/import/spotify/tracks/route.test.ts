import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { prismaMock } from "@/test/helpers/mockPrisma";
import { trackEmbedHtml } from "@/lib/spotify/embed.fixture";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

import { POST } from "./route";

const fetchMock = vi.fn();
const A = "11hcBLPtbMp4aQI6zGQLub";
const B = "4EoJ151oQ5jY48z4RhSE96";

describe("POST /api/v1/playlists/import/spotify/tracks", () => {
	beforeEach(() => {
		clearSession();
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns 401 when not authenticated", async () => {
		const res = await POST(makeNextRequest({ method: "POST", body: { ids: [A] } }));
		expect(res.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("reads a batch and reports the rate-limited rest", async () => {
		setSessionUser("u1");
		fetchMock
			.mockResolvedValueOnce(new Response(trackEmbedHtml({ id: A, name: "Patient Zero", artists: ["Taylor Swift"], duration: 1 })))
			.mockResolvedValueOnce(new Response("", { status: 429 }));

		const res = await POST(makeNextRequest({ method: "POST", body: { ids: [A, B] } }));
		const body = await readJson<{ data: { tracks: Array<{ spotifyId: string }>; failed: string[]; rateLimited: string[] } }>(res);

		expect(res.status).toBe(200);
		expect(body?.data.tracks.map((t) => t.spotifyId)).toEqual([A]);
		expect(body?.data.rateLimited).toEqual([B]);
	});

	it.each([
		["missing ids", {}],
		["empty ids", { ids: [] }],
		["not a track id", { ids: ["https://open.spotify.com/track/x"] }],
	])("returns 400 INVALID_IDS for %s", async (_, body) => {
		setSessionUser("u1");
		const res = await POST(makeNextRequest({ method: "POST", body }));
		expect(res.status).toBe(400);
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("INVALID_IDS");
	});

	it("returns 400 TOO_MANY_IDS above 50", async () => {
		setSessionUser("u1");
		const res = await POST(makeNextRequest({ method: "POST", body: { ids: Array(51).fill(A) } }));
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("TOO_MANY_IDS");
	});
});
