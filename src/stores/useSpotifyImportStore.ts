import { create } from "zustand";
import { parsePlaylistInput, parseTrackLinks } from "@/lib/spotify/parse-url";
import { MAX_IMPORT_TRACKS, type ImportResult } from "@/lib/spotify/import";
import { importApi } from "@/lib/spotify/import-api";
import { isAbort, runImport, type ImportSource, type ImportSubject, type ResolvedTrack } from "@/lib/spotify/import-run";
import type { ReadProgress } from "@/lib/spotify/read-links";

export type ImportPhase = "idle" | "reading" | "matching" | "saving" | "done" | "error";

/** What the pasted text is: a playlist link, track links (and how many), or nothing usable. */
export type DetectedInput = { kind: "playlist" } | { kind: "links"; count: number } | null;

export function detectInput(text: string): DetectedInput {
	const trimmed = text.trim();
	if (!trimmed) return null;
	if (parsePlaylistInput(trimmed)) return { kind: "playlist" };
	const count = parseTrackLinks(trimmed).length;
	return count > 0 ? { kind: "links", count } : null;
}

export const isRunning = (phase: ImportPhase) => phase === "reading" || phase === "matching" || phase === "saving";

const FRIENDLY_ERRORS: Record<string, string> = {
	NOT_AUTHENTICATED: "Please sign in to import.",
	NO_DEEZER_ARL: "Connect your Deezer account in Settings before importing.",
	DEEZER_LOGIN_FAILED: "Your Deezer ARL is invalid. Update it in Settings.",
	SPOTIFY_NOT_FOUND: "Playlist not found. Make sure the link is public and not region-locked.",
	SPOTIFY_FORBIDDEN: "Spotify refused to share this playlist. Make sure it's public.",
	SPOTIFY_ERROR: "Couldn't read this from Spotify. Please try again.",
	SPOTIFY_RATE_LIMITED: "Spotify is rate-limiting requests. Please try again in a moment.",
	INVALID_URL: "That doesn't look like a Spotify playlist link or track links.",
	MISSING_URL: "Paste a Spotify playlist URL first.",
	EMPTY_PLAYLIST: "This playlist has no importable tracks.",
};

export function friendlyImportError(e: unknown): string {
	const err = e as { code?: string; message?: string } | null;
	return (err?.code && FRIENDLY_ERRORS[err.code]) || err?.message || "Import failed";
}

const FEED_SIZE = 6;
const MAX_COVERS = 40;

interface RunState {
	phase: ImportPhase;
	subject: ImportSubject | null;
	reading: ReadProgress | null;
	matching: { done: number; total: number };
	/** Running counts while matching (the report has the final, de-duplicated ones). */
	matched: number;
	missed: number;
	/** Latest resolved tracks, newest first. */
	feed: ResolvedTrack[];
	/** Covers of matched tracks, for the backdrop. */
	covers: string[];
	result: ImportResult | null;
	error: string | null;
}

interface SpotifyImportState extends RunState {
	open: boolean;
	input: string;
	title: string;
	/** Bumped by every start; events from an older run are ignored. */
	runId: number;
	/** Id of the last playlist an import created (lists refresh on it). */
	lastImportedId: string | null;
	openDialog: () => void;
	closeDialog: () => void;
	setInput: (input: string) => void;
	setTitle: (title: string) => void;
	start: () => Promise<void>;
	cancel: () => void;
	/** Back to the form, keeping what was pasted (after an error). */
	retry: () => void;
	/** Back to an empty form. */
	reset: () => void;
}

const IDLE: RunState = {
	phase: "idle",
	subject: null,
	reading: null,
	matching: { done: 0, total: 0 },
	matched: 0,
	missed: 0,
	feed: [],
	covers: [],
	result: null,
	error: null,
};

let controller: AbortController | null = null;

/**
 * A Spotify import, from the pasted text to the report. Lives outside the
 * dialog: closing it mid-import keeps the import running ("in the
 * background"), and reopening shows where it stands.
 */
export const useSpotifyImportStore = create<SpotifyImportState>((set, get) => ({
	...IDLE,
	open: false,
	input: "",
	title: "",
	runId: 0,
	lastImportedId: null,

	openDialog: () => set({ open: true }),

	closeDialog: () => {
		set({ open: false });
		const { phase } = get();
		// A finished import starts over next time — once the close animation is done.
		if (phase === "done" || phase === "error") {
			setTimeout(() => {
				const s = get();
				if (!s.open && (s.phase === "done" || s.phase === "error")) s.reset();
			}, 250);
		}
	},

	setInput: (input) => set((s) => ({ input, error: s.phase === "error" ? s.error : null })),
	setTitle: (title) => set({ title }),

	start: async () => {
		const { input, title, phase } = get();
		if (isRunning(phase)) return;
		const detected = detectInput(input);
		if (!detected) {
			set({ phase: "idle", error: input.trim() ? FRIENDLY_ERRORS.INVALID_URL : FRIENDLY_ERRORS.MISSING_URL });
			return;
		}
		const source: ImportSource =
			detected.kind === "playlist"
				? { kind: "playlist", url: input.trim() }
				: { kind: "links", ids: parseTrackLinks(input).slice(0, MAX_IMPORT_TRACKS), title };

		controller?.abort();
		const ctrl = new AbortController();
		controller = ctrl;
		const runId = get().runId + 1;
		set({ ...IDLE, phase: "reading", runId });
		const live = () => get().runId === runId;

		try {
			const result = await runImport(source, {
				api: importApi,
				signal: ctrl.signal,
				onEvent: (e) => {
					if (!live()) return;
					switch (e.type) {
						case "subject":
							set({ subject: e.subject });
							break;
						case "reading":
							set({ phase: "reading", reading: e.progress });
							break;
						case "matching":
							set({ phase: "matching", reading: null, matching: { done: e.done, total: e.total } });
							break;
						case "resolved": {
							const hits = e.tracks.filter((t) => t.matched);
							set((s) => ({
								matched: s.matched + hits.length,
								missed: s.missed + e.tracks.length - hits.length,
								feed: [...e.tracks].reverse().concat(s.feed).slice(0, FEED_SIZE),
								covers: [...new Set([...s.covers, ...hits.flatMap((t) => (t.coverUrl ? [t.coverUrl] : []))])].slice(0, MAX_COVERS),
							}));
							break;
						}
						case "saving":
							set({ phase: "saving" });
							break;
					}
				},
			});
			if (!live()) return;
			set({ phase: "done", result, ...(result.playlist ? { lastImportedId: result.playlist.id } : {}) });
		} catch (e) {
			if (!live()) return;
			if (isAbort(e)) set({ ...IDLE });
			else set({ phase: "error", error: friendlyImportError(e) });
		} finally {
			if (controller === ctrl) controller = null;
		}
	},

	cancel: () => {
		if (!isRunning(get().phase)) return;
		controller?.abort();
		controller = null;
		// Drop whatever the aborted run still emits.
		set((s) => ({ ...IDLE, runId: s.runId + 1 }));
	},

	retry: () => set({ ...IDLE }),

	reset: () => {
		controller?.abort();
		controller = null;
		set((s) => ({ ...IDLE, input: "", title: "", runId: s.runId + 1 }));
	},
}));
