import { describe, it, expect, vi, beforeEach } from "vitest";

const signOut = vi.fn();
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: () => signOut() } }));

import { signOutEverywhere } from "./sign-out";
import { useAuthStore } from "@/stores/useAuthStore";

const calls: string[] = [];
beforeEach(() => {
	calls.length = 0;
	signOut.mockReset().mockImplementation(async () => {
		calls.push("signOut");
		return { data: { success: true }, error: null };
	});
	vi.stubGlobal(
		"fetch",
		vi.fn(async (url: string) => {
			calls.push(String(url));
			return new Response("{}");
		})
	);
	useAuthStore.setState({ user: { id: "u", name: "A", email: "a@b.c" } as never, isAuthenticated: true });
});

describe("signOutEverywhere", () => {
	it("clears the Deezer session before the auth session is gone (NAV-09, was: logout route ran without a session)", async () => {
		await signOutEverywhere();
		expect(calls).toEqual(["/api/v1/auth/logout", "signOut"]);
	});

	it("signs out locally once the server agreed", async () => {
		await expect(signOutEverywhere()).resolves.toBe(true);
		expect(useAuthStore.getState().isAuthenticated).toBe(false);
	});

	it("keeps the user signed in when the server refuses (NAV-08, was: UI said signed out, session still valid)", async () => {
		signOut.mockResolvedValue({ data: null, error: { message: "boom", status: 500 } });
		await expect(signOutEverywhere()).resolves.toBe(false);
		expect(useAuthStore.getState().isAuthenticated).toBe(true);
	});

	it("reports a network failure instead of throwing (NAV-08, was: unhandled rejection, no feedback)", async () => {
		signOut.mockRejectedValue(new TypeError("Failed to fetch"));
		await expect(signOutEverywhere()).resolves.toBe(false);
		expect(useAuthStore.getState().isAuthenticated).toBe(true);
	});

	it("still signs out when the Deezer logout call fails", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
		await expect(signOutEverywhere()).resolves.toBe(true);
	});
});
