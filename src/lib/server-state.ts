// Server-side singleton state for the DeemixApp
// This module is only imported in API routes (server-side)

import type { Listener } from "@/lib/deemix/types/listener";

// We use a global variable to persist state across hot reloads in dev
const globalForDeemix = globalThis as unknown as {
	deemixApp: any;
	sessionDZ: Record<string, any>;
	initialized: boolean;
};

export function getSessionDZ(): Record<string, any> {
	if (!globalForDeemix.sessionDZ) {
		globalForDeemix.sessionDZ = {};
	}
	return globalForDeemix.sessionDZ;
}

// Lazy initialization - will be set up when the app module is ready
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
		const { DeemixApp } = await import("@/lib/deemix-app");
		const app = new DeemixApp(createListener());
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
	return {
		send(key: string, data: any) {
			// This will be connected to WebSocket broadcast
			if (globalForDeemix.deemixApp?._wsBroadcast) {
				globalForDeemix.deemixApp._wsBroadcast(key, data);
			}
		},
	};
}

export function setWsBroadcast(fn: (key: string, data: any) => void) {
	if (globalForDeemix.deemixApp) {
		globalForDeemix.deemixApp._wsBroadcast = fn;
	}
}
