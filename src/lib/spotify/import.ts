// Shapes and pure helpers shared by the import routes (server) and the
// chunked import run (browser): validating client-sent tracks, turning match
// results into playlist rows + the "not found" report.

import type { MatchResult } from "./match";
import type { SpotifyTrackMeta } from "./types";

/** Most tracks one import brings in (pasted links or a playlist link). */
export const MAX_IMPORT_TRACKS = 1000;
/** Tracks per `/match` call: a few seconds of Deezer lookups each. */
export const MATCH_BATCH_SIZE = 50;

export const SPOTIFY_TRACK_ID = /^[A-Za-z0-9]{22}$/;
const ISRC = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const DEEZER_TRACK_ID = /^\d{1,20}$/;

/** A matched track, ready for `addToPlaylist`. */
export interface ImportedRow {
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	duration: number | null;
}

export interface NotFoundRow {
	spotifyId: string;
	title: string;
	artist: string;
	album: string;
	reason: string;
}

export interface ImportReport {
	totalSpotify: number;
	processed: number;
	matched: number;
	notFound: NotFoundRow[];
	/** More than MAX_IMPORT_TRACKS were offered; only the first ones were processed. */
	truncated: boolean;
	/** Spotify only exposed the first 100 tracks (public embed, no API access). */
	limited: boolean;
}

export interface ImportResult {
	playlist: { id: string; title: string } | null;
	report: ImportReport;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * Spotify tracks sent by a client. Anything malformed rejects the whole list
 * (null). With `keepMeta`, album and ISRC survive (tracks read from a playlist
 * link carry them); otherwise only what pasted links give is kept.
 */
export function parseClientTracks(input: unknown, { keepMeta = false } = {}): SpotifyTrackMeta[] | null {
	if (!Array.isArray(input)) return null;
	const out: SpotifyTrackMeta[] = [];
	for (const raw of input) {
		const t = raw as Partial<SpotifyTrackMeta> | null;
		if (
			!t ||
			typeof t.spotifyId !== "string" ||
			!SPOTIFY_TRACK_ID.test(t.spotifyId) ||
			typeof t.title !== "string" ||
			!t.title.trim() ||
			!Array.isArray(t.artists) ||
			!t.artists.every((a) => typeof a === "string") ||
			typeof t.durationMs !== "number"
		) {
			return null;
		}
		const isrc = keepMeta && typeof t.isrc === "string" && ISRC.test(t.isrc.toUpperCase()) ? t.isrc.toUpperCase() : null;
		out.push({
			spotifyId: t.spotifyId,
			title: t.title.slice(0, 300),
			artists: t.artists.slice(0, 20).map((a) => a.slice(0, 200)),
			album: keepMeta ? str(t.album, 300) : "",
			albumId: null,
			durationMs: t.durationMs,
			isrc,
			coverUrl: null,
		});
	}
	return out;
}

/** Matched rows sent back to `/save`; null when anything is malformed. */
export function parseImportedRows(input: unknown): ImportedRow[] | null {
	if (!Array.isArray(input)) return null;
	const out: ImportedRow[] = [];
	for (const raw of input) {
		const r = raw as Partial<ImportedRow> | null;
		if (!r || typeof r.trackId !== "string" || !DEEZER_TRACK_ID.test(r.trackId) || typeof r.title !== "string" || !r.title.trim() || typeof r.artist !== "string") {
			return null;
		}
		out.push({
			trackId: r.trackId,
			title: r.title.slice(0, 300),
			artist: r.artist.slice(0, 300),
			album: typeof r.album === "string" ? r.album.slice(0, 300) : null,
			albumId: typeof r.albumId === "string" && DEEZER_TRACK_ID.test(r.albumId) ? r.albumId : null,
			coverUrl: typeof r.coverUrl === "string" && /^https:\/\//.test(r.coverUrl) ? r.coverUrl.slice(0, 500) : null,
			duration: typeof r.duration === "number" && Number.isFinite(r.duration) ? Math.max(0, Math.round(r.duration)) : null,
		});
	}
	return out;
}

/** Pasted links Spotify never let us read: reported as misses. */
export function unreadableRows(ids: string[]): NotFoundRow[] {
	return ids.map((spotifyId) => ({
		spotifyId,
		title: `spotify:track:${spotifyId}`,
		artist: "",
		album: "",
		reason: "Couldn't read this track from Spotify",
	}));
}

/**
 * Pair each Spotify track with its match: matched ones become playlist rows
 * (a Deezer track already in `seen` is dropped — two Spotify versions often
 * land on the same one), the rest the "not found" report.
 */
export function collectMatches(
	tracks: SpotifyTrackMeta[],
	matches: MatchResult[],
	seen = new Set<string>()
): { rows: ImportedRow[]; notFound: NotFoundRow[] } {
	const rows: ImportedRow[] = [];
	const notFound: NotFoundRow[] = [];
	tracks.forEach((src, i) => {
		const m = matches[i] ?? { status: "not_found", reason: "No match result" };
		if (m.status === "matched") {
			if (seen.has(m.deezerTrackId)) return;
			seen.add(m.deezerTrackId);
			rows.push({
				trackId: m.deezerTrackId,
				title: m.title,
				artist: m.artist,
				album: m.album,
				albumId: m.albumId,
				coverUrl: m.coverUrl,
				duration: m.duration,
			});
		} else {
			notFound.push({ spotifyId: src.spotifyId, title: src.title, artist: src.artists.join(", "), album: src.album, reason: m.reason });
		}
	});
	return { rows, notFound };
}
