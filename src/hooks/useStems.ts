"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useStems(trackId) — drives the per-track stem-separation lifecycle.
//
// State machine:
//   idle       no separation row exists yet (or this hook hasn't checked)
//   requesting POST /api/v1/stems/[trackId] is in flight
//   queued     row exists with status=pending (worker hasn't picked it up)
//   processing row exists with status=processing — hook polls every 5s
//   completed  row exists with status=completed — `files` is populated
//   failed     row exists with status=failed — `errorMessage` is populated
//
// Polling is only active in queued/processing. When status flips to
// completed/failed, the interval is cleared.
// ─────────────────────────────────────────────────────────────────────────────

export type StemMode = "two_stems" | "six_stems";

export type StemsHookStatus =
	| "idle"
	| "requesting"
	| "queued"
	| "processing"
	| "completed"
	| "failed";

export interface StemFileSummary {
	stemName: string;
	fileSize: number | null;
}

export interface StemsHookState {
	status: StemsHookStatus;
	progress: number;
	mode: StemMode | null;
	errorMessage: string | null;
	files: StemFileSummary[];
}

const INITIAL: StemsHookState = {
	status: "idle",
	progress: 0,
	mode: null,
	errorMessage: null,
	files: [],
};

const POLL_INTERVAL_MS = 5_000;

interface ApiEnvelope<T> {
	success: boolean;
	data?: T;
	error?: { code: string; message: string };
}

interface ServerStems {
	trackId: string;
	status: string;
	mode: StemMode;
	progress: number;
	errorMessage?: string | null;
	files?: StemFileSummary[];
}

function mapServerStatus(s: string): StemsHookStatus {
	switch (s) {
		case "pending":
			return "queued";
		case "processing":
			return "processing";
		case "completed":
			return "completed";
		case "failed":
			return "failed";
		default:
			return "idle";
	}
}

function applyServerState(server: ServerStems): StemsHookState {
	return {
		status: mapServerStatus(server.status),
		progress: server.progress ?? 0,
		mode: server.mode,
		errorMessage: server.errorMessage ?? null,
		files: server.files ?? [],
	};
}

async function fetchStems(trackId: string, signal?: AbortSignal): Promise<ServerStems | null> {
	const res = await fetch(`/api/v1/stems/${encodeURIComponent(trackId)}`, {
		credentials: "include",
		cache: "no-store",
		signal,
	});
	if (res.status === 404) return null;
	const json = (await res.json()) as ApiEnvelope<ServerStems>;
	if (!res.ok || json.success === false) {
		const msg = json.error?.message || `Failed to load stems (${res.status})`;
		const err = new Error(msg) as Error & { code?: string };
		err.code = json.error?.code;
		throw err;
	}
	return json.data ?? null;
}

async function postStems(
	trackId: string,
	mode: StemMode,
): Promise<ServerStems> {
	const res = await fetch(`/api/v1/stems/${encodeURIComponent(trackId)}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ mode }),
	});
	const json = (await res.json()) as ApiEnvelope<ServerStems>;
	if (!res.ok || json.success === false || !json.data) {
		const msg =
			json.error?.message || `Failed to request stems (${res.status})`;
		const err = new Error(msg) as Error & { code?: string };
		err.code = json.error?.code;
		throw err;
	}
	return json.data;
}

export interface UseStemsResult extends StemsHookState {
	requestSeparation: (mode: StemMode) => Promise<void>;
	refresh: () => Promise<void>;
}

export interface UseStemsOptions {
	/** Override the polling cadence. Defaults to 5s; tests use a tiny value. */
	pollIntervalMs?: number;
}

export function useStems(
	trackId: string | null | undefined,
	options: UseStemsOptions = {},
): UseStemsResult {
	const [state, setState] = useState<StemsHookState>(INITIAL);
	// Refs let async callbacks see fresh values without re-binding intervals.
	const trackIdRef = useRef(trackId);
	trackIdRef.current = trackId;

	const refresh = useCallback(async () => {
		const id = trackIdRef.current;
		if (!id) return;
		try {
			const server = await fetchStems(id);
			if (trackIdRef.current !== id) return;
			if (!server) {
				setState(INITIAL);
				return;
			}
			setState(applyServerState(server));
		} catch (e) {
			if (trackIdRef.current !== id) return;
			const message = e instanceof Error ? e.message : "Unknown error";
			setState((s) => ({ ...s, status: "failed", errorMessage: message }));
		}
	}, []);

	// Initial load + reset when trackId changes.
	useEffect(() => {
		if (!trackId) {
			setState(INITIAL);
			return;
		}
		setState(INITIAL);
		void refresh();
	}, [trackId, refresh]);

	// Poll while the worker is doing something.
	const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;
	useEffect(() => {
		if (!trackId) return;
		if (state.status !== "queued" && state.status !== "processing") return;
		const interval = setInterval(() => void refresh(), pollIntervalMs);
		return () => clearInterval(interval);
	}, [state.status, trackId, refresh, pollIntervalMs]);

	const requestSeparation = useCallback(
		async (mode: StemMode) => {
			const id = trackIdRef.current;
			if (!id) return;
			setState((s) => ({ ...s, status: "requesting", errorMessage: null }));
			try {
				const server = await postStems(id, mode);
				if (trackIdRef.current !== id) return;
				setState(applyServerState(server));
			} catch (e) {
				if (trackIdRef.current !== id) return;
				const message = e instanceof Error ? e.message : "Unknown error";
				setState((s) => ({
					...s,
					status: "failed",
					errorMessage: message,
				}));
			}
		},
		[],
	);

	return { ...state, requestSeparation, refresh };
}
