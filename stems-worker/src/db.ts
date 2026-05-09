// Minimal Postgres client for the worker — raw SQL avoids duplicating the
// Prisma generator config across packages.
//
// Column names stay camelCase: Prisma 7 only snake_cases identifiers when
// explicitly @map'd (only @@map for the table is set in schema.prisma).
// Postgres folds unquoted identifiers to lowercase, so every column must
// be double-quoted in queries.

import { createId } from "@paralleldrive/cuid2";
import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function pool(): pg.Pool {
	if (_pool) return _pool;
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");
	_pool = new Pool({ connectionString: url, max: 4 });
	return _pool;
}

export interface StoredTrack {
	storagePath: string;
	storageType: string;
	bitrate: number;
}

export async function findHighestBitrateStoredTrack(
	trackId: string,
): Promise<StoredTrack | null> {
	const res = await pool().query<{
		storagePath: string;
		storageType: string;
		bitrate: number;
	}>(
		`SELECT "storagePath", "storageType", bitrate
		   FROM stored_track
		  WHERE "trackId" = $1
		  ORDER BY bitrate DESC
		  LIMIT 1`,
		[trackId],
	);
	return res.rows[0] ?? null;
}

export interface SeparationRow {
	id: string;
	mode: string;
}

export async function getOrFailSeparation(
	trackId: string,
): Promise<SeparationRow> {
	const res = await pool().query<{ id: string; mode: string }>(
		`SELECT id, mode FROM stem_separation WHERE "trackId" = $1`,
		[trackId],
	);
	const row = res.rows[0];
	if (!row) {
		throw new Error(`StemSeparation row missing for track ${trackId}`);
	}
	return row;
}

export async function markProcessing(trackId: string): Promise<void> {
	await pool().query(
		`UPDATE stem_separation
		    SET status = 'processing',
		        progress = 0,
		        "startedAt" = NOW(),
		        "updatedAt" = NOW(),
		        "errorMessage" = NULL
		  WHERE "trackId" = $1`,
		[trackId],
	);
}

export async function updateProgress(
	trackId: string,
	progress: number,
): Promise<void> {
	const clamped = Math.max(0, Math.min(100, Math.round(progress)));
	await pool().query(
		`UPDATE stem_separation
		    SET progress = $1, "updatedAt" = NOW()
		  WHERE "trackId" = $2`,
		[clamped, trackId],
	);
}

export async function markCompleted(trackId: string): Promise<void> {
	await pool().query(
		`UPDATE stem_separation
		    SET status = 'completed',
		        progress = 100,
		        "completedAt" = NOW(),
		        "updatedAt" = NOW()
		  WHERE "trackId" = $1`,
		[trackId],
	);
}

export async function markFailed(
	trackId: string,
	errorMessage: string,
): Promise<void> {
	await pool().query(
		`UPDATE stem_separation
		    SET status = 'failed',
		        "errorMessage" = $1,
		        "updatedAt" = NOW()
		  WHERE "trackId" = $2`,
		[errorMessage.slice(0, 1000), trackId],
	);
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
	await pool().query(
		`INSERT INTO stem_file
		    (id, "separationId", "trackId", "stemName", "storagePath", "storageType", "fileSize", "createdAt")
		 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		 ON CONFLICT ("trackId", "stemName")
		 DO UPDATE SET
		    "storagePath" = EXCLUDED."storagePath",
		    "storageType" = EXCLUDED."storageType",
		    "fileSize" = EXCLUDED."fileSize"`,
		[
			createId(),
			input.separationId,
			input.trackId,
			input.stemName,
			input.storagePath,
			input.storageType,
			input.fileSize,
		],
	);
}

export async function deleteStemFiles(trackId: string): Promise<void> {
	await pool().query(`DELETE FROM stem_file WHERE "trackId" = $1`, [trackId]);
}

export async function closePool(): Promise<void> {
	if (_pool) {
		await _pool.end();
		_pool = null;
	}
}
