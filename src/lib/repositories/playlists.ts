// Repository playlist (CRUD) — Convex (Postgres supprimé, Phase 6).
// Ownership-aware : renvoie null/false quand la playlist n'appartient pas à
// l'utilisateur → la route mappe en 404. Les opérations sur les pistes
// (add/remove/reorder) sont dans src/lib/library.ts.

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

export async function listPlaylistsWithCovers(
	userId: string,
	trackId?: string | null,
) {
	return getConvexClient().query(api.playlists.listWithCovers, {
		userId,
		trackId: trackId ?? undefined,
	});
}

export async function createPlaylist(
	userId: string,
	title: string,
	description: string | null,
	coverUrl?: string | null,
) {
	const id = (await getConvexClient().mutation(api.playlists.create, {
		userId,
		title,
		description,
		coverUrl: coverUrl ?? null,
	})) as string;
	return getConvexClient().query(api.playlists.get, { playlistId: id });
}

export async function getPlaylistWithTracks(playlistId: string, userId: string) {
	return getConvexClient().query(api.playlists.getOwnedWithTracks, {
		playlistId,
		userId,
	});
}

export async function isPlaylistOwned(
	playlistId: string,
	userId: string,
): Promise<boolean> {
	const pl = await getConvexClient().query(api.playlists.getOwned, {
		playlistId,
		userId,
	});
	return pl !== null;
}

export async function updatePlaylist(
	playlistId: string,
	userId: string,
	patch: { title?: string; description?: string | null },
) {
	if (!(await isPlaylistOwned(playlistId, userId))) return null;
	await getConvexClient().mutation(api.playlists.update, {
		playlistId,
		...(patch.title !== undefined ? { title: patch.title } : {}),
		...(patch.description !== undefined
			? { description: patch.description }
			: {}),
	});
	return getConvexClient().query(api.playlists.get, { playlistId });
}

export async function deletePlaylist(
	playlistId: string,
	userId: string,
): Promise<boolean> {
	if (!(await isPlaylistOwned(playlistId, userId))) return false;
	await getConvexClient().mutation(api.playlists.remove, { playlistId });
	return true;
}
