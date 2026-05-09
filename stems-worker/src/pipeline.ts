// End-to-end stem-separation pipeline: pulls the source from S3, runs
// Demucs, uploads each stem back to S3, writes one StemFile row per output,
// and bumps the StemSeparation row through processing → completed/failed.
//
// All collaborators are injected so the unit test can drop them in without
// hitting Redis, Postgres, S3, or spawning a subprocess.

import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

export interface DbApi {
	findHighestBitrateStoredTrack: (
		trackId: string,
	) => Promise<{ storagePath: string; storageType: string; bitrate: number } | null>;
	getOrFailSeparation: (
		trackId: string,
	) => Promise<{ id: string; mode: string }>;
	markProcessing: (trackId: string) => Promise<void>;
	updateProgress: (trackId: string, progress: number) => Promise<void>;
	markCompleted: (trackId: string) => Promise<void>;
	markFailed: (trackId: string, errorMessage: string) => Promise<void>;
	insertStemFile: (input: {
		separationId: string;
		trackId: string;
		stemName: string;
		storagePath: string;
		storageType: string;
		fileSize: number | null;
	}) => Promise<void>;
	deleteStemFiles: (trackId: string) => Promise<void>;
}

export interface StorageApi {
	downloadObjectToFile: (storagePath: string, destFile: string) => Promise<void>;
	uploadFileToObject: (
		srcFile: string,
		storagePath: string,
	) => Promise<{ fileSize: number }>;
}

export interface SeparatorApi {
	runSeparation: (options: {
		mode: "two_stems" | "six_stems";
		inputFile: string;
		outputDir: string;
		onProgress?: (percent: number) => void;
	}) => Promise<{ model: string; stemsDir: string }>;
}

export interface FsApi {
	readdir: (dir: string) => Promise<string[]>;
	rm: (target: string) => Promise<void>;
	mkdir: (dir: string) => Promise<void>;
}

export interface PipelineDeps {
	db: DbApi;
	storage: StorageApi;
	separator: SeparatorApi;
	fs: FsApi;
	tmpRoot?: string;
	onJobProgress?: (percent: number) => Promise<void> | void;
}

export interface PipelineInput {
	trackId: string;
	mode: "two_stems" | "six_stems";
}

export async function runPipeline(
	input: PipelineInput,
	deps: PipelineDeps,
): Promise<void> {
	const { trackId, mode } = input;
	const { db, storage, separator, fs: fsApi, onJobProgress } = deps;

	const tmpRoot = deps.tmpRoot ?? tmpdir();
	const workDir = path.join(tmpRoot, `stems-${trackId}-${randomUUID()}`);
	const inputFile = path.join(workDir, "input.mp3");
	const outputDir = path.join(workDir, "out");

	await fsApi.mkdir(workDir);

	try {
		await db.markProcessing(trackId);
		await reportProgress(0, db, trackId, onJobProgress);

		const stored = await db.findHighestBitrateStoredTrack(trackId);
		if (!stored) {
			throw new Error(
				`No StoredTrack for ${trackId} — cannot separate a track that's not cached.`,
			);
		}
		if (stored.storageType !== "s3") {
			throw new Error(
				`Unsupported storage type "${stored.storageType}" for ${trackId} (worker only handles s3).`,
			);
		}

		await storage.downloadObjectToFile(stored.storagePath, inputFile);
		await reportProgress(5, db, trackId, onJobProgress);

		const separation = await db.getOrFailSeparation(trackId);

		const result = await separator.runSeparation({
			mode,
			inputFile,
			outputDir,
			onProgress: (pct) => {
				// Demucs progress 0..100 → reserve 5..95 for the run, 95..100 for upload.
				const mapped = 5 + Math.floor((pct / 100) * 90);
				void reportProgress(mapped, db, trackId, onJobProgress);
			},
		});

		// Wipe any leftover StemFile rows from a previous failed run so we
		// don't end up with mixed-mode rows (e.g. two_stems retried as
		// six_stems, leaving stale "no_vocals" alongside fresh six stems).
		await db.deleteStemFiles(trackId);

		const files = await fsApi.readdir(result.stemsDir);
		for (const filename of files) {
			if (!filename.endsWith(".mp3")) continue;
			const stemName = path.basename(filename, ".mp3");
			const localPath = path.join(result.stemsDir, filename);
			const storagePath = `stems/${trackId}/${stemName}.mp3`;
			const { fileSize } = await storage.uploadFileToObject(
				localPath,
				storagePath,
			);
			await db.insertStemFile({
				separationId: separation.id,
				trackId,
				stemName,
				storagePath,
				storageType: "s3",
				fileSize,
			});
		}

		await reportProgress(100, db, trackId, onJobProgress);
		await db.markCompleted(trackId);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		await db.markFailed(trackId, message).catch(() => {});
		throw e;
	} finally {
		await fsApi.rm(workDir).catch(() => {});
	}
}

async function reportProgress(
	percent: number,
	db: DbApi,
	trackId: string,
	onJobProgress: PipelineDeps["onJobProgress"],
): Promise<void> {
	await db.updateProgress(trackId, percent).catch(() => {});
	if (onJobProgress) {
		try {
			await onJobProgress(percent);
		} catch {
			// progress callback failures must never fail the pipeline
		}
	}
}

// Default fs implementation backed by node:fs/promises so callers in
// production don't have to wire it up by hand.
export const realFs: FsApi = {
	readdir: (dir) => fs.readdir(dir),
	rm: (target) => fs.rm(target, { recursive: true, force: true }),
	mkdir: (dir) => fs.mkdir(dir, { recursive: true }).then(() => undefined),
};
