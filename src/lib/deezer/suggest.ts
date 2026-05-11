// Multi-section search suggestions powered by the public Deezer API.
//
// Three parallel /search/{track,album,artist} calls keep the dropdown payload
// small and let one section fail without breaking the others. Results are
// already Deezer-native, so no Spotify->Deezer matching step is needed.

import type { Deezer } from "./deezer";

export interface SuggestTrack {
	source: "deezer";
	sourceId: string;
	deezerTrackId: string;
	title: string;
	artists: string[];
	artistId: string | null;
	album: string;
	albumId: string | null;
	durationMs: number;
	coverUrl: string | null;
}

export interface SuggestAlbum {
	source: "deezer";
	sourceId: string;
	deezerAlbumId: string;
	title: string;
	artists: string[];
	coverUrl: string | null;
}

export interface SuggestArtist {
	source: "deezer";
	sourceId: string;
	deezerArtistId: string;
	name: string;
	imageUrl: string | null;
}

export interface DeezerSuggestions {
	tracks: SuggestTrack[];
	albums: SuggestAlbum[];
	artists: SuggestArtist[];
}

interface RawTrack {
	id: number | string;
	title: string;
	duration: number;
	artist?: { id?: number | string; name?: string };
	album?: { id?: number | string; title?: string; cover_medium?: string; cover_big?: string };
}

interface RawAlbum {
	id: number | string;
	title: string;
	cover_medium?: string;
	cover_big?: string;
	artist?: { id?: number | string; name?: string };
}

interface RawArtist {
	id: number | string;
	name: string;
	picture_medium?: string;
	picture_big?: string;
}

function normalizeTrack(t: RawTrack): SuggestTrack | null {
	if (t.id == null) return null;
	const id = String(t.id);
	return {
		source: "deezer",
		sourceId: id,
		deezerTrackId: id,
		title: t.title,
		artists: t.artist?.name ? [t.artist.name] : [],
		artistId: t.artist?.id != null ? String(t.artist.id) : null,
		album: t.album?.title ?? "",
		albumId: t.album?.id != null ? String(t.album.id) : null,
		durationMs: (t.duration ?? 0) * 1000,
		coverUrl: t.album?.cover_medium ?? t.album?.cover_big ?? null,
	};
}

function normalizeAlbum(a: RawAlbum): SuggestAlbum | null {
	if (a.id == null) return null;
	const id = String(a.id);
	return {
		source: "deezer",
		sourceId: id,
		deezerAlbumId: id,
		title: a.title,
		artists: a.artist?.name ? [a.artist.name] : [],
		coverUrl: a.cover_medium ?? a.cover_big ?? null,
	};
}

function normalizeArtist(a: RawArtist): SuggestArtist | null {
	if (a.id == null) return null;
	const id = String(a.id);
	return {
		source: "deezer",
		sourceId: id,
		deezerArtistId: id,
		name: a.name,
		imageUrl: a.picture_medium ?? a.picture_big ?? null,
	};
}

// In-process LRU — typing "the beatl" → "the beatles" otherwise hits the
// network on every keystroke. 5 min TTL is short enough to surface fresh
// catalog additions.
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 200;

interface CacheEntry {
	value: DeezerSuggestions;
	expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(term: string, limit: number) {
	return `${limit}:${term.toLowerCase().trim().replace(/\s+/g, " ")}`;
}

function readCache(key: string): DeezerSuggestions | null {
	const hit = cache.get(key);
	if (!hit) return null;
	if (hit.expiresAt < Date.now()) {
		cache.delete(key);
		return null;
	}
	cache.delete(key);
	cache.set(key, hit);
	return hit.value;
}

function writeCache(key: string, value: DeezerSuggestions) {
	cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
	if (cache.size > CACHE_MAX) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
}

export interface SuggestOptions {
	limit?: number; // per category, default 5, max 10
}

export async function deezerSuggest(
	dz: Deezer,
	term: string,
	options: SuggestOptions = {}
): Promise<DeezerSuggestions> {
	const limit = Math.max(1, Math.min(options.limit ?? 5, 10));

	const key = cacheKey(term, limit);
	const cached = readCache(key);
	if (cached) return cached;

	const [tracksRes, albumsRes, artistsRes] = await Promise.allSettled([
		dz.api.search_track(term, { limit }) as Promise<{ data?: RawTrack[] }>,
		dz.api.search_album(term, { limit }) as Promise<{ data?: RawAlbum[] }>,
		dz.api.search_artist(term, { limit }) as Promise<{ data?: RawArtist[] }>,
	]);

	const tracks =
		tracksRes.status === "fulfilled"
			? (tracksRes.value?.data ?? [])
					.map(normalizeTrack)
					.filter((x): x is SuggestTrack => x !== null)
			: [];
	const albums =
		albumsRes.status === "fulfilled"
			? (albumsRes.value?.data ?? [])
					.map(normalizeAlbum)
					.filter((x): x is SuggestAlbum => x !== null)
			: [];
	const artists =
		artistsRes.status === "fulfilled"
			? (artistsRes.value?.data ?? [])
					.map(normalizeArtist)
					.filter((x): x is SuggestArtist => x !== null)
			: [];

	const result = { tracks, albums, artists };
	writeCache(key, result);
	return result;
}
