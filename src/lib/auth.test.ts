// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";
import { memoryAdapter } from "better-auth/adapters/memory";

// Real better-auth instance on an in-memory DB, so the bearer plugin's
// header → session conversion is exercised end to end.
const db: Record<string, unknown[]> = {
	user: [],
	session: [],
	account: [],
	verification: [],
};

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("better-auth/adapters/prisma", () => ({
	prismaAdapter: () => memoryAdapter(db),
}));

type Auth = typeof import("./auth").auth;
let auth: Auth;
let sessionToken: string;

beforeAll(async () => {
	vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-test-secret-test-secret-123");
	vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
	vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
	vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
	({ auth } = await import("./auth"));

	const ctx = await auth.$context;
	const user = await ctx.internalAdapter.createUser({
		name: "Flutter User",
		email: "flutter@example.com",
		emailVerified: true,
	});
	const session = await ctx.internalAdapter.createSession(user.id);
	sessionToken = session.token;
});

describe("auth bearer plugin", () => {
	it("resolves the session from an Authorization: Bearer header (was: native clients without cookies got NOT_AUTHENTICATED)", async () => {
		const session = await auth.api.getSession({
			headers: new Headers({ authorization: `Bearer ${sessionToken}` }),
		});
		expect(session?.user.email).toBe("flutter@example.com");
	});

	it("returns no session for an unknown bearer token", async () => {
		const session = await auth.api.getSession({
			headers: new Headers({ authorization: "Bearer not-a-real-token" }),
		});
		expect(session).toBeNull();
	});

	it("returns no session without any credentials", async () => {
		const session = await auth.api.getSession({ headers: new Headers() });
		expect(session).toBeNull();
	});
});

describe("auth error page (NAV-11)", () => {
	it("sends browser errors to /login (was: Better Auth's raw error page, outside the app)", async () => {
		const ctx = await auth.$context;
		expect(ctx.options.onAPIError?.errorURL).toBe("/login");
	});
});
