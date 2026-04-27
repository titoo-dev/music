// User library — single source of truth for track management.
//
// Spotify-like model:
//   • SavedTrack[] = explicitly liked tracks ("Liked Songs")
//   • Album + AlbumTrack[] = saved albums with their tracklists
//   • Playlist + PlaylistTrack[] = user-created playlists (metadata only,
//     decoupled from file lifecycle)
//
// File persistence (StoredTrack + S3) is orthogonal. A saved track may or
// may not have a backing audio file; playback is always served via the
// progressive streaming engine which fetches/persists/evicts files
// transparently. This module holds the ref-counting + cleanup logic so
// every API route stays a thin HTTP wrapper.

import { prisma } from "@/lib/prisma";
import { getDeemixApp } from "@/lib/server-state";

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
// SavedTrack — individual "liked" tracks
// ─────────────────────────────────────────────────────────────────────────────

export async function saveTrack(userId: string, t: TrackMeta) {
	return prisma.savedTrack.upsert({
		where: { userId_trackId: { userId, trackId: t.trackId } },
		update: {},
		create: {
			userId,
			trackId: t.trackId,
			title: t.title,
			artist: t.artist,
			album: t.album ?? null,
			albumId: t.albumId ?? null,
			coverUrl: t.coverUrl ?? null,
			duration: t.duration ?? null,
		},
	});
}

export async function unsaveTrack(userId: string, trackId: string) {
	await prisma.savedTrack.deleteMany({
		where: { userId, trackId },
	});
	await maybeEvictFile(trackId);
}

export async function isTrackSaved(userId: string, trackId: string) {
	const row = await prisma.savedTrack.findUnique({
		where: { userId_trackId: { userId, trackId } },
		select: { id: true },
	});
	return !!row;
}

/** Batch lookup — returns the set of trackIds the user has saved. */
export async function getSavedTrackIds(
	userId: string,
	trackIds: string[]
): Promise<Set<string>> {
	if (trackIds.length === 0) return new Set();
	const rows = await prisma.savedTrack.findMany({
		where: { userId, trackId: { in: trackIds } },
		select: { trackId: true },
	});
	return new Set(rows.map((r) => r.trackId));
}

export async function listSavedTracks(
	userId: string,
	opts?: { limit?: number; offset?: number }
) {
	return prisma.savedTrack.findMany({
		where: { userId },
		orderBy: { savedAt: "desc" },
		take: opts?.limit,
		skip: opts?.offset,
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Album — saved albums + tracklists
// ─────────────────────────────────────────────────────────────────────────────

export async function saveAlbum(
	userId: string,
	album: AlbumMeta,
	tracks: AlbumTrackMeta[]
) {
	const saved = await prisma.album.upsert({
		where: {
			userId_deezerAlbumId: { userId, deezerAlbumId: album.deezerAlbumId },
		},
		update: {
			title: album.title,
			artist: album.artist,
			coverUrl: album.coverUrl ?? null,
			trackCount: tracks.length,
		},
		create: {
			userId,
			deezerAlbumId: album.deezerAlbumId,
			title: album.title,
			artist: album.artist,
			coverUrl: album.coverUrl ?? null,
			trackCount: tracks.length,
		},
	});

	// Re-sync tracklist (delete-then-recreate so we drop any stale rows)
	await prisma.albumTrack.deleteMany({ where: { albumId: saved.id } });
	if (tracks.length > 0) {
		await prisma.albumTrack.createMany({
			data: tracks.map((t) => ({
				albumId: saved.id,
				trackId: t.trackId,
				title: t.title,
				artist: t.artist,
				coverUrl: t.coverUrl ?? null,
				duration: t.duration ?? null,
				trackNumber: t.trackNumber ?? null,
			})),
			skipDuplicates: true,
		});
	}
	return saved;
}

export async function unsaveAlbum(userId: string, deezerAlbumId: string) {
	const album = await prisma.album.findUnique({
		where: { userId_deezerAlbumId: { userId, deezerAlbumId } },
		include: { tracks: { select: { trackId: true } } },
	});
	if (!album) return;

	const trackIds = album.tracks.map((t) => t.trackId);

	// Cascade deletes AlbumTrack via FK ON DELETE CASCADE
	await prisma.album.delete({ where: { id: album.id } });

	for (const trackId of trackIds) {
		await maybeEvictFile(trackId);
	}
}

export async function listSavedAlbums(userId: string) {
	return prisma.album.findMany({
		where: { userId },
		orderBy: { savedAt: "desc" },
	});
}

export async function getSavedAlbumIds(
	userId: string,
	deezerAlbumIds: string[]
): Promise<Set<string>> {
	if (deezerAlbumIds.length === 0) return new Set();
	const rows = await prisma.album.findMany({
		where: { userId, deezerAlbumId: { in: deezerAlbumIds } },
		select: { deezerAlbumId: true },
	});
	return new Set(rows.map((r) => r.deezerAlbumId));
}

// ─────────────────────────────────────────────────────────────────────────────
// Playlist — user playlists. Decoupled from file lifecycle.
// ─────────────────────────────────────────────────────────────────────────────

export async function addToPlaylist(
	playlistId: string,
	tracks: TrackMeta[]
) {
	if (tracks.length === 0) return { added: 0 };

	const last = await prisma.playlistTrack.findFirst({
		where: { playlistId },
		orderBy: { position: "desc" },
		select: { position: true },
	});
	let nextPosition = (last?.position ?? -1) + 1;

	let added = 0;
	for (const t of tracks) {
		try {
			await prisma.playlistTrack.upsert({
				where: { playlistId_trackId: { playlistId, trackId: t.trackId } },
				update: {},
				create: {
					playlistId,
					trackId: t.trackId,
					title: t.title,
					artist: t.artist,
					album: t.album ?? null,
					albumId: t.albumId ?? null,
					coverUrl: t.coverUrl ?? null,
					duration: t.duration ?? null,
					position: nextPosition++,
				},
			});
			added++;
		} catch {
			// Duplicate — already in playlist
		}
	}

	await prisma.playlist.update({
		where: { id: playlistId },
		data: { updatedAt: new Date() },
	});

	return { added };
}

export async function removeFromPlaylist(
	playlistId: string,
	trackIds: string[]
) {
	if (trackIds.length === 0) return { removed: 0 };
	const result = await prisma.playlistTrack.deleteMany({
		where: { playlistId, trackId: { in: trackIds } },
	});
	await prisma.playlist.update({
		where: { id: playlistId },
		data: { updatedAt: new Date() },
	});
	return { removed: result.count };
}

// ─────────────────────────────────────────────────────────────────────────────
// File ref-counting + eviction
// ─────────────────────────────────────────────────────────────────────────────
//
// A track's StoredTrack file is "live" as long as ANY of these hold a reference:
//   • SavedTrack (user explicitly liked)
//   • AlbumTrack (track of a saved album)
//   • SharedTrack (public share link still active)
//   • RecentPlay (within the last-100 cap)
//
// PlaylistTrack does NOT count — playlists are pure metadata and don't
// anchor file lifecycle. A track only-in-playlists gets re-streamed each
// play if its file was already evicted.

export async function getTrackRefCount(trackId: string) {
	const [saved, album, shared, recent] = await Promise.all([
		prisma.savedTrack.count({ where: { trackId } }),
		prisma.albumTrack.count({ where: { trackId } }),
		prisma.sharedTrack.count({ where: { trackId } }),
		prisma.recentPlay.count({ where: { trackId } }),
	]);
	return { saved, album, shared, recent, total: saved + album + shared + recent };
}

/** Delete the audio file from storage + remove StoredTrack rows for this trackId. */
export async function forceEvictFile(trackId: string): Promise<number> {
	const stored = await prisma.storedTrack.findMany({
		where: { trackId },
		select: { id: true, storagePath: true },
	});
	if (stored.length === 0) return 0;

	const app = await getDeemixApp();
	const storageProvider = app?.storageProvider;
	let deleted = 0;

	if (storageProvider) {
		for (const row of stored) {
			try {
				await storageProvider.deleteFile(row.storagePath);
				deleted++;
			} catch (e) {
				console.error(`[library] failed to delete ${row.storagePath}:`, e);
			}
		}
	}

	const storedIds = stored.map((s) => s.id);

	// Drop SharedTrack→StoredTrack links so the deletion doesn't FK-fail.
	// The shares survive (storedTrackId becomes null) and the next playback
	// will re-stream the file from Deezer using the share creator's ARL.
	await prisma.sharedTrack.updateMany({
		where: { storedTrackId: { in: storedIds } },
		data: { storedTrackId: null },
	});

	await prisma.storedTrack.deleteMany({ where: { id: { in: storedIds } } });

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
// Share — public links with progressive-stream fallback
// ─────────────────────────────────────────────────────────────────────────────

export async function shareTrack(
	userId: string,
	t: TrackMeta,
	opts?: { expiresAt?: Date | null }
) {
	const { randomBytes } = await import("crypto");
	const shareId = randomBytes(8).toString("hex");

	// If a StoredTrack already exists for this trackId at any bitrate, link
	// to the highest-quality one so the public player can fast-path through S3.
	// If not (track never persisted), the share is created with storedTrackId=null
	// and the public stream route will lazily re-fetch via progressive.
	const stored = await prisma.storedTrack.findFirst({
		where: { trackId: t.trackId },
		orderBy: { bitrate: "desc" },
		select: { id: true },
	});

	return prisma.sharedTrack.create({
		data: {
			shareId,
			trackId: t.trackId,
			userId,
			title: t.title,
			artist: t.artist,
			album: t.album ?? null,
			coverUrl: t.coverUrl ?? null,
			duration: t.duration ?? null,
			storedTrackId: stored?.id ?? null,
			expiresAt: opts?.expiresAt ?? null,
		},
	});
}

export async function resolveShareForPlayback(shareId: string) {
	const share = await prisma.sharedTrack.findUnique({
		where: { shareId },
		include: { storedTrack: true },
	});
	if (!share) return null;
	if (share.expiresAt && share.expiresAt < new Date()) {
		return { share, expired: true } as const;
	}
	return { share, expired: false } as const;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-cache hook — wire-point for the optional "Pre-cache saved tracks" toggle
// ─────────────────────────────────────────────────────────────────────────────
//
// When the user has UserPreferences.preferences.preCacheSaved === true,
// saveTrack/saveAlbum can fire-and-forget a background fetch to warm the
// S3 cache so the first play is instant. The actual fetch reuses the
// progressive engine in persist-only mode (no client response branch).

export async function isPreCacheEnabled(userId: string): Promise<boolean> {
	const row = await prisma.userPreferences.findUnique({
		where: { userId },
		select: { preferences: true },
	});
	const prefs = row?.preferences as Record<string, unknown> | null;
	return prefs?.preCacheSaved === true;
}
