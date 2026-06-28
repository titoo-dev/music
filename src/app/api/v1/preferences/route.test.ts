// @vitest-environment node
// Convex-only (Phase 6) : la route délègue au repo userPreferences (Convex) et
// l'auth passe par @/lib/auth-server. On mocke ces frontières (pas Prisma).
// TEMPLATE de conversion des tests de routes post-Phase-6.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	authServerMock,
	convexApiMock,
	setSessionUser,
	clearSession,
} from "@/test/helpers/mockAuth";
import { makeNextRequest, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);

const { prefsRepo } = vi.hoisted(() => ({
	prefsRepo: {
		getUserPreferences: vi.fn(),
		upsertUserPreferences: vi.fn(),
	},
}));
vi.mock("@/lib/repositories/userPreferences", () => prefsRepo);

import { GET, PATCH } from "./route";

beforeEach(() => {
	clearSession();
	prefsRepo.getUserPreferences.mockReset();
	prefsRepo.upsertUserPreferences.mockReset();
});

describe("GET /api/v1/preferences", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});

	it("returns the user's preferences when present", async () => {
		setSessionUser("u1");
		prefsRepo.getUserPreferences.mockResolvedValue({
			playlistSortOrder: "asc",
			preCacheSaved: true,
		});
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(200);
		const body = await readJson<{ data: object }>(res);
		expect(body?.data).toEqual({ playlistSortOrder: "asc", preCacheSaved: true });
		expect(prefsRepo.getUserPreferences).toHaveBeenCalledWith("u1");
	});

	it("returns an empty object when no preferences exist", async () => {
		setSessionUser("u1");
		prefsRepo.getUserPreferences.mockResolvedValue(null);
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(200);
		const body = await readJson<{ data: object }>(res);
		expect(body?.data).toEqual({});
	});

	it("returns 500 INTERNAL_ERROR when the repo throws", async () => {
		setSessionUser("u1");
		prefsRepo.getUserPreferences.mockRejectedValue(new Error("db down"));
		const res = await GET(makeNextRequest());
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string; message: string } }>(res);
		expect(body?.error.code).toBe("INTERNAL_ERROR");
		expect(body?.error.message).toBe("db down");
	});
});

describe("PATCH /api/v1/preferences", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { playlistSortOrder: "asc" } })
		);
		expect(res.status).toBe(401);
	});

	it("rejects unknown keys with 400 INVALID_KEY", async () => {
		setSessionUser("u1");
		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { hackerKey: "yes" } })
		);
		expect(res.status).toBe(400);
		const body = await readJson<{ error: { code: string; message: string } }>(res);
		expect(body?.error.code).toBe("INVALID_KEY");
		expect(body?.error.message).toContain("hackerKey");
		expect(prefsRepo.upsertUserPreferences).not.toHaveBeenCalled();
	});

	it("merges updates into existing preferences and upserts", async () => {
		setSessionUser("u1");
		prefsRepo.getUserPreferences.mockResolvedValue({
			playlistSortOrder: "asc",
			preCacheSaved: false,
		});
		const merged = { playlistSortOrder: "desc", preCacheSaved: false };
		prefsRepo.upsertUserPreferences.mockResolvedValue(merged);
		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { playlistSortOrder: "desc" } })
		);
		expect(res.status).toBe(200);
		expect(prefsRepo.upsertUserPreferences).toHaveBeenCalledWith("u1", merged);
		const body = await readJson<{ data: object }>(res);
		expect(body?.data).toEqual(merged);
	});

	it("creates with just the updates when no existing prefs", async () => {
		setSessionUser("u1");
		prefsRepo.getUserPreferences.mockResolvedValue(null);
		prefsRepo.upsertUserPreferences.mockResolvedValue({ albumSortOrder: "desc" });
		await PATCH(
			makeNextRequest({ method: "PATCH", body: { albumSortOrder: "desc" } })
		);
		expect(prefsRepo.upsertUserPreferences).toHaveBeenCalledWith("u1", {
			albumSortOrder: "desc",
		});
	});

	it("accepts all allowed keys", async () => {
		setSessionUser("u1");
		prefsRepo.getUserPreferences.mockResolvedValue(null);
		prefsRepo.upsertUserPreferences.mockResolvedValue({});
		const res = await PATCH(
			makeNextRequest({
				method: "PATCH",
				body: {
					playlistSortOrder: "desc",
					albumSortOrder: "asc",
					preCacheSaved: true,
				},
			})
		);
		expect(res.status).toBe(200);
	});

	it("returns 500 INTERNAL_ERROR when upsert throws", async () => {
		setSessionUser("u1");
		prefsRepo.getUserPreferences.mockResolvedValue(null);
		prefsRepo.upsertUserPreferences.mockRejectedValue(new Error("write fail"));
		const res = await PATCH(
			makeNextRequest({ method: "PATCH", body: { playlistSortOrder: "desc" } })
		);
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("INTERNAL_ERROR");
	});
});
