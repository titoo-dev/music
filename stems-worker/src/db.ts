// Persistance du worker stems — Convex uniquement (Postgres supprimé, Phase 6).
// Appelle les fonctions Convex via ConvexHttpClient (références par nom pour
// éviter d'importer le _generated du package principal). Signatures inchangées
// → pipeline.ts (et ses tests qui mockent ce module) ne sont pas affectés.

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

let _convex: ConvexHttpClient | null = null;
function convex(): ConvexHttpClient {
	if (_convex) return _convex;
	const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!url) throw new Error("CONVEX_URL / NEXT_PUBLIC_CONVEX_URL is not set");
	_convex = new ConvexHttpClient(url);
	return _convex;
}
const q = (name: string) => makeFunctionReference<"query">(name);
const m = (name: string) => makeFunctionReference<"mutation">(name);

export interface StoredTrack {
	storagePath: string;
	storageType: string;
	bitrate: number;
}

export async function findHighestBitrateStoredTrack(
	trackId: string,
): Promise<StoredTrack | null> {
	const row = (await convex().query(q("storedTracks:findHighestBitrate"), {
		trackId,
	})) as StoredTrack | null;
	return row
		? {
				storagePath: row.storagePath,
				storageType: row.storageType,
				bitrate: row.bitrate,
			}
		: null;
}

export interface SeparationRow {
	id: string;
	mode: string;
}

export async function getOrFailSeparation(
	trackId: string,
): Promise<SeparationRow> {
	const row = (await convex().query(q("stems:getByTrack"), {
		trackId,
	})) as SeparationRow | null;
	if (!row) {
		throw new Error(`StemSeparation row missing for track ${trackId}`);
	}
	return { id: row.id, mode: row.mode };
}

export async function markProcessing(trackId: string): Promise<void> {
	await convex().mutation(m("stems:markProcessing"), { trackId });
}

export async function updateProgress(
	trackId: string,
	progress: number,
): Promise<void> {
	const clamped = Math.max(0, Math.min(100, Math.round(progress)));
	await convex().mutation(m("stems:updateProgress"), {
		trackId,
		progress: clamped,
	});
}

export async function markCompleted(trackId: string): Promise<void> {
	await convex().mutation(m("stems:markCompleted"), { trackId });
}

export async function markFailed(
	trackId: string,
	errorMessage: string,
): Promise<void> {
	await convex().mutation(m("stems:markFailed"), {
		trackId,
		errorMessage: errorMessage.slice(0, 1000),
	});
}

export interface InsertStemFileInput {
	separationId: string;
	trackId: string;
	stemName: string;
	storagePath: string;
	storageType: string;
	fileSize: number | null;
}

export async function insertStemFile(
	input: InsertStemFileInput,
): Promise<void> {
	await convex().mutation(m("stems:insertStemFile"), {
		separationId: input.separationId,
		trackId: input.trackId,
		stemName: input.stemName,
		storagePath: input.storagePath,
		storageType: input.storageType,
		fileSize: input.fileSize,
	});
}

export async function deleteStemFiles(trackId: string): Promise<void> {
	await convex().mutation(m("stems:deleteStemFiles"), { trackId });
}

export async function closePool(): Promise<void> {
	// no-op : plus de pool Postgres.
}
