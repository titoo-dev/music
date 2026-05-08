import { vi } from "vitest";

/**
 * Mock for `@/lib/auth`. Configure the session per-test with `setSessionUser`.
 *
 * Usage:
 *
 *   import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
 *   vi.mock("@/lib/auth", () => ({ auth: authMock }));
 *
 *   setSessionUser("user-1");
 *   clearSession();
 */
export const authMock = {
	api: {
		getSession: vi.fn(async () => null as null | { user: { id: string } }),
	},
};

export function setSessionUser(userId: string) {
	authMock.api.getSession.mockResolvedValue({ user: { id: userId } });
}

export function clearSession() {
	authMock.api.getSession.mockResolvedValue(null);
}

export function failSession() {
	authMock.api.getSession.mockRejectedValue(new Error("session error"));
}
