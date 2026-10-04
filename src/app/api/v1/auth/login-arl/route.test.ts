import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { decryptSecret } from "@/lib/secret-box";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { serverStateMock, DeezerCtor, behavior } = vi.hoisted(() => {
	const behavior = { login: true };
	const DeezerCtor = vi.fn(function () {
		const dz = {
			loggedIn: false,
			selectedAccount: 0,
			currentUser: undefined as Record<string, unknown> | undefined,
			childs: [
				{ id: 11, name: "Parent", license_token: "LT-SECRET", can_stream_hq: true, can_stream_lossless: true },
				{ id: 12, name: "Kid", license_token: "LT-SECRET", can_stream_hq: true, can_stream_lossless: true },
			],
			changeAccount(n: number) {
				if (dz.childs.length - 1 < n) n = 0;
				dz.selectedAccount = n;
				dz.currentUser = dz.childs[n];
				return [dz.currentUser, n];
			},
			loginViaArl: vi.fn(async (_arl: string, child: string | number = 0) => {
				if (!behavior.login) return false;
				dz.loggedIn = true;
				dz.changeAccount(Number(child));
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
	vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("POST /api/v1/auth/login-arl", () => {
	it("returns 401 when not signed in", async () => {
		const res = await post({ arl: "a" });
		expect(res.status).toBe(401);
		expect(DeezerCtor).not.toHaveBeenCalled();
	});

	it("returns 400 MISSING_ARL without an ARL", async () => {
		setSessionUser("u1");
		const res = await post({});
		expect(res.status).toBe(400);
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("MISSING_ARL");
	});

	it("returns 401 LOGIN_FAILED when Deezer refuses the ARL", async () => {
		setSessionUser("u1");
		behavior.login = false;
		const res = await post({ arl: "bad" });
		expect(res.status).toBe(401);
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("LOGIN_FAILED");
		expect(prismaMock.deezerCredential.upsert).not.toHaveBeenCalled();
	});

	it("stores the ARL encrypted (was: plaintext ARL in deezer_credential)", async () => {
		setSessionUser("u1");
		const res = await post({ arl: "my-arl" });
		expect(res.status).toBe(200);
		const args = prismaMock.deezerCredential.upsert.mock.calls[0][0];
		expect(args.where).toEqual({ userId: "u1" });
		for (const data of [args.update, args.create]) {
			expect(data.arl).toMatch(/^enc:v1:/);
			expect(data.arl).not.toContain("my-arl");
			expect(decryptSecret(data.arl)).toBe("my-arl");
		}
		expect(args.create.userId).toBe("u1");
	});

	it("persists the selected child account (was: child passed to login but never stored, restores used child 0)", async () => {
		setSessionUser("u1");
		await post({ arl: "my-arl", child: 1 });
		const instance = DeezerCtor.mock.results[0].value;
		expect(instance.loginViaArl).toHaveBeenCalledWith("my-arl", 1);
		const args = prismaMock.deezerCredential.upsert.mock.calls[0][0];
		expect(args.update).toMatchObject({ childAccount: 1, deezerUserId: 12, deezerUserName: "Kid", canStreamLossless: true });
		expect(args.create.childAccount).toBe(1);
		expect(serverStateMock.setUserDz).toHaveBeenCalledWith("u1", instance);
	});
});
