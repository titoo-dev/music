import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { decryptSecret } from "@/lib/secret-box";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { serverStateMock, DeezerCtor, behavior } = vi.hoisted(() => {
	const behavior = { login: true, cookieArl: "cookie-arl" as string | undefined };
	const DeezerCtor = vi.fn(function () {
		const dz = {
			loggedIn: false,
			selectedAccount: 0,
			currentUser: undefined as Record<string, unknown> | undefined,
			childs: [{ id: 11, name: "Parent", license_token: "LT-SECRET", can_stream_hq: true, can_stream_lossless: false }],
			cookieJar: {
				getCookiesSync: () => (behavior.cookieArl ? [{ key: "arl", value: behavior.cookieArl }] : []),
			},
			login: vi.fn(async () => {
				if (!behavior.login) return false;
				dz.loggedIn = true;
				dz.currentUser = dz.childs[0];
				return true;
			}),
		};
		return dz;
	});
	return { serverStateMock: { setUserDz: vi.fn() }, DeezerCtor, behavior };
});
vi.mock("@/lib/server-state", () => serverStateMock);
vi.mock("@/lib/deezer", () => ({ Deezer: DeezerCtor }));

import { POST } from "./route";

const post = (body: unknown) => POST(makeNextRequest({ method: "POST", body }));

beforeEach(() => {
	resetPrismaMock();
	clearSession();
	serverStateMock.setUserDz.mockReset();
	DeezerCtor.mockClear();
	behavior.login = true;
	behavior.cookieArl = "cookie-arl";
	vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("POST /api/v1/auth/login-email", () => {
	it("returns 401 when not signed in", async () => {
		expect((await post({ email: "a", password: "b" })).status).toBe(401);
	});

	it("returns 400 MISSING_CREDENTIALS without email or password", async () => {
		setSessionUser("u1");
		const res = await post({ email: "a" });
		expect(res.status).toBe(400);
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("MISSING_CREDENTIALS");
	});

	it("returns 401 LOGIN_FAILED on bad credentials", async () => {
		setSessionUser("u1");
		behavior.login = false;
		expect((await post({ email: "a", password: "b" })).status).toBe(401);
	});

	it("stores the cookie ARL encrypted with child account 0 (was: plaintext ARL)", async () => {
		setSessionUser("u1");
		const res = await post({ email: "a@b.c", password: "pw" });
		expect(res.status).toBe(200);
		const args = prismaMock.deezerCredential.upsert.mock.calls[0][0];
		expect(args.update.arl).toMatch(/^enc:v1:/);
		expect(decryptSecret(args.update.arl)).toBe("cookie-arl");
		expect(args.update.childAccount).toBe(0);
	});

	it("does not touch the credential when the cookie jar holds no ARL", async () => {
		setSessionUser("u1");
		behavior.cookieArl = undefined;
		expect((await post({ email: "a@b.c", password: "pw" })).status).toBe(200);
		expect(prismaMock.deezerCredential.upsert).not.toHaveBeenCalled();
	});

	it("never returns the license token (was: user.license_token in the response)", async () => {
		setSessionUser("u1");
		const res = await post({ email: "a@b.c", password: "pw" });
		const text = await res.text();
		expect(text).not.toContain("LT-SECRET");
		expect(JSON.parse(text).data).toEqual({
			user: { id: 11, name: "Parent", can_stream_hq: true, can_stream_lossless: false },
			childs: [{ id: 11, name: "Parent", can_stream_hq: true, can_stream_lossless: false }],
			currentChild: 0,
			hasMultipleAccounts: false,
		});
	});
});
