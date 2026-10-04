import { NextRequest, NextResponse } from "next/server";
import { getWaveletApp, getGuestDz } from "@/lib/server-state";
import { auth } from "@/lib/auth";
import { restoreUserDz } from "@/lib/deezer-session";
import { describeErrorForLog } from "@/lib/log-safe";

// ── Consistent response envelope ──

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: { code: string; message: string };
}

export function ok<T>(data: T, status = 200) {
	return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

export function fail(code: string, message: string, status = 400) {
	return NextResponse.json(
		{ success: false, error: { code, message } } satisfies ApiResponse,
		{ status }
	);
}

/**
 * Read a JSON object body. A missing, malformed or non-object body is the
 * client's mistake: 400 INVALID_BODY instead of the parser's 500.
 */
export async function readJsonBody<T extends Record<string, unknown> = Record<string, unknown>>(
	request: Request
): Promise<{ body: T; error: null } | { body: null; error: NextResponse }> {
	try {
		const body: unknown = await request.json();
		if (body && typeof body === "object" && !Array.isArray(body)) return { body: body as T, error: null };
	} catch {
		// fall through
	}
	return { body: null, error: fail("INVALID_BODY", "Expected a JSON object body.", 400) };
}

// ── Better-auth session guard ──

export async function requireUser(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return { userId: null as never, session: null as never, error: fail("NOT_AUTHENTICATED", "Please sign in to continue.", 401) };
		}
		return { userId: session.user.id, session, error: null };
	} catch {
		return { userId: null as never, session: null as never, error: fail("AUTH_ERROR", "Failed to validate session.", 500) };
	}
}

// ── Admin guard (server-wide settings) ──

/** The lower-cased emails listed in WAVELET_ADMIN_EMAILS (comma separated); empty when unset. */
export function adminEmails(env: Record<string, string | undefined> = process.env): string[] {
	return (env.WAVELET_ADMIN_EMAILS ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
}

/**
 * A signed-in user allowed to change server-wide settings. When
 * WAVELET_ADMIN_EMAILS lists emails, only those (case-insensitive) pass and
 * everyone else gets 403 FORBIDDEN; when it is unset or empty, any signed-in
 * user passes.
 */
export async function requireAdmin(request: NextRequest) {
	const userResult = await requireUser(request);
	if (userResult.error) return userResult;

	const admins = adminEmails();
	if (admins.length === 0) return userResult;

	const email = userResult.session.user.email?.trim().toLowerCase();
	if (!email || !admins.includes(email)) {
		return { userId: null as never, session: null as never, error: fail("FORBIDDEN", "Only an administrator can change this setting.", 403) };
	}
	return userResult;
}

// ── Deezer session guard (requires better-auth + Deezer ARL) ──

export async function requireDeezer(request: NextRequest) {
	const userResult = await requireUser(request);
	if (userResult.error) return { userId: null as never, dz: null as never, error: userResult.error };

	const userId = userResult.userId;

	// In-memory session, else one shared (single-flight) login with the stored ARL.
	const restored = await restoreUserDz(userId);
	switch (restored.status) {
		case "ok":
			return { userId, dz: restored.dz, error: null };
		case "no-arl":
			return { userId: null as never, dz: null as never, error: fail("NO_DEEZER_ARL", "No Deezer account connected. Please add your ARL in Settings.", 403) };
		case "login-failed":
			return { userId: null as never, dz: null as never, error: fail("DEEZER_LOGIN_FAILED", "Stored Deezer ARL is invalid. Please update it in Settings.", 401) };
		default:
			console.error("[requireDeezer] Deezer session restore failed:", describeErrorForLog(restored.error));
			return { userId: null as never, dz: null as never, error: fail("DEEZER_ERROR", "Failed to connect to Deezer.", 500) };
	}
}

// ── Combined: better-auth + Deezer + WaveletApp ──

export async function requireDeezerAndApp(request: NextRequest) {
	const deezerResult = await requireDeezer(request);
	if (deezerResult.error) return { userId: null as never, dz: null as never, app: null as never, error: deezerResult.error };

	const appResult = await requireApp();
	if (appResult.error) return { userId: null as never, dz: null as never, app: null as never, error: appResult.error };

	return { userId: deezerResult.userId, dz: deezerResult.dz, app: appResult.app, error: null };
}

// ── Combined: better-auth + WaveletApp (no Deezer required) ──

export async function requireUserAndApp(request: NextRequest) {
	const userResult = await requireUser(request);
	if (userResult.error) return { userId: null as never, app: null as never, error: userResult.error };

	const appResult = await requireApp();
	if (appResult.error) return { userId: null as never, app: null as never, error: appResult.error };

	return { userId: userResult.userId, app: appResult.app, error: null };
}

// ── App guard ──

export async function requireApp() {
	const waveletApp = await getWaveletApp();
	if (!waveletApp) {
		return { app: null as never, error: fail("APP_NOT_INITIALIZED", "Server application not initialized.", 500) };
	}
	return { app: waveletApp, error: null };
}

// ── Guest or user Deezer session (for search/browse routes) ──

export async function getGuestOrUserDz(request: NextRequest) {
	// Try authenticated user first
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (session?.user?.id) {
			// Cached session or the shared restore from the stored ARL.
			const restored = await restoreUserDz(session.user.id);
			if (restored.status === "ok") return { dz: restored.dz, userId: session.user.id };
		}
	} catch {
		// Fall through to guest
	}

	// Fall back to guest Deezer
	const guestDz = await getGuestDz();
	if (guestDz) return { dz: guestDz, userId: null };

	return { dz: null, userId: null };
}

// ── Error wrapper ──

/**
 * 500 INTERNAL_ERROR with a generic message: internal error text (Prisma,
 * Deezer, R2 — hosts, tables, sometimes tokens) is only logged server-side,
 * as name / message / stack with URL queries masked (never the raw object: a
 * got error carries its request options, license_token and cookie jar included).
 */
export function handleError(e: unknown) {
	console.error("[api] unhandled error:", describeErrorForLog(e));
	return fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
