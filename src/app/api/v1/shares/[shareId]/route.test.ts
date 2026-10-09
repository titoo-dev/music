import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

import { GET, DELETE } from "./route";

type Body = { data: Record<string, unknown>; error: { code: string } };

const params = makeParams({ shareId: "abc" });

beforeEach(() => {
	resetPrismaMock();
	clearSession();
});

describe("GET /api/v1/shares/[shareId] (public)", () => {
	it("shows only the sharer's name (was: their profile picture URL went to anyone with the link)", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue({ shareId: "abc", title: "Nofy", expiresAt: null, user: { name: "Tito" } } as never);
		const res = await GET(makeNextRequest(), params);
		expect(res.status).toBe(200);
		const select = prismaMock.sharedTrack.findUnique.mock.calls[0][0].select as Record<string, unknown>;
		expect(select.user).toEqual({ select: { name: true } });
		expect(select.userId).toBeUndefined();
	});

	it("answers 404 for an unknown link and 410 for an expired one", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(null);
		expect((await GET(makeNextRequest(), params)).status).toBe(404);
		prismaMock.sharedTrack.findUnique.mockResolvedValue({ shareId: "abc", expiresAt: new Date(Date.now() - 1000) } as never);
		const res = await GET(makeNextRequest(), params);
		expect(res.status).toBe(410);
		expect((await readJson<Body>(res))?.error.code).toBe("EXPIRED");
	});
});

describe("DELETE /api/v1/shares/[shareId]", () => {
	it("requires a session", async () => {
		expect((await DELETE(makeNextRequest({ method: "DELETE" }), params)).status).toBe(401);
	});

	it("lets only the owner revoke", async () => {
		setSessionUser("u2");
		prismaMock.sharedTrack.findUnique.mockResolvedValue({ shareId: "abc", userId: "u1" } as never);
		expect((await DELETE(makeNextRequest({ method: "DELETE" }), params)).status).toBe(403);
		expect(prismaMock.sharedTrack.delete).not.toHaveBeenCalled();

		setSessionUser("u1");
		const res = await DELETE(makeNextRequest({ method: "DELETE" }), params);
		expect(res.status).toBe(200);
		expect(prismaMock.sharedTrack.delete).toHaveBeenCalledWith({ where: { shareId: "abc" } });
	});

	it("answers 404 for an unknown link", async () => {
		setSessionUser("u1");
		prismaMock.sharedTrack.findUnique.mockResolvedValue(null);
		expect((await DELETE(makeNextRequest({ method: "DELETE" }), params)).status).toBe(404);
	});
});
