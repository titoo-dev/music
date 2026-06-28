// User library — single source of truth for track management. Convex backend
// (Postgres supprimé, Phase 6).
//
// Spotify-like model: SavedTrack[] (liked), Album+AlbumTrack[], Playlist+
// PlaylistTrack[]. File persistence (StoredTrack + S3) is orthogonal. Le
// ref-counting + cleanup vit ici pour garder les routes minces. L'accès S3
// (éviction physique) reste côté Next ; Convex ne gère que les compteurs/lignes.

import { getDeemixApp } from "@/lib/server-state";
import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TrackMeta {
	trackId: string;
	title: string;
	artist: string;
	album?: string | null;
	albumId?: string | null;
	coverUrl?: string | null;
	duration?: number | null;
}

export interface AlbumMeta {
	deezerAlbumId: string;
	title: string;
	artist: string;
	coverUrl?: string | null;
}

export interface AlbumTrackMeta {
	trackId: string;
	title: string;
	artist: string;
	coverUrl?: string | null;
	duration?: number | null;
	trackNumber?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SavedTrack
// ─────────────────────────────────────────────────────────────────────────────

export async function saveTrack(userId: string, t: TrackMeta) {
	await getConvexClient().mutation(api.savedTracks.save, {
		userId,
		trackId: t.trackId,
		title: t.title,
		artist: t.artist,
		album: t.album ?? null,
		albumId: t.albumId ?? null,
		coverUrl: t.coverUrl ?? null,
		duration: t.duration ?? null,
	});
}

export async function unsaveTrack(userId: string, trackId: string) {
	await getConvexClient().mutation(api.savedTracks.unsave, { userId, trackId });
	await maybeEvictFile(trackId);
}

export async function isTrackSaved(userId: string, trackId: string) {
	return getConvexClient().query(api.savedTracks.isSaved, { userId, trackId });
}

export async function getSavedTrackIds(
	userId: string,
	trackIds: string[]
): Promise<Set<string>> {
	if (trackIds.length === 0) return new Set();
	const ids = (await getConvexClient().query(api.savedTracks.savedIds, {
		userId,
		trackIds,
	})) as string[];
	return new Set(ids);
}

export async function listSavedTracks(
	userId: string,
	opts?: { limit?: number; offset?: number }
) {
	return getConvexClient().query(api.savedTracks.list, {
		userId,
		limit: opts?.limit,
		offset: opts?.offset,
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Album
// ─────────────────────────────────────────────────────────────────────────────

export async function saveAlbum(
	userId: string,
	album: AlbumMeta,
	tracks: AlbumTrackMeta[]
) {
	return getConvexClient().mutation(api.albums.saveAlbum, {
		userId,
		deezerAlbumId: album.deezerAlbumId,
		title: album.title,
		artist: album.artist,
		coverUrl: album.coverUrl ?? null,
		tracks: tracks.map((t) => ({
			trackId: t.trackId,
			title: t.title,
			artist: t.artist,
			coverUrl: t.coverUrl ?? null,
			duration: t.duration ?? null,
			trackNumber: t.trackNumber ?? null,
		})),
	});
}

export async function unsaveAlbum(userId: string, deezerAlbumId: string) {
	const trackIds = (await getConvexClient().mutation(api.albums.unsaveAlbum, {
		userId,
		deezerAlbumId,
	})) as string[];
	for (const trackId of trackIds) {
		await maybeEvictFile(trackId);
	}
}

export async function listSavedAlbums(userId: string) {
	return getConvexClient().query(api.albums.listSavedAlbums, { userId });
}

export async function getSavedAlbumIds(
	userId: string,
	deezerAlbumIds: string[]
): Promise<Set<string>> {
	if (deezerAlbumIds.length === 0) return new Set();
	const ids = (await getConvexClient().query(api.albums.savedAlbumIds, {
		userId,
		deezerAlbumIds,
	})) as string[];
	return new Set(ids);
}

// ─────────────────────────────────────────────────────────────────────────────
// FollowedArtist
// ─────────────────────────────────────────────────────────────────────────────

export interface FollowedArtistMeta {
	deezerArtistId: string;
	name: string;
	pictureUrl?: string | null;
}

export async function followArtist(userId: string, artist: FollowedArtistMeta) {
	await getConvexClient().mutation(api.followedArtists.follow, {
		userId,
		deezerArtistId: artist.deezerArtistId,
		name: artist.name,
		pictureUrl: artist.pictureUrl ?? null,
	});
}

export async function unfollowArtist(userId: string, deezerArtistId: string) {
	await getConvexClient().mutation(api.followedArtists.unfollow, {
		userId,
		deezerArtistId,
	});
}

export async function isArtistFollowed(userId: string, deezerArtistId: string) {
	return getConvexClient().query(api.followedArtists.isFollowed, {
		userId,
		deezerArtistId,
	});
}

export async function getFollowedArtistIds(
	userId: string,
	deezerArtistIds: string[]
): Promise<Set<string>> {
	if (deezerArtistIds.length === 0) return new Set();
	const ids = (await getConvexClient().query(api.followedArtists.followedIds, {
		userId,
		deezerArtistIds,
	})) as string[];
	return new Set(ids);
}

export async function listFollowedArtists(
	userId: string,
	opts?: { limit?: number; offset?: number }
) {
	return getConvexClient().query(api.followedArtists.list, {
		userId,
		limit: opts?.limit,
		offset: opts?.offset,
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Playlist
// ─────────────────────────────────────────────────────────────────────────────

export async function addToPlaylist(playlistId: string, tracks: TrackMeta[]) {
	if (tracks.length === 0) return { added: 0 };
	return getConvexClient().mutation(api.playlists.addTracks, {
		playlistId,
		tracks: tracks.map((t) => ({
			trackId: t.trackId,
			title: t.title,
			artist: t.artist,
			album: t.album ?? null,
			albumId: t.albumId ?? null,
			coverUrl: t.coverUrl ?? null,
			duration: t.duration ?? null,
		})),
	});
}

export async function removeFromPlaylist(
	playlistId: string,
	trackIds: string[]
) {
	if (trackIds.length === 0) return { removed: 0 };
	return getConvexClient().mutation(api.playlists.removeTracks, {
		playlistId,
		trackIds,
	});
}

export async function reorderPlaylist(
	playlistId: string,
	orderedTrackIds: string[]
) {
	return getConvexClient().mutation(api.playlists.reorder, {
		playlistId,
		orderedTrackIds,
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// File ref-counting + eviction (compteurs Convex ; suppression S3 côté Next)
// ─────────────────────────────────────────────────────────────────────────────

export async function getTrackRefCount(trackId: string) {
	return getConvexClient().query(api.storedTracks.refCount, { trackId }) as Promise<{
		saved: number;
		album: number;
		shared: number;
		recent: number;
		total: number;
	}>;
}

/** Delete the audio file from storage + remove StoredTrack rows for this trackId. */
export async function forceEvictFile(trackId: string): Promise<number> {
	const paths = (await getConvexClient().mutation(
		api.storedTracks.deleteByTrack,
		{ trackId }
	)) as string[];
	if (paths.length === 0) return 0;

	const app = await getDeemixApp();
	const storageProvider = app?.storageProvider;
	let deleted = 0;
	if (storageProvider) {
		for (const path of paths) {
			try {
				await storageProvider.deleteFile(path);
				deleted++;
			} catch (e) {
				console.error(`[library] failed to delete ${path}:`, e);
			}
		}
	}
	return deleted;
}

/** Evict the file ONLY if no entity still needs it. Safe to call after any unsave. */
export async function maybeEvictFile(trackId: string) {
	const refs = await getTrackRefCount(trackId);
	if (refs.total === 0) {
		await forceEvictFile(trackId);
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Share
// ─────────────────────────────────────────────────────────────────────────────

export async function shareTrack(
	userId: string,
	t: TrackMeta,
	opts?: { expiresAt?: Date | null }
) {
	return getConvexClient().mutation(api.shares.shareTrack, {
		userId,
		trackId: t.trackId,
		title: t.title,
		artist: t.artist,
		album: t.album ?? null,
		coverUrl: t.coverUrl ?? null,
		duration: t.duration ?? null,
		expiresAt: opts?.expiresAt ? opts.expiresAt.getTime() : null,
	});
}

export interface ResolvedShare {
	id: string;
	shareId: string;
	trackId: string;
	userId: string;
	title: string;
	artist: string;
	album?: string | null;
	coverUrl?: string | null;
	duration?: number | null;
	storedTrackId?: string | null;
	expiresAt?: number | null;
	plays: number;
	createdAt: number;
	storedTrack: { storageType: string; storagePath: string } | null;
}

export async function resolveShareForPlayback(shareId: string) {
	const res = (await getConvexClient().query(api.shares.resolveForPlayback, {
		shareId,
	})) as {
		share: Record<string, unknown>;
		storedTrack: { storageType: string; storagePath: string } | null;
		expired: boolean;
	} | null;
	if (!res) return null;
	return {
		share: { ...res.share, storedTrack: res.storedTrack } as ResolvedShare,
		expired: res.expired,
	} as const;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-cache hook
// ─────────────────────────────────────────────────────────────────────────────

export async function isPreCacheEnabled(userId: string): Promise<boolean> {
	const prefs = (await getConvexClient().query(api.preferences.get, {
		userId,
	})) as Record<string, unknown> | null;
	return prefs?.preCacheSaved === true;
}
