// @vitest-environment node
// Convex-only (Phase 6) : auth via @/lib/auth-server, credential Deezer via le
// repo Convex. Plus de Prisma.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	authServerMock,
	convexApiMock,
	setSessionUser,
	clearSession,
	failSession,
} from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);

const { credMock } = vi.hoisted(() => ({
	credMock: { getDeezerCredential: vi.fn() },
}));
vi.mock("@/lib/repositories/deezerCredentials", () => credMock);

const { serverStateMock, DeezerCtor, deezerInstances, deezerLoginBehavior } =
	vi.hoisted(() => {
		const serverStateMock = {
			getDeemixApp: vi.fn(),
			getUserDz: vi.fn(),
			setUserDz: vi.fn(),
			getGuestDz: vi.fn(),
		};
		const deezerInstances: Array<{
			loginViaArl: ReturnType<typeof vi.fn>;
			loggedIn: boolean;
		}> = [];
		const deezerLoginBehavior: { next: "ok" | "fail" | "throw" } = { next: "ok" };
		const DeezerCtor = vi.fn(function () {
			const behavior = deezerLoginBehavior.next;
			deezerLoginBehavior.next = "ok";
			const loginViaArl = vi.fn(async (_arl: string) => {
				if (behavior === "throw") throw new Error("network down");
				return behavior === "ok";
			});
			const instance = { loginViaArl, loggedIn: false };
			deezerInstances.push(instance);
			return instance;
		});
		return { serverStateMock, DeezerCtor, deezerInstances, deezerLoginBehavior };
	});

vi.mock("@/lib/server-state", () => serverStateMock);
vi.mock("@/lib/deezer", () => ({ Deezer: DeezerCtor }));

import {
	ok,
	fail,
	requireUser,
	requireDeezer,
	requireApp,
	requireUserAndApp,
	requireDeezerAndApp,
	getGuestOrUserDz,
	handleError,
} from "./helpers";

beforeEach(() => {
	clearSession();
	credMock.getDeezerCredential.mockReset();
	Object.values(serverStateMock).forEach((m) => m.mockReset());
	DeezerCtor.mockClear();
	deezerInstances.length = 0;
	deezerLoginBehavior.next = "ok";
});

describe("ok()", () => {
	it("returns 200 by default", () => {
		expect(ok({ hello: "world" }).status).toBe(200);
	});
	it("wraps payload in { success: true, data }", async () => {
		const body = await readJson(ok({ hello: "world" }));
		expect(body).toEqual({ success: true, data: { hello: "world" } });
	});
	it("emits Cache-Control: no-store", () => {
		expect(ok({ a: 1 }).headers.get("Cache-Control")).toBe("no-store");
	});
	it("honors a custom status code", async () => {
		const res = ok({ ok: true }, 201);
		expect(res.status).toBe(201);
	});
	it("supports null payloads", async () => {
		const body = await readJson(ok(null));
		expect(body).toEqual({ success: true, data: null });
	});
});

describe("fail()", () => {
	it("defaults to 400", () => {
		expect(fail("BAD", "no good").status).toBe(400);
	});
	it("wraps in { success:false, error }", async () => {
		const body = await readJson(fail("BAD", "no good"));
		expect(body).toEqual({ success: false, error: { code: "BAD", message: "no good" } });
	});
	it("honors custom status", () => {
		expect(fail("NOT_FOUND", "missing", 404).status).toBe(404);
	});
});

describe("requireUser()", () => {
	it("returns userId + session when authenticated", async () => {
		setSessionUser("u1");
		const result = await requireUser(makeNextRequest());
		expect(result.error).toBeNull();
		expect(result.userId).toBe("u1");
		expect(result.session).toMatchObject({ user: { _id: "u1" } });
	});
	it("returns 401 NOT_AUTHENTICATED when no session", async () => {
		const result = await requireUser(makeNextRequest());
		expect(result.error!.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});
	it("returns 401 when the Convex user has no _id", async () => {
		setSessionUser("u1");
		authServerMock.fetchAuthQuery.mockResolvedValueOnce({} as never);
		const result = await requireUser(makeNextRequest());
		expect(result.error!.status).toBe(401);
	});
	it("returns 500 AUTH_ERROR when token lookup throws", async () => {
		failSession();
		const result = await requireUser(makeNextRequest());
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("AUTH_ERROR");
	});
});

describe("requireDeezer()", () => {
	it("propagates 401 when not authenticated", async () => {
		const result = await requireDeezer(makeNextRequest());
		expect(result.error!.status).toBe(401);
	});
	it("reuses cached dz when loggedIn (no DB lookup)", async () => {
		setSessionUser("u1");
		const cachedDz = { loggedIn: true };
		serverStateMock.getUserDz.mockReturnValue(cachedDz);
		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeNull();
		expect(result.dz).toBe(cachedDz);
		expect(credMock.getDeezerCredential).not.toHaveBeenCalled();
		expect(DeezerCtor).not.toHaveBeenCalled();
	});
	it("loads ARL and logs in when no cached dz", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue({ arl: "stored-arl" });
		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeNull();
		expect(deezerInstances[0].loginViaArl).toHaveBeenCalledWith("stored-arl");
		expect(serverStateMock.setUserDz).toHaveBeenCalledWith("u1", deezerInstances[0]);
	});
	it("returns 403 NO_DEEZER_ARL when no credential", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue(null);
		const result = await requireDeezer(makeNextRequest());
		expect(result.error!.status).toBe(403);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NO_DEEZER_ARL");
	});
	it("returns 401 DEEZER_LOGIN_FAILED when login returns false", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue({ arl: "bad-arl" });
		deezerLoginBehavior.next = "fail";
		const result = await requireDeezer(makeNextRequest());
		expect(result.error!.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("DEEZER_LOGIN_FAILED");
	});
	it("returns 500 DEEZER_ERROR when the repo throws", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockRejectedValue(new Error("db down"));
		const result = await requireDeezer(makeNextRequest());
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("DEEZER_ERROR");
	});
	it("returns 500 DEEZER_ERROR when login throws", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue({ arl: "boom" });
		deezerLoginBehavior.next = "throw";
		const result = await requireDeezer(makeNextRequest());
		expect(result.error!.status).toBe(500);
	});
});

describe("requireApp()", () => {
	it("returns the app when initialized", async () => {
		const fakeApp = { id: "app" };
		serverStateMock.getDeemixApp.mockResolvedValue(fakeApp);
		const result = await requireApp();
		expect(result.error).toBeNull();
		expect(result.app).toBe(fakeApp);
	});
	it("returns 500 APP_NOT_INITIALIZED when null", async () => {
		serverStateMock.getDeemixApp.mockResolvedValue(null);
		const result = await requireApp();
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("APP_NOT_INITIALIZED");
	});
});

describe("requireUserAndApp()", () => {
	it("returns userId + app on happy path", async () => {
		setSessionUser("u1");
		const fakeApp = { id: "app" };
		serverStateMock.getDeemixApp.mockResolvedValue(fakeApp);
		const result = await requireUserAndApp(makeNextRequest());
		expect(result.userId).toBe("u1");
		expect(result.app).toBe(fakeApp);
	});
	it("returns auth error when not authed (skips getDeemixApp)", async () => {
		const result = await requireUserAndApp(makeNextRequest());
		expect(result.error!.status).toBe(401);
		expect(serverStateMock.getDeemixApp).not.toHaveBeenCalled();
	});
	it("returns 500 when authed but app null", async () => {
		setSessionUser("u1");
		serverStateMock.getDeemixApp.mockResolvedValue(null);
		const result = await requireUserAndApp(makeNextRequest());
		expect(result.error!.status).toBe(500);
	});
});

describe("requireDeezerAndApp()", () => {
	it("returns userId + dz + app (cached dz)", async () => {
		setSessionUser("u1");
		const cachedDz = { loggedIn: true };
		const fakeApp = { id: "app" };
		serverStateMock.getUserDz.mockReturnValue(cachedDz);
		serverStateMock.getDeemixApp.mockResolvedValue(fakeApp);
		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.dz).toBe(cachedDz);
		expect(result.app).toBe(fakeApp);
	});
	it("propagates Deezer error and skips getDeemixApp", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue(null);
		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.error!.status).toBe(403);
		expect(serverStateMock.getDeemixApp).not.toHaveBeenCalled();
	});
	it("returns 500 when Deezer ok but app null", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue({ loggedIn: true });
		serverStateMock.getDeemixApp.mockResolvedValue(null);
		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.error!.status).toBe(500);
	});
	it("propagates auth error first", async () => {
		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.error!.status).toBe(401);
		expect(serverStateMock.getDeemixApp).not.toHaveBeenCalled();
	});
});

describe("getGuestOrUserDz()", () => {
	it("returns cached user dz when authed + loggedIn", async () => {
		setSessionUser("u1");
		const cachedDz = { loggedIn: true };
		serverStateMock.getUserDz.mockReturnValue(cachedDz);
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(cachedDz);
		expect(result.userId).toBe("u1");
		expect(serverStateMock.getGuestDz).not.toHaveBeenCalled();
	});
	it("restores from stored ARL and caches", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue({ arl: "stored-arl" });
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.userId).toBe("u1");
		expect(result.dz).toBe(deezerInstances[0]);
		expect(serverStateMock.setUserDz).toHaveBeenCalledWith("u1", deezerInstances[0]);
	});
	it("falls back to guest when no stored ARL", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue(null);
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
	});
	it("falls back to guest when stored ARL fails to log in", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		credMock.getDeezerCredential.mockResolvedValue({ arl: "bad-arl" });
		deezerLoginBehavior.next = "fail";
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
	});
	it("falls back to guest when token lookup throws", async () => {
		failSession();
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
	});
	it("returns guest when not authenticated", async () => {
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
	});
	it("returns { dz:null, userId:null } when both fail", async () => {
		serverStateMock.getGuestDz.mockResolvedValue(null);
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBeNull();
		expect(result.userId).toBeNull();
	});
});

describe("handleError()", () => {
	it("wraps Error with message + INTERNAL_ERROR/500", async () => {
		const res = handleError(new Error("kaboom"));
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string; message: string } }>(res);
		expect(body?.error).toEqual({ code: "INTERNAL_ERROR", message: "kaboom" });
	});
	it("uses 'Unknown error' for non-Error values", async () => {
		const body = await readJson<{ error: { message: string } }>(handleError("oops"));
		expect(body?.error.message).toBe("Unknown error");
	});
	it("uses 'Unknown error' for null", async () => {
		const body = await readJson<{ error: { message: string } }>(handleError(null));
		expect(body?.error.message).toBe("Unknown error");
	});
	it("preserves subclassed Error messages", async () => {
		class MyErr extends Error {}
		const body = await readJson<{ error: { message: string } }>(
			handleError(new MyErr("subclass")),
		);
		expect(body?.error.message).toBe("subclass");
	});
});
