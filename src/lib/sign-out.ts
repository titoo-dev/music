import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Signs out of the Deezer session and the app session, in that order (the
 * Deezer logout route needs the session cookie to know whose session to
 * drop). The local state is only cleared once the server agreed, so the UI
 * never says "signed out" while the session is still valid.
 *
 * Resolves `true` when signed out, `false` when it failed (show an error).
 */
export async function signOutEverywhere(): Promise<boolean> {
	try {
		await fetch("/api/v1/auth/logout", { method: "POST" });
	} catch {
		// The Deezer session expires on its own; the app sign-out still matters.
	}
	try {
		const res = await authClient.signOut();
		if (res?.error) return false;
	} catch {
		return false;
	}
	useAuthStore.getState().logout();
	return true;
}
