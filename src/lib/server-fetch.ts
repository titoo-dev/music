import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Get the authenticated session server-side.
 * Works in server components and route handlers.
 */
export async function getServerSession() {
	const headersList = await headers();
	try {
		const session = await auth.api.getSession({ headers: headersList });
		return session;
	} catch {
		return null;
	}
}

/**
 * Server-side fetch for internal API routes.
 * Automatically forwards auth cookies.
 * Returns parsed data or null on failure.
 */
export async function serverFetch<T = unknown>(
	endpoint: string,
	params: Record<string, string> = {}
): Promise<T | null> {
	const cookieStore = await cookies();
	const allCookies = cookieStore.getAll();
	const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");

	const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
	const url = new URL(`/api/v1/${endpoint}`, baseUrl);
	Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

	try {
		const res = await fetch(url.toString(), {
			headers: { Cookie: cookieHeader },
			cache: "no-store",
		});

		if (!res.ok) return null;
		const json = await res.json();
		return json.success ? (json.data as T) : null;
	} catch {
		return null;
	}
}
