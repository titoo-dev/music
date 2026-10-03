import { spotifyGet, SpotifyAPIError, SpotifyConfigError } from "./client";
import { fetchPlaylistFromEmbed } from "./embed";
import type { SpotifyPlaylistMeta, SpotifyTrackMeta } from "./types";

// Subset of Spotify's playlist + paging response shapes we actually use.
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

// Since the February 2026 Web API migration the playlist's `tracks` field is
// `items` and each entry's `track` is `item`; both shapes are accepted.
interface PlaylistItem {
	item?: SpotifyTrackObject | null;
	track?: SpotifyTrackObject | null;
}

interface PlaylistResponse {
	id: string;
	name: string;
	description: string | null;
	images: SpotifyImage[];
	owner: { display_name?: string | null; id: string };
	items?: PagingObject<PlaylistItem>;
	tracks?: PagingObject<PlaylistItem>;
}

interface PagingObject<T> {
	items: T[];
	next: string | null;
	total: number;
}

function pickCover(images: SpotifyImage[] | undefined): string | null {
	if (!images?.length) return null;
	// Spotify returns largest-first; the middle one is usually 300px.
	return images[Math.min(1, images.length - 1)]?.url ?? images[0]?.url ?? null;
}

function normalizeTrack(t: SpotifyTrackObject): SpotifyTrackMeta | null {
	if (!t.id || t.is_local || (t.type && t.type !== "track")) return null;
	return {
		spotifyId: t.id,
		title: t.name,
		artists: t.artists.map((a) => a.name).filter(Boolean),
		album: t.album?.name ?? "",
		albumId: t.album?.id ?? null,
		durationMs: t.duration_ms,
		isrc: t.external_ids?.isrc?.toUpperCase() ?? null,
		coverUrl: pickCover(t.album?.images),
	};
}

// Spotify's `next` field returns absolute URLs. We only need the path + query
// (since our client adds the prefix) so we extract them.
function nextRelative(next: string | null): string | null {
	if (!next) return null;
	try {
		const u = new URL(next);
		return u.pathname.replace(/^\/v1\//, "") + u.search;
	} catch {
		return null;
	}
}

// Returns null when the API answers with metadata only — Development Mode
// apps no longer get the items of playlists the user doesn't own.
async function fetchPlaylistFromApi(
	playlistId: string
): Promise<SpotifyPlaylistMeta | null> {
	const head = await spotifyGet<PlaylistResponse>(`playlists/${playlistId}`, {
		additional_types: "track",
	});

	const firstPage = head.items ?? head.tracks;
	if (!firstPage?.items) return null;

	const tracks: SpotifyTrackMeta[] = [];
	const collect = (items: PlaylistItem[]) => {
		for (const entry of items) {
			const t = entry?.item ?? entry?.track;
			if (!t) continue;
			const norm = normalizeTrack(t);
			if (norm) tracks.push(norm);
		}
	};

	collect(firstPage.items);

	let nextPath = nextRelative(firstPage.next);
	let safety = 200; // hard cap: 100 * 200 = 20k tracks
	while (nextPath && safety-- > 0) {
		// `next` already encodes offset/limit, so we re-issue it as-is.
		const page = await spotifyGet<PagingObject<PlaylistItem>>(nextPath);
		collect(page.items);
		nextPath = nextRelative(page.next);
	}

	if (safety <= 0) {
		throw new SpotifyAPIError("Playlist exceeds 20,000 tracks; refusing to import.");
	}

	return {
		spotifyId: head.id,
		title: head.name,
		description: head.description ?? "",
		ownerName: head.owner.display_name ?? head.owner.id,
		coverUrl: pickCover(head.images),
		totalTracks: firstPage.total,
		tracks,
		source: "api",
		limited: false,
	};
}

// Web API first (full list + ISRCs) when it is configured and allowed to read
// the playlist; otherwise the public embed page (first 100 tracks).
export async function fetchPlaylist(
	playlistId: string
): Promise<SpotifyPlaylistMeta> {
	try {
		const fromApi = await fetchPlaylistFromApi(playlistId);
		if (fromApi) return fromApi;
	} catch (e) {
		// Missing/invalid credentials, dev-mode 403s, quota 429s… all leave the
		// embed as a working source. A 404 means the playlist really is gone.
		const canFallBack =
			e instanceof SpotifyConfigError || (e instanceof SpotifyAPIError && e.status !== 404);
		if (!canFallBack) throw e;
	}
	return fetchPlaylistFromEmbed(playlistId);
}
