// Server-side singleton state for the DeemixApp
// This module is only imported in API routes (server-side)

import type { Listener } from "@/lib/deemix/types/listener";

// ── Per-user Deezer session with TTL eviction ──

interface DzSession {
	dz: any;
	lastAccess: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const globalForDeemix = globalThis as unknown as {
	deemixApp: any;
	sessionDZ: Map<string, DzSession>;
	guestDZ: any;
	initialized: boolean;
};

/** Get a per-user Deezer session map (keyed by better-auth user ID) */
export function getSessionDZ(): Map<string, DzSession> {
	if (!globalForDeemix.sessionDZ) {
		globalForDeemix.sessionDZ = new Map();
	}
	return globalForDeemix.sessionDZ;
}

/** Retrieve the Deezer instance for a specific user, refreshing TTL */
export function getUserDz(userId: string): any | null {
	const sessions = getSessionDZ();
	const entry = sessions.get(userId);
	if (!entry) return null;
	entry.lastAccess = Date.now();
	return entry.dz;
}

/** Store a Deezer instance for a specific user */
export function setUserDz(userId: string, dz: any): void {
	const sessions = getSessionDZ();
	sessions.set(userId, { dz, lastAccess: Date.now() });
	evictStaleSessions();
}

/** Remove a Deezer session for a specific user */
export function removeUserDz(userId: string): void {
	getSessionDZ().delete(userId);
}

/**
 * Resolve a Deezer session for a specific user — uses the in-memory cache
 * if available, otherwise logs in fresh with the user's stored ARL.
 * Used by routes that act on behalf of a user (e.g. public share playback
 * falling back to progressive re-stream with the share creator's ARL).
 */
export async function getOrLoginUserDz(userId: string): Promise<any | null> {
	const cached = getUserDz(userId);
	if (cached?.loggedIn) return cached;

	try {
		const { prisma } = await import("@/lib/prisma");
		const cred = await prisma.deezerCredential.findUnique({
			where: { userId },
		});
		if (!cred) return null;

		const { Deezer } = await import("@/lib/deezer");
		const dz = new Deezer();
		const loggedIn = await dz.loginViaArl(cred.arl);
		if (!loggedIn) return null;

		setUserDz(userId, dz);
		return dz;
	} catch {
		return null;
	}
}

/** Get or create a shared guest Deezer session (for browsing without auth) */
export async function getGuestDz(): Promise<any | null> {
	if (globalForDeemix.guestDZ?.loggedIn) return globalForDeemix.guestDZ;

	const serviceArl = process.env.DEEMIX_SERVICE_ARL;
	if (!serviceArl) return null;

	try {
		const { Deezer } = await import("@/lib/deezer");
		const dz = new Deezer();
		const loggedIn = await dz.loginViaArl(serviceArl);
		if (loggedIn) {
			globalForDeemix.guestDZ = dz;
			return dz;
		}
	} catch {
		// Guest Deezer unavailable
	}
	return null;
}

function evictStaleSessions() {
	const sessions = getSessionDZ();
	const now = Date.now();
	for (const [userId, entry] of sessions) {
		if (now - entry.lastAccess > SESSION_TTL_MS) {
			sessions.delete(userId);
		}
	}
}

// ── DeemixApp singleton ──

let _deemixApp: any = null;
let _initPromise: Promise<any> | null = null;

export async function getDeemixApp() {
	if (_deemixApp) return _deemixApp;
	if (!_initPromise) {
		_initPromise = initializeDeemixApp().then((app) => {
			_deemixApp = app;
			return app;
		});
	}
	return _initPromise;
}

async function initializeDeemixApp() {
	// Dynamic import to avoid issues during build
	try {
		const { createConfigStore } = await import(
			"@/lib/deemix/config-store/index"
		);
		const configStore = await createConfigStore();

		const { DeemixApp } = await import("@/lib/deemix-app");
		const app = new DeemixApp(createListener(), configStore);
		await app.init(); // Must await before returning
		globalForDeemix.deemixApp = app;
		return app;
	} catch (e) {
		console.error("Failed to initialize DeemixApp:", e);
		_initPromise = null; // Allow retry on failure
		return null;
	}
}

function createListener(): Listener {
	// No-op listener: the WS broadcast server is gone. Progressive streaming
	// engine + library helpers don't need to broadcast anything; the legacy
	// queue path (still alive in deemix-app.ts during the transition) just
	// drops its events on the floor here.
	return {
		send() {},
	};
}
