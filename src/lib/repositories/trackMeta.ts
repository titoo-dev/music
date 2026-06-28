// Repository métadonnées de piste (fallback lyrics) — Convex (Phase 6).

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

export async function getSavedTrackMeta(userId: string, trackId: string) {
	return getConvexClient().query(api.savedTracks.getMeta, { userId, trackId });
}

export async function getRecentPlayMeta(userId: string, trackId: string) {
	return getConvexClient().query(api.recentPlays.getMeta, { userId, trackId });
}
