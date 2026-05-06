// Spotify catalogue search used by the suggestion / search-enrichment flows.
//
// A single /v1/search call returns tracks + albums + artists at once, which
// keeps us under the per-app rate limit (~180 req/min). On top we maintain a
// per-process LRU cache keyed by the normalized term: typing "the beatl" then
// "the beatle" then "the beatles" hits the network ~3× otherwise.

import { spotifyGet } from "./client";
import type { SpotifyTrackMeta } from "./types";

// ─── Result shapes (raw Spotify subset) ─────────────────────────────────────

interface SpotifyImage {
	url: string;
	width: number | null;
	height: number | null;
}

interface SpotifyArtistRef {
	id: string | null;
	name: string;
}

interface SpotifyTrackObject {
	id: string | null;
	name: string;
	duration_ms: number;
	is_local?: boolean;
	type?: string;
	external_ids?: { isrc?: string };
	artists: SpotifyArtistRef[];
	album: {
		id: string | null;
		name: string;
		images: SpotifyImage[];
	};
}

interface SpotifyAlbumObject {
	id: string;
	name: string;
	album_type?: string;
	release_date?: string;
	total_tracks?: number;
	images: SpotifyImage[];
	artists: SpotifyArtistRef[];
	external_ids?: { upc?: string };
}

interface SpotifyArtistObject {
	id: string;
	name: string;
	images?: SpotifyImage[];
	genres?: string[];
	popularity?: number;
}

interface SpotifySearchResponse {
	tracks?: { items: SpotifyTrackObject[] };
	albums?: { items: SpotifyAlbumObject[] };
	artists?: { items: SpotifyArtistObject[] };
}

// ─── Normalized output ──────────────────────────────────────────────────────

export interface SuggestTrack {
	source: "spotify";
	sourceId: string;
	title: string;
	artists: string[];
	album: string;
	albumId: string | null;
	durationMs: number;
	isrc: string | null;
	coverUrl: string | null;
}

export interface SuggestAlbum {
	source: "spotify";
	sourceId: string;
	title: string;
	artists: string[];
	coverUrl: string | null;
	releaseDate: string | null;
	totalTracks: number | null;
	upc: string | null;
}

export interface SuggestArtist {
	source: "spotify";
	sourceId: string;
	name: string;
	imageUrl: string | null;
	genres: string[];
	popularity: number | null;
}

export interface SpotifySuggestions {
	tracks: SuggestTrack[];
	albums: SuggestAlbum[];
	artists: SuggestArtist[];
}

// Augmented track shape returned by the suggest endpoint, with cached
// Deezer-match annotations attached.
export interface SuggestTrackOut extends SuggestTrack {
	matched: boolean;
	deezerTrackId: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function pickCover(images: SpotifyImage[] | undefined): string | null {
	if (!images?.length) return null;
	// Spotify returns largest first; the middle image is usually ~300px which
	// is the right size for an autocomplete row.
	return images[Math.min(1, images.length - 1)]?.url ?? images[0]?.url ?? null;
}

function normalizeTrack(t: SpotifyTrackObject): SuggestTrack | null {
	if (!t.id || t.is_local || (t.type && t.type !== "track")) return null;
	return {
		source: "spotify",
		sourceId: t.id,
		title: t.name,
		artists: t.artists.map((a) => a.name).filter(Boolean),
		album: t.album?.name ?? "",
		albumId: t.album?.id ?? null,
		durationMs: t.duration_ms,
		isrc: t.external_ids?.isrc?.toUpperCase() ?? null,
		coverUrl: pickCover(t.album?.images),
	};
}

function normalizeAlbum(a: SpotifyAlbumObject): SuggestAlbum | null {
	if (!a.id) return null;
	return {
		source: "spotify",
		sourceId: a.id,
		title: a.name,
		artists: a.artists.map((x) => x.name).filter(Boolean),
		coverUrl: pickCover(a.images),
		releaseDate: a.release_date ?? null,
		totalTracks: a.total_tracks ?? null,
		upc: a.external_ids?.upc ?? null,
	};
}

function normalizeArtist(a: SpotifyArtistObject): SuggestArtist | null {
	if (!a.id) return null;
	return {
		source: "spotify",
		sourceId: a.id,
		name: a.name,
		imageUrl: pickCover(a.images),
		genres: a.genres ?? [],
		popularity: typeof a.popularity === "number" ? a.popularity : null,
	};
}

export function trackToMatchTarget(t: SuggestTrack): SpotifyTrackMeta {
	return {
		spotifyId: t.sourceId,
		title: t.title,
		artists: t.artists,
		album: t.album,
		albumId: t.albumId,
		durationMs: t.durationMs,
		isrc: t.isrc,
		coverUrl: t.coverUrl,
	};
}

// ─── LRU cache for search queries ───────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — short enough to pick up new releases
const CACHE_MAX = 200;

interface CacheEntry {
	value: SpotifySuggestions;
	expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(term: string, limit: number) {
	return `${limit}:${term.toLowerCase().trim().replace(/\s+/g, " ")}`;
}

function readCache(key: string): SpotifySuggestions | null {
	const hit = cache.get(key);
	if (!hit) return null;
	if (hit.expiresAt < Date.now()) {
		cache.delete(key);
		return null;
	}
	// Refresh LRU position
	cache.delete(key);
	cache.set(key, hit);
	return hit.value;
}

function writeCache(key: string, value: SpotifySuggestions) {
	cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
	if (cache.size > CACHE_MAX) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface MultiSearchOptions {
	limit?: number; // per category, default 5
	types?: Array<"track" | "album" | "artist">;
}

export async function spotifyMultiSearch(
	term: string,
	options: MultiSearchOptions = {}
): Promise<SpotifySuggestions> {
	const limit = Math.max(1, Math.min(options.limit ?? 5, 20));
	const types = options.types ?? ["track", "album", "artist"];

	const key = cacheKey(`${types.join(",")}|${term}`, limit);
	const cached = readCache(key);
	if (cached) return cached;

	const resp = await spotifyGet<SpotifySearchResponse>("search", {
		q: term,
		type: types.join(","),
		limit,
	});

	const result: SpotifySuggestions = {
		tracks: (resp.tracks?.items ?? [])
			.map(normalizeTrack)
			.filter((x): x is SuggestTrack => x !== null),
		albums: (resp.albums?.items ?? [])
			.map(normalizeAlbum)
			.filter((x): x is SuggestAlbum => x !== null),
		artists: (resp.artists?.items ?? [])
			.map(normalizeArtist)
			.filter((x): x is SuggestArtist => x !== null),
	};

	writeCache(key, result);
	return result;
}
