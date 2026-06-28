import { vi } from "vitest";

/**
 * Mocks d'authentification. Depuis la Phase 6 (auth Convex), les guards
 * (`requireUser`/`getGuestOrUserDz`) utilisent `@/lib/auth-server`
 * (getToken + fetchAuthQuery) ; on garde aussi `authMock` (`@/lib/auth`) par
 * compat. Les helpers ci-dessous configurent les DEUX.
 *
 * Usage (route test) :
 *   import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
 *   vi.mock("@/lib/auth-server", () => authServerMock);
 *   vi.mock("@convex/_generated/api", () => convexApiMock);
 *   setSessionUser("user-1");
 */
export const authMock = {
	api: {
		getSession: vi.fn(async () => null as null | { user: { id: string } }),
	},
};

// Mock de @/lib/auth-server (helpers Convex Better Auth côté Next).
export const authServerMock = {
	getToken: vi.fn(async () => undefined as string | undefined),
	fetchAuthQuery: vi.fn(async () => null as null | { _id: string }),
	fetchAuthMutation: vi.fn(async () => null),
	fetchAuthAction: vi.fn(async () => null),
	isAuthenticated: vi.fn(async () => false),
	preloadAuthQuery: vi.fn(),
	handler: { GET: vi.fn(), POST: vi.fn() },
};

// Mock de @convex/_generated/api (les références sont ignorées par les mocks).
export const convexApiMock = {
	api: { auth: { getCurrentUser: "auth:getCurrentUser" } },
};

export function setSessionUser(userId: string) {
	authMock.api.getSession.mockResolvedValue({ user: { id: userId } });
	authServerMock.getToken.mockResolvedValue("tok");
	authServerMock.fetchAuthQuery.mockResolvedValue({ _id: userId });
	authServerMock.isAuthenticated.mockResolvedValue(true);
}

export function clearSession() {
	authMock.api.getSession.mockResolvedValue(null);
	authServerMock.getToken.mockResolvedValue(undefined);
	authServerMock.fetchAuthQuery.mockResolvedValue(null);
	authServerMock.isAuthenticated.mockResolvedValue(false);
}

export function failSession() {
	authMock.api.getSession.mockRejectedValue(new Error("session error"));
	authServerMock.getToken.mockRejectedValue(new Error("session error"));
}
