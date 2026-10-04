import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { serverStateMock, DeezerCtor, behavior } = vi.hoisted(() => {
	const behavior = { login: true };
	const DeezerCtor = vi.fn(function () {
		const dz = {
			loggedIn: false,
			selectedAccount: 0,
			childs: [
				{ id: 11, name: "Parent", license_token: "LT-SECRET", can_stream_hq: true, can_stream_lossless: true },
				{ id: 12, name: "Kid", license_token: "LT-SECRET", can_stream_hq: true, can_stream_lossless: true },
			],
			currentUser: undefined as Record<string, unknown> | undefined,
			loginViaArl: vi.fn(async (_arl: string, child = 0) => {
				if (!behavior.login) return false;
				dz.loggedIn = true;
				dz.selectedAccount = child;
				dz.currentUser = dz.childs[child];
				return true;
			}),
		};
		return dz;
	});
	return {
		serverStateMock: { getUserDz: vi.fn(), setUserDz: vi.fn(), getWaveletApp: vi.fn() },
		DeezerCtor,
		behavior,
	};
});
vi.mock("@/lib/server-state", () => serverStateMock);
vi.mock("@/lib/deezer", () => ({ Deezer: DeezerCtor }));

import { GET } from "./route";

type Body = { data: { authenticated: boolean; deezerLoggedIn: boolean; deezerUser: Record<string, unknown> | null } };

function signIn() {
	authMock.api.getSession.mockResolvedValue({ user: { id: "u1", name: "U", email: "u@x", image: null } } as never);
}

beforeEach(() => {
	resetPrismaMock();
	clearSession();
	Object.values(serverStateMock).forEach((m) => m.mockReset());
	serverStateMock.getWaveletApp.mockResolvedValue(null);
	DeezerCtor.mockClear();
	behavior.login = true;
	vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
	vi.stubEnv("WAVELET_SERVICE_ARL", "");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("GET /api/v1/auth/connect", () => {
	it("reports a guest when not signed in", async () => {
		const body = await readJson<Body>(await GET(makeNextRequest()));
		expect(body?.data.authenticated).toBe(false);
		expect(body?.data.deezerLoggedIn).toBe(false);
	});

	it("decrypts the stored ARL and restores the saved child (was: raw column, child 0)", async () => {
		signIn();
		prismaMock.deezerCredential.findUnique.mockResolvedValue({ userId: "u1", arl: encryptSecret("real-arl"), childAccount: 1 });
		const body = await readJson<Body>(await GET(makeNextRequest()));
		const instance = DeezerCtor.mock.results[0].value;
		expect(instance.loginViaArl).toHaveBeenCalledWith("real-arl", 1);
		expect(body?.data.deezerLoggedIn).toBe(true);
		expect(body?.data.deezerUser?.name).toBe("Kid");
	});

	it("does not fall back to the service ARL when the user's own ARL is refused", async () => {
		vi.stubEnv("WAVELET_SERVICE_ARL", "service-arl");
		signIn();
		prismaMock.deezerCredential.findUnique.mockResolvedValue({ userId: "u1", arl: "bad-arl" });
		behavior.login = false;
		const body = await readJson<Body>(await GET(makeNextRequest()));
		expect(body?.data.deezerLoggedIn).toBe(false);
		expect(DeezerCtor).toHaveBeenCalledTimes(1);
	});

	it("falls back to the service ARL without a credential and stores it encrypted", async () => {
		vi.stubEnv("WAVELET_SERVICE_ARL", "service-arl");
		signIn();
		prismaMock.deezerCredential.findUnique.mockResolvedValue(null);
		const body = await readJson<Body>(await GET(makeNextRequest()));
		expect(body?.data.deezerLoggedIn).toBe(true);
		expect(DeezerCtor.mock.results[0].value.loginViaArl).toHaveBeenCalledWith("service-arl");
		const data = prismaMock.deezerCredential.create.mock.calls[0][0].data;
		expect(data.arl).toMatch(/^enc:v1:/);
		expect(decryptSecret(data.arl)).toBe("service-arl");
	});

	it("never returns the license token (was: deezerUser.license_token in the response)", async () => {
		signIn();
		prismaMock.deezerCredential.findUnique.mockResolvedValue({ userId: "u1", arl: "plain-arl", childAccount: 0 });
		const res = await GET(makeNextRequest());
		const text = await res.text();
		expect(text).not.toContain("LT-SECRET");
		expect(JSON.parse(text).data.deezerUser).toEqual({ id: 11, name: "Parent", can_stream_hq: true, can_stream_lossless: true });
	});
});
