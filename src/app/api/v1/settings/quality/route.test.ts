import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { serverStateMock } = vi.hoisted(() => ({ serverStateMock: { getWaveletApp: vi.fn() } }));
vi.mock("@/lib/server-state", () => serverStateMock);

import { GET, POST } from "./route";

function makeApp(maxBitrate = 1) {
	const app = {
		settings: { maxBitrate, tags: { title: true } },
		freshSettings: vi.fn(async () => app.settings),
		saveSettings: vi.fn(async (s: { maxBitrate: number }) => {
			app.settings = s as typeof app.settings;
		}),
	};
	serverStateMock.getWaveletApp.mockResolvedValue(app);
	return app;
}

const post = (body: unknown) => POST(makeNextRequest({ method: "POST", body }));

beforeEach(() => {
	clearSession();
	serverStateMock.getWaveletApp.mockReset();
});

describe("GET /api/v1/settings/quality", () => {
	it("returns the server-wide maxBitrate, fresh from the config store", async () => {
		const app = makeApp(3);
		const res = await GET();
		expect(res.status).toBe(200);
		expect((await readJson<{ data: { maxBitrate: number } }>(res))?.data).toEqual({ maxBitrate: 3 });
		expect(app.freshSettings).toHaveBeenCalled();
	});

	it("returns 500 when the app is not initialized", async () => {
		serverStateMock.getWaveletApp.mockResolvedValue(null);
		const res = await GET();
		expect(res.status).toBe(500);
	});
});

describe("POST /api/v1/settings/quality", () => {
	it("returns 401 when not signed in", async () => {
		const app = makeApp();
		const res = await post({ maxBitrate: 3 });
		expect(res.status).toBe(401);
		expect(app.saveSettings).not.toHaveBeenCalled();
	});

	it.each([[2], ["3"], [null], [undefined]])("rejects maxBitrate %j with 400", async (maxBitrate) => {
		setSessionUser("u1");
		const app = makeApp();
		const res = await post({ maxBitrate });
		expect(res.status).toBe(400);
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("INVALID_BITRATE");
		expect(app.saveSettings).not.toHaveBeenCalled();
	});

	it("returns 400 on a non-JSON body", async () => {
		setSessionUser("u1");
		makeApp();
		const res = await post("not json");
		expect(res.status).toBe(400);
	});

	it.each([[1], [3], [9]])("saves maxBitrate %i server-wide and keeps the other settings", async (maxBitrate) => {
		setSessionUser("u1");
		const app = makeApp(1);
		const res = await post({ maxBitrate });
		expect(res.status).toBe(200);
		expect((await readJson<{ data: { maxBitrate: number } }>(res))?.data).toEqual({ maxBitrate });
		// Re-read first so another instance's newer settings aren't overwritten.
		expect(app.freshSettings).toHaveBeenCalledWith(0);
		expect(app.saveSettings).toHaveBeenCalledWith({ maxBitrate, tags: { title: true } });
	});
});
