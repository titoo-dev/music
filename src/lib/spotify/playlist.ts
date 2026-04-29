import { spotifyGet, SpotifyAPIError } from "./client";
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

interface PlaylistItem {
	track: SpotifyTrackObject | null;
}

interface PlaylistResponse {
	id: string;
	name: string;
	description: string | null;
	images: SpotifyImage[];
	owner: { display_name?: string | null; id: string };
	tracks: PagingObject<PlaylistItem>;
}

interface PagingObject<T> {
	items: T[];
	next: string | null;
	total: number;
}

const TRACK_FIELDS =
	"items(track(id,name,duration_ms,is_local,type,external_ids(isrc),artists(id,name),album(id,name,images))),next,total";

const PLAYLIST_FIELDS = `id,name,description,images,owner(display_name,id),tracks(${TRACK_FIELDS})`;

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

export async function fetchPlaylist(
	playlistId: string
): Promise<SpotifyPlaylistMeta> {
	const head = await spotifyGet<PlaylistResponse>(`playlists/${playlistId}`, {
		fields: PLAYLIST_FIELDS,
		additional_types: "track",
		limit: 100,
	});

	const tracks: SpotifyTrackMeta[] = [];
	const collect = (items: PlaylistItem[]) => {
		for (const item of items) {
			if (!item?.track) continue;
			const norm = normalizeTrack(item.track);
			if (norm) tracks.push(norm);
		}
	};

	collect(head.tracks.items);

	let nextPath = nextRelative(head.tracks.next);
	let safety = 200; // hard cap: 100 * 200 = 20k tracks
	while (nextPath && safety-- > 0) {
		// `next` already encodes offset/limit/fields, so we re-issue it as-is.
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
		totalTracks: head.tracks.total,
		tracks,
	};
}
