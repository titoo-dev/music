import { NextResponse } from "next/server";
import { getDeemixApp, getSessionDZ } from "@/lib/server-state";

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

// ── Auth guard ──

export function requireAuth() {
	const sessionDZ = getSessionDZ();
	const dz = sessionDZ["default"];
	if (!dz?.loggedIn) {
		return { dz: null as never, error: fail("NOT_LOGGED_IN", "Authentication required. Please login first.", 401) };
	}
	return { dz, error: null };
}

// ── App guard ──

export async function requireApp() {
	const deemixApp = await getDeemixApp();
	if (!deemixApp) {
		return { app: null as never, error: fail("APP_NOT_INITIALIZED", "Server application not initialized.", 500) };
	}
	return { app: deemixApp, error: null };
}

// ── Combined auth + app guard ──

export async function requireAuthAndApp() {
	const auth = requireAuth();
	if (auth.error) return { dz: null as never, app: null as never, error: auth.error };

	const appResult = await requireApp();
	if (appResult.error) return { dz: null as never, app: null as never, error: appResult.error };

	return { dz: auth.dz, app: appResult.app, error: null };
}

// ── Error wrapper ──

export function handleError(e: unknown) {
	const message = e instanceof Error ? e.message : "Unknown error";
	return fail("INTERNAL_ERROR", message, 500);
}
