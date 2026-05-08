import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import {
	authMock,
	setSessionUser,
	clearSession,
	failSession,
} from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

// ── Mock setup ──

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

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
		// Per-instance login behavior — set before invoking the helper to control
		// the next `new Deezer()` call. Default: succeed.
		const deezerLoginBehavior: {
			next: "ok" | "fail" | "throw";
		} = { next: "ok" };
		const DeezerCtor = vi.fn(function () {
			const behavior = deezerLoginBehavior.next;
			// reset to default after consuming
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
	resetPrismaMock();
	clearSession();
	Object.values(serverStateMock).forEach((m) => m.mockReset());
	DeezerCtor.mockClear();
	deezerInstances.length = 0;
	deezerLoginBehavior.next = "ok";
});

// ────────────────────────────────────────────────────────────
// ok
// ────────────────────────────────────────────────────────────

describe("ok()", () => {
	it("returns 200 by default", async () => {
		const res = ok({ hello: "world" });
		expect(res.status).toBe(200);
	});

	it("wraps payload in { success: true, data }", async () => {
		const res = ok({ hello: "world" });
		const body = await readJson<{ success: boolean; data: { hello: string } }>(
			res
		);
		expect(body).toEqual({ success: true, data: { hello: "world" } });
	});

	it("emits Cache-Control: no-store", () => {
		const res = ok({ a: 1 });
		expect(res.headers.get("Cache-Control")).toBe("no-store");
	});

	it("honors a custom status code", async () => {
		const res = ok({ ok: true }, 201);
		expect(res.status).toBe(201);
		const body = await readJson<{ success: boolean; data: { ok: boolean } }>(
			res
		);
		expect(body?.data).toEqual({ ok: true });
	});

	it("supports null/empty data payloads", async () => {
		const res = ok(null);
		expect(res.status).toBe(200);
		const body = await readJson<{ success: boolean; data: null }>(res);
		expect(body).toEqual({ success: true, data: null });
	});
});

// ────────────────────────────────────────────────────────────
// fail
// ────────────────────────────────────────────────────────────

describe("fail()", () => {
	it("defaults to status 400", () => {
		const res = fail("BAD", "no good");
		expect(res.status).toBe(400);
	});

	it("wraps payload in { success: false, error: { code, message } }", async () => {
		const res = fail("BAD", "no good");
		const body = await readJson<{
			success: boolean;
			error: { code: string; message: string };
		}>(res);
		expect(body).toEqual({
			success: false,
			error: { code: "BAD", message: "no good" },
		});
	});

	it("honors custom status codes", () => {
		const res = fail("NOT_FOUND", "missing", 404);
		expect(res.status).toBe(404);
	});
});

// ────────────────────────────────────────────────────────────
// requireUser
// ────────────────────────────────────────────────────────────

describe("requireUser()", () => {
	it("returns userId + session when authenticated", async () => {
		setSessionUser("u1");
		const result = await requireUser(makeNextRequest());
		expect(result.error).toBeNull();
		expect(result.userId).toBe("u1");
		expect(result.session).toMatchObject({ user: { id: "u1" } });
	});

	it("returns 401 NOT_AUTHENTICATED when no session", async () => {
		const result = await requireUser(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});

	it("returns 401 NOT_AUTHENTICATED when session has no user.id", async () => {
		// Session present but missing user.id
		authMock.api.getSession.mockResolvedValueOnce({} as any);
		const result = await requireUser(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});

	it("returns 500 AUTH_ERROR when getSession throws", async () => {
		failSession();
		const result = await requireUser(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("AUTH_ERROR");
	});
});

// ────────────────────────────────────────────────────────────
// requireDeezer
// ────────────────────────────────────────────────────────────

describe("requireDeezer()", () => {
	it("propagates the 401 from requireUser when not authenticated", async () => {
		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});

	it("reuses the cached dz when loggedIn=true (no DB lookup)", async () => {
		setSessionUser("u1");
		const cachedDz = { loggedIn: true };
		serverStateMock.getUserDz.mockReturnValue(cachedDz);

		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeNull();
		expect(result.dz).toBe(cachedDz);
		expect(result.userId).toBe("u1");
		expect(prismaMock.deezerCredential.findUnique).not.toHaveBeenCalled();
		expect(serverStateMock.setUserDz).not.toHaveBeenCalled();
		expect(DeezerCtor).not.toHaveBeenCalled();
	});

	it("loads ARL from DB and logs in successfully when no cached dz", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue({
			userId: "u1",
			arl: "stored-arl",
		} as any);

		const result = await requireDeezer(makeNextRequest());

		expect(result.error).toBeNull();
		expect(result.userId).toBe("u1");
		expect(DeezerCtor).toHaveBeenCalledTimes(1);
		expect(deezerInstances[0].loginViaArl).toHaveBeenCalledWith("stored-arl");
		expect(serverStateMock.setUserDz).toHaveBeenCalledWith(
			"u1",
			deezerInstances[0]
		);
		expect(result.dz).toBe(deezerInstances[0]);
	});

	it("re-logs in when cached dz exists but loggedIn=false", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue({ loggedIn: false });
		prismaMock.deezerCredential.findUnique.mockResolvedValue({
			userId: "u1",
			arl: "stored-arl",
		} as any);

		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeNull();
		expect(DeezerCtor).toHaveBeenCalledTimes(1);
		expect(serverStateMock.setUserDz).toHaveBeenCalled();
	});

	it("returns 403 NO_DEEZER_ARL when no credential is stored", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue(null);

		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(403);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NO_DEEZER_ARL");
		expect(DeezerCtor).not.toHaveBeenCalled();
	});

	it("returns 401 DEEZER_LOGIN_FAILED when loginViaArl returns false", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue({
			userId: "u1",
			arl: "bad-arl",
		} as any);
		deezerLoginBehavior.next = "fail";

		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("DEEZER_LOGIN_FAILED");
		expect(serverStateMock.setUserDz).not.toHaveBeenCalled();
	});

	it("returns 500 DEEZER_ERROR when prisma throws", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockRejectedValue(
			new Error("db down")
		);

		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("DEEZER_ERROR");
	});

	it("returns 500 DEEZER_ERROR when loginViaArl throws", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue({
			userId: "u1",
			arl: "boom",
		} as any);
		deezerLoginBehavior.next = "throw";

		const result = await requireDeezer(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("DEEZER_ERROR");
	});
});

// ────────────────────────────────────────────────────────────
// requireApp
// ────────────────────────────────────────────────────────────

describe("requireApp()", () => {
	it("returns the app when initialized", async () => {
		const fakeApp = { id: "app" };
		serverStateMock.getDeemixApp.mockResolvedValue(fakeApp);
		const result = await requireApp();
		expect(result.error).toBeNull();
		expect(result.app).toBe(fakeApp);
	});

	it("returns 500 APP_NOT_INITIALIZED when app is null", async () => {
		serverStateMock.getDeemixApp.mockResolvedValue(null);
		const result = await requireApp();
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("APP_NOT_INITIALIZED");
	});
});

// ────────────────────────────────────────────────────────────
// requireUserAndApp
// ────────────────────────────────────────────────────────────

describe("requireUserAndApp()", () => {
	it("returns userId + app on the happy path", async () => {
		setSessionUser("u1");
		const fakeApp = { id: "app" };
		serverStateMock.getDeemixApp.mockResolvedValue(fakeApp);

		const result = await requireUserAndApp(makeNextRequest());
		expect(result.error).toBeNull();
		expect(result.userId).toBe("u1");
		expect(result.app).toBe(fakeApp);
	});

	it("returns the auth error when not authenticated (does not call getDeemixApp)", async () => {
		const result = await requireUserAndApp(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
		expect(serverStateMock.getDeemixApp).not.toHaveBeenCalled();
	});

	it("returns 500 APP_NOT_INITIALIZED when authed but app is null", async () => {
		setSessionUser("u1");
		serverStateMock.getDeemixApp.mockResolvedValue(null);

		const result = await requireUserAndApp(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("APP_NOT_INITIALIZED");
	});
});

// ────────────────────────────────────────────────────────────
// requireDeezerAndApp
// ────────────────────────────────────────────────────────────

describe("requireDeezerAndApp()", () => {
	it("returns userId + dz + app on the happy path (cached dz)", async () => {
		setSessionUser("u1");
		const cachedDz = { loggedIn: true };
		const fakeApp = { id: "app" };
		serverStateMock.getUserDz.mockReturnValue(cachedDz);
		serverStateMock.getDeemixApp.mockResolvedValue(fakeApp);

		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.error).toBeNull();
		expect(result.userId).toBe("u1");
		expect(result.dz).toBe(cachedDz);
		expect(result.app).toBe(fakeApp);
	});

	it("propagates the Deezer error and skips getDeemixApp", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue(null);

		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(403);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("NO_DEEZER_ARL");
		expect(serverStateMock.getDeemixApp).not.toHaveBeenCalled();
	});

	it("returns 500 APP_NOT_INITIALIZED when Deezer ok but app is null", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue({ loggedIn: true });
		serverStateMock.getDeemixApp.mockResolvedValue(null);

		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(result.error!);
		expect(body?.error.code).toBe("APP_NOT_INITIALIZED");
	});

	it("propagates the auth error before touching Deezer or app", async () => {
		const result = await requireDeezerAndApp(makeNextRequest());
		expect(result.error).toBeTruthy();
		expect(result.error!.status).toBe(401);
		expect(prismaMock.deezerCredential.findUnique).not.toHaveBeenCalled();
		expect(serverStateMock.getDeemixApp).not.toHaveBeenCalled();
	});
});

// ────────────────────────────────────────────────────────────
// getGuestOrUserDz
// ────────────────────────────────────────────────────────────

describe("getGuestOrUserDz()", () => {
	it("returns the cached user dz when authed and loggedIn", async () => {
		setSessionUser("u1");
		const cachedDz = { loggedIn: true };
		serverStateMock.getUserDz.mockReturnValue(cachedDz);

		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(cachedDz);
		expect(result.userId).toBe("u1");
		expect(serverStateMock.getGuestDz).not.toHaveBeenCalled();
		expect(prismaMock.deezerCredential.findUnique).not.toHaveBeenCalled();
	});

	it("restores from stored ARL and caches it when authed but no in-memory dz", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue({
			userId: "u1",
			arl: "stored-arl",
		} as any);

		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.userId).toBe("u1");
		expect(result.dz).toBe(deezerInstances[0]);
		expect(deezerInstances[0].loginViaArl).toHaveBeenCalledWith("stored-arl");
		expect(serverStateMock.setUserDz).toHaveBeenCalledWith(
			"u1",
			deezerInstances[0]
		);
		expect(serverStateMock.getGuestDz).not.toHaveBeenCalled();
	});

	it("falls back to guest when authed user has no stored ARL", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue(null);
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);

		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
	});

	it("falls back to guest when authed user's stored ARL fails to log in", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue({
			userId: "u1",
			arl: "bad-arl",
		} as any);
		deezerLoginBehavior.next = "fail";
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);

		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
		expect(serverStateMock.setUserDz).not.toHaveBeenCalled();
	});

	it("falls back to guest when getSession throws", async () => {
		failSession();
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);

		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
	});

	it("returns guest when not authenticated at all", async () => {
		const guestDz = { id: "guest" };
		serverStateMock.getGuestDz.mockResolvedValue(guestDz);

		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBe(guestDz);
		expect(result.userId).toBeNull();
		expect(prismaMock.deezerCredential.findUnique).not.toHaveBeenCalled();
	});

	it("returns { dz: null, userId: null } when both user-dz and guest fail", async () => {
		serverStateMock.getGuestDz.mockResolvedValue(null);
		const result = await getGuestOrUserDz(makeNextRequest());
		expect(result.dz).toBeNull();
		expect(result.userId).toBeNull();
	});
});

// ────────────────────────────────────────────────────────────
// handleError
// ────────────────────────────────────────────────────────────

describe("handleError()", () => {
	it("wraps Error instances with their message and INTERNAL_ERROR/500", async () => {
		const res = handleError(new Error("kaboom"));
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string; message: string } }>(
			res
		);
		expect(body?.error).toEqual({
			code: "INTERNAL_ERROR",
			message: "kaboom",
		});
	});

	it("uses 'Unknown error' for non-Error values", async () => {
		const res = handleError("string oops");
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string; message: string } }>(
			res
		);
		expect(body?.error).toEqual({
			code: "INTERNAL_ERROR",
			message: "Unknown error",
		});
	});

	it("uses 'Unknown error' for null/undefined", async () => {
		const res = handleError(null);
		const body = await readJson<{ error: { message: string } }>(res);
		expect(body?.error.message).toBe("Unknown error");
	});

	it("preserves subclassed Error messages", async () => {
		class MyErr extends Error {}
		const res = handleError(new MyErr("subclass"));
		const body = await readJson<{ error: { message: string } }>(res);
		expect(body?.error.message).toBe("subclass");
	});
});
