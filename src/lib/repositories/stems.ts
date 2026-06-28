// Repository stemSeparation / stemFile — Convex (Postgres supprimé, Phase 6).

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

interface StemFileShape {
	stemName: string;
	storagePath: string;
	storageType: string;
	fileSize: number | null;
}
interface SeparationShape {
	trackId: string;
	status: string;
	mode: string;
	progress: number;
	errorMessage?: string | null;
}

export async function getSeparationWithFiles(trackId: string) {
	const sep = (await getConvexClient().query(api.stems.getByTrack, {
		trackId,
	})) as SeparationShape | null;
	if (!sep) return null;
	const files = (await getConvexClient().query(api.stems.listFiles, {
		trackId,
	})) as StemFileShape[];
	return { ...sep, files };
}

export async function getSeparation(trackId: string) {
	return getConvexClient().query(api.stems.getByTrack, { trackId });
}

export async function upsertPendingSeparation(trackId: string, mode: string) {
	await getConvexClient().mutation(api.stems.upsertSeparation, {
		trackId,
		mode,
		status: "pending",
	});
	return { trackId, status: "pending", mode, progress: 0 };
}

export async function getStemFile(trackId: string, stemName: string) {
	const files = (await getConvexClient().query(api.stems.listFiles, {
		trackId,
	})) as StemFileShape[];
	return files.find((f) => f.stemName === stemName) ?? null;
}

export async function deleteStemFileByName(
	trackId: string,
	stemName: string,
): Promise<void> {
	await getConvexClient().mutation(api.stems.deleteFileByStem, {
		trackId,
		stemName,
	});
}

export async function deleteStemFiles(trackId: string): Promise<void> {
	await getConvexClient().mutation(api.stems.deleteStemFiles, { trackId });
}
