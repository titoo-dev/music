// Repository storedTrack — Convex (Postgres supprimé, Phase 6). La suppression
// physique S3 reste côté Next ; ce repo ne gère que les métadonnées.

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

export async function findHighestStored(trackId: string) {
	return getConvexClient().query(api.storedTracks.findHighestBitrate, {
		trackId,
	});
}

export async function hasStored(trackId: string): Promise<boolean> {
	const rows = (await getConvexClient().query(api.storedTracks.findByTrack, {
		trackId,
	})) as unknown[];
	return rows.length > 0;
}

export async function deleteStoredRows(trackId: string): Promise<void> {
	await getConvexClient().mutation(api.storedTracks.deleteByTrack, { trackId });
}

export async function upsertStored(input: {
	trackId: string;
	bitrate: number;
	storagePath: string;
	storageType: string;
	fileSize?: number | null;
}): Promise<void> {
	await getConvexClient().mutation(api.storedTracks.upsert, {
		trackId: input.trackId,
		bitrate: input.bitrate,
		storagePath: input.storagePath,
		storageType: input.storageType,
		fileSize: input.fileSize ?? null,
	});
}
