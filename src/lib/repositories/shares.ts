// Repository sharedTrack (opérations route) — Convex (Postgres supprimé,
// Phase 6). Création / résolution : src/lib/library.ts (shareTrack /
// resolveShareForPlayback).

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

export async function findExistingShare(userId: string, trackId: string) {
	const shares = (await getConvexClient().query(api.shares.listByUser, {
		userId,
	})) as Array<{ trackId: string }>;
	return shares.find((s) => s.trackId === trackId) ?? null;
}

export async function listSharesByUser(userId: string) {
	return getConvexClient().query(api.shares.listByUser, { userId });
}

/** Supprime un partage (ownership). Renvoie true si supprimé. */
export async function deleteShare(
	userId: string,
	shareId: string,
): Promise<boolean> {
	const trackId = await getConvexClient().mutation(api.shares.deleteShare, {
		userId,
		shareId,
	});
	return trackId !== null;
}

export async function getSharePublicMeta(shareId: string) {
	return getConvexClient().query(api.shares.getPublicMeta, { shareId });
}

export async function detachShareStoredTrack(shareId: string): Promise<void> {
	await getConvexClient()
		.mutation(api.shares.detachStored, { shareId })
		.catch(() => {});
}

export async function incrementSharePlays(shareId: string): Promise<void> {
	await getConvexClient().mutation(api.shares.incrementPlays, { shareId });
}
