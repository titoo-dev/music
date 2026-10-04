import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { serverStateMock } = vi.hoisted(() => ({
	serverStateMock: { getUserDz: vi.fn(), setUserDz: vi.fn(), getGuestDz: vi.fn(), getWaveletApp: vi.fn() },
}));
vi.mock("@/lib/server-state", () => serverStateMock);
vi.mock("@/lib/deezer", () => ({ Deezer: vi.fn() }));

import { POST } from "./route";

function sessionDz() {
	const dz = {
		loggedIn: true,
		selectedAccount: 0,
		childs: [
			{ id: 11, name: "Parent", license_token: "LT-SECRET", can_stream_hq: true, can_stream_lossless: true },
			{ id: 12, name: "Kid", license_token: "LT-SECRET", can_stream_hq: true, can_stream_lossless: true },
		],
		currentUser: undefined as Record<string, unknown> | undefined,
		changeAccount(n: number) {
			if (dz.childs.length - 1 < n) n = 0;
			dz.selectedAccount = n;
			dz.currentUser = dz.childs[n];
			return [dz.currentUser, n];
		},
	};
	dz.currentUser = dz.childs[0];
	serverStateMock.getUserDz.mockReturnValue(dz);
	return dz;
}

const post = (body: unknown) => POST(makeNextRequest({ method: "POST", body }));

beforeEach(() => {
	resetPrismaMock();
	clearSession();
	Object.values(serverStateMock).forEach((m) => m.mockReset());
});

describe("POST /api/v1/auth/change-account", () => {
	it("returns 401 before reading the body when not signed in", async () => {
		const res = await post("not json");
		expect(res.status).toBe(401);
	});

	it("returns 400 MISSING_CHILD_INDEX without a child", async () => {
		setSessionUser("u1");
		sessionDz();
		const res = await post({});
		expect(res.status).toBe(400);
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("MISSING_CHILD_INDEX");
	});

	it.each([["abc"], [-1], [1.5], [""]])("returns 400 INVALID_CHILD_INDEX for %j", async (child) => {
		setSessionUser("u1");
		sessionDz();
		const res = await post({ child });
		expect(res.status).toBe(400);
		expect((await readJson<{ error: { code: string } }>(res))?.error.code).toBe("INVALID_CHILD_INDEX");
		expect(prismaMock.deezerCredential.updateMany).not.toHaveBeenCalled();
	});

	it("persists the switched child account (was: lost on the next cold restore)", async () => {
		setSessionUser("u1");
		sessionDz();
		const res = await post({ child: "1" });
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { selectedAccount: number } }>(res);
		expect(body?.data.selectedAccount).toBe(1);
		expect(prismaMock.deezerCredential.updateMany).toHaveBeenCalledWith({
			where: { userId: "u1" },
			data: expect.objectContaining({ childAccount: 1, deezerUserId: 12, deezerUserName: "Kid" }),
		});
	});

	it("never returns the license token (was: user / childs carried license_token)", async () => {
		setSessionUser("u1");
		sessionDz();
		const res = await post({ child: 1 });
		const text = await res.text();
		expect(text).not.toContain("LT-SECRET");
		const body = JSON.parse(text);
		expect(body.data.user).toEqual({ id: 12, name: "Kid", can_stream_hq: true, can_stream_lossless: true });
		expect(body.data.childs).toHaveLength(2);
	});
});
