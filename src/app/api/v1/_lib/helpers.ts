import { NextRequest, NextResponse } from "next/server";
import { getDeemixApp, getUserDz, setUserDz, getGuestDz } from "@/lib/server-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

// ── Deezer session guard (requires better-auth + Deezer ARL) ──

export async function requireDeezer(request: NextRequest) {
	const userResult = await requireUser(request);
	if (userResult.error) return { userId: null as never, dz: null as never, error: userResult.error };

	const userId = userResult.userId;

	// Check in-memory session first
	let dz = getUserDz(userId);
	if (dz?.loggedIn) {
		return { userId, dz, error: null };
	}

	// Try to restore from stored ARL in database
	try {
		const cred = await prisma.deezerCredential.findUnique({
			where: { userId },
		});
		if (!cred) {
			return { userId: null as never, dz: null as never, error: fail("NO_DEEZER_ARL", "No Deezer account connected. Please add your ARL in Settings.", 403) };
		}

		const { Deezer } = await import("@/lib/deezer");
		dz = new Deezer();
		const loggedIn = await dz.loginViaArl(cred.arl);
		if (!loggedIn) {
			return { userId: null as never, dz: null as never, error: fail("DEEZER_LOGIN_FAILED", "Stored Deezer ARL is invalid. Please update it in Settings.", 401) };
		}

		setUserDz(userId, dz);
		return { userId, dz, error: null };
	} catch {
		return { userId: null as never, dz: null as never, error: fail("DEEZER_ERROR", "Failed to connect to Deezer.", 500) };
	}
}

// ── Combined: better-auth + Deezer + DeemixApp ──

export async function requireDeezerAndApp(request: NextRequest) {
	const deezerResult = await requireDeezer(request);
	if (deezerResult.error) return { userId: null as never, dz: null as never, app: null as never, error: deezerResult.error };

	const appResult = await requireApp();
	if (appResult.error) return { userId: null as never, dz: null as never, app: null as never, error: appResult.error };

	return { userId: deezerResult.userId, dz: deezerResult.dz, app: appResult.app, error: null };
}

// ── Combined: better-auth + DeemixApp (no Deezer required) ──

export async function requireUserAndApp(request: NextRequest) {
	const userResult = await requireUser(request);
	if (userResult.error) return { userId: null as never, app: null as never, error: userResult.error };

	const appResult = await requireApp();
	if (appResult.error) return { userId: null as never, app: null as never, error: appResult.error };

	return { userId: userResult.userId, app: appResult.app, error: null };
}

// ── App guard ──

export async function requireApp() {
	const deemixApp = await getDeemixApp();
	if (!deemixApp) {
		return { app: null as never, error: fail("APP_NOT_INITIALIZED", "Server application not initialized.", 500) };
	}
	return { app: deemixApp, error: null };
}

// ── Guest or user Deezer session (for search/browse routes) ──

export async function getGuestOrUserDz(request: NextRequest) {
	// Try authenticated user first
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (session?.user?.id) {
			const dz = getUserDz(session.user.id);
			if (dz?.loggedIn) return { dz, userId: session.user.id };

			// Try to restore from DB
			const cred = await prisma.deezerCredential.findUnique({
				where: { userId: session.user.id },
			});
			if (cred) {
				const { Deezer } = await import("@/lib/deezer");
				const newDz = new Deezer();
				const loggedIn = await newDz.loginViaArl(cred.arl);
				if (loggedIn) {
					setUserDz(session.user.id, newDz);
					return { dz: newDz, userId: session.user.id };
				}
			}
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

export function handleError(e: unknown) {
	const message = e instanceof Error ? e.message : "Unknown error";
	return fail("INTERNAL_ERROR", message, 500);
}
