// Server-side singleton state for the WaveletApp
// This module is only imported in API routes (server-side)

import type { Listener } from "@/lib/wavelet/types/listener";

// ── Per-user Deezer session with TTL eviction ──

interface DzSession {
	dz: any;
	lastAccess: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const globalForWavelet = globalThis as unknown as {
	waveletApp: any;
	sessionDZ: Map<string, DzSession>;
	guestDZ: any;
	initialized: boolean;
};

/** Get a per-user Deezer session map (keyed by better-auth user ID) */
export function getSessionDZ(): Map<string, DzSession> {
	if (!globalForWavelet.sessionDZ) {
		globalForWavelet.sessionDZ = new Map();
	}
	return globalForWavelet.sessionDZ;
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
	if (globalForWavelet.guestDZ?.loggedIn) return globalForWavelet.guestDZ;

	const serviceArl = process.env.WAVELET_SERVICE_ARL;
	if (!serviceArl) return null;

	try {
		const { Deezer } = await import("@/lib/deezer");
		const dz = new Deezer();
		const loggedIn = await dz.loginViaArl(serviceArl);
		if (loggedIn) {
			globalForWavelet.guestDZ = dz;
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

// ── WaveletApp singleton ──

let _waveletApp: any = null;
let _initPromise: Promise<any> | null = null;

export async function getWaveletApp() {
	if (_waveletApp) return _waveletApp;
	if (!_initPromise) {
		_initPromise = initializeWaveletApp().then((app) => {
			_waveletApp = app;
			return app;
		});
	}
	return _initPromise;
}

async function initializeWaveletApp() {
	// Dynamic import to avoid issues during build
	try {
		const { createConfigStore } = await import(
			"@/lib/wavelet/config-store/index"
		);
		const configStore = await createConfigStore();

		const { WaveletApp } = await import("@/lib/wavelet-app");
		const app = new WaveletApp(createListener(), configStore);
		await app.init(); // Must await before returning
		globalForWavelet.waveletApp = app;
		return app;
	} catch (e) {
		console.error("Failed to initialize WaveletApp:", e);
		_initPromise = null; // Allow retry on failure
		return null;
	}
}

function createListener(): Listener {
	// No-op listener: the WS broadcast server is gone. Progressive streaming
	// engine + library helpers don't need to broadcast anything; the legacy
	// queue path (still alive in wavelet-app.ts during the transition) just
	// drops its events on the floor here.
	return {
		send() {},
	};
}
