// Credential-free playlist source: the public embed player
// (https://open.spotify.com/embed/playlist/{id}) server-renders the playlist
// into its `__NEXT_DATA__` payload. Since February 2026 the Web API only
// returns playlist items to the playlist's own user for Development Mode
// apps, so this is the only source that works for arbitrary public
// playlists. Limits: first 100 tracks, no ISRC, no album — the matcher falls
// back to artist + title search.

import { SpotifyAPIError } from "./client";
import type { SpotifyPlaylistMeta, SpotifyTrackMeta } from "./types";

export const EMBED_TRACK_LIMIT = 100;

const EMBED_URL = "https://open.spotify.com/embed/playlist/";
const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// The embed joins artists with ", " — these names contain one themselves.
const COMMA_ARTISTS = [
	"Tyler, The Creator",
	"Earth, Wind & Fire",
	"Crosby, Stills, Nash & Young",
	"Crosby, Stills & Nash",
	"Emerson, Lake & Palmer",
	"Blood, Sweat & Tears",
	"Peter, Paul and Mary",
];

interface EmbedTrack {
	uri?: string;
	title?: string;
	subtitle?: string;
	duration?: number;
	entityType?: string;
}

interface EmbedEntity {
	type?: string;
	id?: string;
	name?: string;
	title?: string;
	subtitle?: string;
	coverArt?: { sources?: Array<{ url: string }> };
	trackList?: EmbedTrack[];
}

export function splitArtists(subtitle: string): string[] {
	let rest = subtitle;
	const kept: string[] = [];
	for (const name of COMMA_ARTISTS) {
		if (rest.includes(name)) {
			kept.push(name);
			rest = rest.replace(name, "\u0000");
		}
	}
	return rest
		.split(", ")
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => (s === "\u0000" ? (kept.shift() as string) : s));
}

function toTrack(t: EmbedTrack): SpotifyTrackMeta | null {
	const match = t.uri?.match(/^spotify:track:([A-Za-z0-9]{22})$/);
	if (!match || (t.entityType && t.entityType !== "track") || !t.title) return null;
	return {
		spotifyId: match[1],
		title: t.title,
		artists: splitArtists(t.subtitle ?? ""),
		album: "",
		albumId: null,
		durationMs: t.duration ?? 0,
		isrc: null,
		coverUrl: null,
	};
}

export function parseEmbedHtml(html: string): SpotifyPlaylistMeta {
	const raw = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
	let entity: EmbedEntity | undefined;
	try {
		entity = raw ? JSON.parse(raw)?.props?.pageProps?.state?.data?.entity : undefined;
	} catch {
		entity = undefined;
	}
	if (!entity || !Array.isArray(entity.trackList)) {
		throw new SpotifyAPIError("Spotify embed page did not contain a playlist");
	}

	const tracks = entity.trackList.map(toTrack).filter((t): t is SpotifyTrackMeta => t !== null);
	return {
		spotifyId: entity.id ?? "",
		title: entity.name ?? entity.title ?? "Spotify playlist",
		description: "",
		ownerName: entity.subtitle ?? "",
		coverUrl: entity.coverArt?.sources?.[0]?.url ?? null,
		totalTracks: entity.trackList.length,
		tracks,
		source: "embed",
		limited: entity.trackList.length >= EMBED_TRACK_LIMIT,
	};
}

export async function fetchPlaylistFromEmbed(playlistId: string): Promise<SpotifyPlaylistMeta> {
	let res: Response;
	try {
		res = await fetch(`${EMBED_URL}${playlistId}`, {
			headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
			cache: "no-store",
		});
	} catch (e) {
		throw new SpotifyAPIError(`Spotify embed request failed: ${(e as Error).message}`);
	}
	if (!res.ok) {
		throw new SpotifyAPIError(`Spotify embed returned ${res.status}`, res.status);
	}
	return parseEmbedHtml(await res.text());
}

// ─── Single tracks ──────────────────────────────────────────────────────────
// Used for pasted track links (Spotify desktop: Ctrl+A, Ctrl+C in a
// playlist), which is how a playlist past the embed's 100-track cap gets in.

const TRACK_EMBED_URL = "https://open.spotify.com/embed/track/";

interface EmbedTrackEntity {
	type?: string;
	id?: string;
	name?: string;
	title?: string;
	artists?: Array<{ name?: string }>;
	duration?: number;
}

export function parseTrackEmbedHtml(html: string): SpotifyTrackMeta | null {
	const raw = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
	let entity: EmbedTrackEntity | undefined;
	try {
		entity = raw ? JSON.parse(raw)?.props?.pageProps?.state?.data?.entity : undefined;
	} catch {
		return null;
	}
	const title = entity?.name ?? entity?.title;
	if (!entity?.id || entity.type !== "track" || !title) return null;
	return {
		spotifyId: entity.id,
		title,
		artists: (entity.artists ?? []).map((a) => a.name ?? "").filter(Boolean),
		album: "",
		albumId: null,
		durationMs: entity.duration ?? 0,
		isrc: null,
		coverUrl: null,
	};
}

const RATE_LIMITED = Symbol("rate-limited");

async function fetchTrackFromEmbed(
	trackId: string
): Promise<SpotifyTrackMeta | null | typeof RATE_LIMITED> {
	const res = await fetch(`${TRACK_EMBED_URL}${trackId}`, {
		headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
		cache: "no-store",
	});
	// Spotify answers 429 with "retry-after: 0" yet keeps refusing for minutes,
	// so retrying here is pointless — the caller paces and resumes instead.
	if (res.status === 429) return RATE_LIMITED;
	if (!res.ok) return null;
	return parseTrackEmbedHtml(await res.text());
}

export interface TrackEmbedBatch {
	tracks: SpotifyTrackMeta[]; // input order
	failed: string[]; // Spotify didn't return them (removed, region-locked, network error)
	rateLimited: string[]; // not read because Spotify started refusing: try again later
}

// Bounded-concurrency fetch that stops at the first 429 and hands back the
// IDs it didn't get to.
export async function fetchTracksFromEmbed(
	trackIds: string[],
	options: { concurrency?: number } = {}
): Promise<TrackEmbedBatch> {
	const concurrency = Math.max(1, Math.min(options.concurrency ?? 3, 16));
	const results = new Array<SpotifyTrackMeta | null | typeof RATE_LIMITED | undefined>(trackIds.length);
	let cursor = 0;
	let limited = false;

	const worker = async () => {
		while (!limited && cursor < trackIds.length) {
			const idx = cursor++;
			try {
				results[idx] = await fetchTrackFromEmbed(trackIds[idx]);
				if (results[idx] === RATE_LIMITED) limited = true;
			} catch {
				results[idx] = null;
			}
		}
	};
	await Promise.all(Array.from({ length: concurrency }, worker));

	const batch: TrackEmbedBatch = { tracks: [], failed: [], rateLimited: [] };
	for (let i = 0; i < trackIds.length; i++) {
		const r = results[i];
		if (r === RATE_LIMITED || r === undefined) batch.rateLimited.push(trackIds[i]);
		else if (r === null) batch.failed.push(trackIds[i]);
		else batch.tracks.push(r);
	}
	return batch;
}
