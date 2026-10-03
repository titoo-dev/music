// The browser side of a Spotify import, as three server steps so no request
// gets near a function timeout and the UI can show real progress:
//   1. read   — the playlist link (…/playlist) or the pasted links (…/tracks, see read-links.ts)
//   2. match  — batches of MATCH_BATCH_SIZE tracks (…/match)
//   3. save   — one playlist with every matched track (…/save)
// Everything goes through `api`, so the run is testable without a network.

import type { MatchResult } from "./match";
import { readTrackLinks, type ReadProgress, type TrackLinkBatch } from "./read-links";
import type { SpotifyPlaylistMeta, SpotifyTrackMeta } from "./types";
import {
	MATCH_BATCH_SIZE,
	MAX_IMPORT_TRACKS,
	collectMatches,
	unreadableRows,
	type ImportResult,
	type ImportedRow,
	type NotFoundRow,
} from "./import";

export type ImportSource = { kind: "playlist"; url: string } | { kind: "links"; ids: string[]; title?: string };

export interface ImportApi {
	readPlaylist(url: string, signal: AbortSignal): Promise<SpotifyPlaylistMeta>;
	readTracks(ids: string[], signal: AbortSignal): Promise<TrackLinkBatch>;
	match(tracks: SpotifyTrackMeta[], signal: AbortSignal): Promise<{ results: MatchResult[] }>;
	save(
		body: { title: string; description?: string; coverUrl?: string | null; tracks: ImportedRow[] },
		signal: AbortSignal
	): Promise<{ playlist: { id: string; title: string } }>;
}

/** What the run is working on — the title, cover and size shown while it runs. */
export interface ImportSubject {
	title: string;
	coverUrl: string | null;
	ownerName: string;
	total: number;
}

/** One track as it resolves, for the live feed. */
export interface ResolvedTrack {
	spotifyId: string;
	title: string;
	artist: string;
	coverUrl: string | null;
	matched: boolean;
}

export type ImportEvent =
	| { type: "subject"; subject: ImportSubject }
	| { type: "reading"; progress: ReadProgress }
	| { type: "matching"; done: number; total: number }
	| { type: "resolved"; tracks: ResolvedTrack[] }
	| { type: "saving" };

export interface RunImportOptions {
	api: ImportApi;
	signal?: AbortSignal;
	onEvent?: (e: ImportEvent) => void;
	sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
	batchSize?: number;
	/** Retries of a failed match batch before its tracks are reported as misses. */
	retries?: number;
	retryDelayMs?: number;
}

const DEFAULT_TRACKS_TITLE = "Spotify import";

/** Errors that no retry can fix: they end the run. */
const FATAL_CODES = new Set(["NOT_AUTHENTICATED", "NO_DEEZER_ARL", "DEEZER_LOGIN_FAILED"]);

export function isAbort(e: unknown): boolean {
	return (e as Error)?.name === "AbortError";
}

function abortError(): Error {
	return Object.assign(new Error("Import cancelled"), { name: "AbortError" });
}

function throwIfAborted(signal: AbortSignal) {
	if (signal.aborted) throw abortError();
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) return reject(abortError());
		const id = setTimeout(() => {
			signal?.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(id);
			reject(abortError());
		};
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}

export async function runImport(
	source: ImportSource,
	{
		api,
		signal = new AbortController().signal,
		onEvent,
		sleep = abortableSleep,
		batchSize = MATCH_BATCH_SIZE,
		retries = 1,
		retryDelayMs = 2000,
	}: RunImportOptions
): Promise<ImportResult> {
	const emit = (e: ImportEvent) => onEvent?.(e);

	// 1. Read the Spotify tracks
	let tracks: SpotifyTrackMeta[];
	let meta: { title: string; description: string; coverUrl: string | null; limited: boolean };
	let total: number;
	let unreadable = 0;
	const notFound: NotFoundRow[] = [];

	if (source.kind === "playlist") {
		emit({ type: "reading", progress: { done: 0, total: 0, resumeAt: null } });
		const playlist = await api.readPlaylist(source.url, signal);
		throwIfAborted(signal);
		total = Math.max(playlist.totalTracks, playlist.tracks.length);
		tracks = playlist.tracks.slice(0, MAX_IMPORT_TRACKS);
		meta = { title: playlist.title, description: playlist.description, coverUrl: playlist.coverUrl, limited: playlist.limited };
		emit({ type: "subject", subject: { title: playlist.title, coverUrl: playlist.coverUrl, ownerName: playlist.ownerName, total: tracks.length } });
	} else {
		const ids = source.ids.slice(0, MAX_IMPORT_TRACKS);
		total = source.ids.length;
		const title = source.title?.trim() || DEFAULT_TRACKS_TITLE;
		meta = { title, description: "", coverUrl: null, limited: false };
		emit({ type: "subject", subject: { title, coverUrl: null, ownerName: "", total: ids.length } });
		const read = await readTrackLinks(ids, {
			fetchBatch: (chunk) => {
				throwIfAborted(signal);
				return api.readTracks(chunk, signal);
			},
			onProgress: (progress) => emit({ type: "reading", progress }),
			sleep: (ms) => sleep(ms, signal),
		});
		throwIfAborted(signal);
		tracks = read.tracks;
		unreadable = read.failed.length;
		notFound.push(...unreadableRows(read.failed));
		if (tracks.length === 0) {
			throw Object.assign(new Error("Couldn't read any of these tracks from Spotify. Try again in a few minutes."), { code: "SPOTIFY_UNREADABLE" });
		}
	}

	// 2. Match on Deezer, batch by batch
	const rows: ImportedRow[] = [];
	const seen = new Set<string>();
	emit({ type: "matching", done: 0, total: tracks.length });
	for (let i = 0; i < tracks.length; i += batchSize) {
		const batch = tracks.slice(i, i + batchSize);
		const results = await matchBatch(batch);
		const { rows: hits, notFound: misses } = collectMatches(batch, results, seen);
		rows.push(...hits);
		notFound.push(...misses);
		emit({
			type: "resolved",
			tracks: batch.map((t, k) => {
				const m = results[k];
				return m?.status === "matched"
					? { spotifyId: t.spotifyId, title: m.title, artist: m.artist, coverUrl: m.coverUrl, matched: true }
					: { spotifyId: t.spotifyId, title: t.title, artist: t.artists.join(", "), coverUrl: null, matched: false };
			}),
		});
		emit({ type: "matching", done: Math.min(i + batchSize, tracks.length), total: tracks.length });
	}

	const report = {
		totalSpotify: total,
		processed: tracks.length + unreadable,
		matched: rows.length,
		notFound,
		truncated: total > MAX_IMPORT_TRACKS,
		limited: meta.limited,
	};
	if (rows.length === 0) return { playlist: null, report };

	// 3. Save
	emit({ type: "saving" });
	throwIfAborted(signal);
	const { playlist } = await api.save(
		{ title: meta.title, ...(meta.description ? { description: meta.description } : {}), coverUrl: meta.coverUrl, tracks: rows },
		signal
	);
	return { playlist: { id: playlist.id, title: playlist.title }, report };

	async function matchBatch(batch: SpotifyTrackMeta[]): Promise<MatchResult[]> {
		for (let attempt = 0; ; attempt++) {
			throwIfAborted(signal);
			try {
				return (await api.match(batch, signal)).results;
			} catch (e) {
				if (isAbort(e) || FATAL_CODES.has((e as { code?: string }).code ?? "")) throw e;
				if (attempt >= retries) {
					return batch.map(() => ({ status: "not_found", reason: "Matching failed on Deezer — try this one again later" }));
				}
				await sleep(retryDelayMs * (attempt + 1), signal);
			}
		}
	}
}
