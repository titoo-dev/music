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
