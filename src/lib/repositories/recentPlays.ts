// Repository recentPlay — Convex (Postgres supprimé, Phase 6). L'éviction S3
// du dépassement de cap reste côté route (maybeEvictFile) ; record renvoie les
// trackIds évincés.

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

export interface PlayMeta {
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	duration: number | null;
}

export async function listRecentPlays(userId: string, limit: number) {
	return (await getConvexClient().query(api.recentPlays.list, {
		userId,
		limit,
	})) as unknown[];
}

export async function recordPlayWithCap(
	userId: string,
	meta: PlayMeta,
	cap: number,
): Promise<string[]> {
	return (await getConvexClient().mutation(api.recentPlays.record, {
		userId,
		trackId: meta.trackId,
		title: meta.title,
		artist: meta.artist,
		album: meta.album,
		albumId: meta.albumId,
		coverUrl: meta.coverUrl,
		duration: meta.duration,
		cap,
	})) as string[];
}

export async function hasRecentPlay(
	userId: string,
	trackId: string,
): Promise<boolean> {
	return (await getConvexClient().query(api.recentPlays.hasPlay, {
		userId,
		trackId,
	})) as boolean;
}
