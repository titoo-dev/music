// Repository album (lookups par id interne + ownership) — Convex (Phase 6).

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

export async function getSavedAlbumWithTracks(albumId: string, userId: string) {
	return getConvexClient().query(api.albums.getOwnedWithTracks, {
		albumId,
		userId,
	});
}

export async function getSavedAlbumDeezerId(albumId: string, userId: string) {
	const album = (await getConvexClient().query(api.albums.getOwnedWithTracks, {
		albumId,
		userId,
	})) as { deezerAlbumId: string } | null;
	return album ? { deezerAlbumId: album.deezerAlbumId } : null;
}
