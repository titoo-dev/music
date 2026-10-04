import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { serverStateMock } = vi.hoisted(() => ({ serverStateMock: { getWaveletApp: vi.fn() } }));
vi.mock("@/lib/server-state", () => serverStateMock);

import { GET, POST } from "./route";

const DEFAULTS = { maxBitrate: 3, tags: { title: true } };

function makeApp(settings: Record<string, unknown> = { maxBitrate: 1, tags: { title: true } }) {
	const app = {
		settings,
		getSettings: vi.fn(() => ({ settings: app.settings, defaultSettings: DEFAULTS })),
		saveSettings: vi.fn(async () => {}),
	};
	serverStateMock.getWaveletApp.mockResolvedValue(app);
	return app;
}

type Body = { success: boolean; data?: Record<string, unknown>; error?: { code: string } };

const post = (body: unknown) => POST(makeNextRequest({ method: "POST", body }));

beforeEach(() => {
	resetPrismaMock();
	clearSession();
	serverStateMock.getWaveletApp.mockReset();
});

describe("POST /api/v1/settings", () => {
	it("returns 401 NOT_AUTHENTICATED when not signed in and writes nothing (was: reachable unauthenticated, re-saved the server settings)", async () => {
		const app = makeApp();
		const res = await post({ settings: { maxBitrate: 9 }, spotifySettings: { clientId: "x" } });
		expect(res.status).toBe(401);
		expect((await readJson<Body>(res))?.error?.code).toBe("NOT_AUTHENTICATED");
		expect(app.saveSettings).not.toHaveBeenCalled();
		expect(prismaMock.userSettings.upsert).not.toHaveBeenCalled();
	});

	it("never rewrites the server-wide settings from spotifySettings (was: saveSettings(app.settings, spotifySettings) — the second argument was silently dropped)", async () => {
		setSessionUser("u1");
		const app = makeApp();
		const res = await post({ settings: { foo: 1 }, spotifySettings: { clientId: "x", clientSecret: "y" } });
		expect(res.status).toBe(200);
		expect(app.saveSettings).not.toHaveBeenCalled();
	});

	it("saves the signed-in user's settings and answers with the same shape as before", async () => {
		setSessionUser("u1");
		makeApp();
		const res = await post({ settings: { maxBitrate: 9 } });
		expect(res.status).toBe(200);
		expect(prismaMock.userSettings.upsert).toHaveBeenCalledWith({
			where: { userId: "u1" },
			update: { settings: { maxBitrate: 9 } },
			create: { userId: "u1", settings: { maxBitrate: 9 } },
		});
		expect((await readJson<Body>(res))?.data).toEqual({ settings: { maxBitrate: 9 }, defaultSettings: DEFAULTS });
	});

	it("stores {} and answers the server settings when the body has no settings (unchanged)", async () => {
		setSessionUser("u1");
		makeApp({ maxBitrate: 1 });
		const res = await post({});
		expect(prismaMock.userSettings.upsert.mock.calls[0][0].update).toEqual({ settings: {} });
		expect((await readJson<Body>(res))?.data).toEqual({ settings: { maxBitrate: 1 }, defaultSettings: DEFAULTS });
	});

	it("returns 400 INVALID_BODY on a non-JSON body (was: 500 with the parser's message)", async () => {
		setSessionUser("u1");
		makeApp();
		const res = await post("not json");
		expect(res.status).toBe(400);
		expect((await readJson<Body>(res))?.error?.code).toBe("INVALID_BODY");
	});

	it("returns 500 APP_NOT_INITIALIZED when the app is down", async () => {
		setSessionUser("u1");
		serverStateMock.getWaveletApp.mockResolvedValue(null);
		const res = await post({ settings: {} });
		expect(res.status).toBe(500);
	});
});

describe("GET /api/v1/settings", () => {
	it("returns the server settings when not signed in", async () => {
		makeApp({ maxBitrate: 1 });
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(200);
		expect((await readJson<Body>(res))?.data).toEqual({ settings: { maxBitrate: 1 }, defaultSettings: DEFAULTS });
	});

	it("merges the signed-in user's settings over the server ones", async () => {
		setSessionUser("u1");
		makeApp({ maxBitrate: 1, tags: { title: true } });
		prismaMock.userSettings.findUnique.mockResolvedValue({ settings: { maxBitrate: 9 } });
		const res = await GET(makeNextRequest());
		expect((await readJson<Body>(res))?.data).toEqual({
			settings: { maxBitrate: 9, tags: { title: true } },
			defaultSettings: DEFAULTS,
		});
	});
});
