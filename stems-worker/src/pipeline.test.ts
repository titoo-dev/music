import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPipeline, type PipelineDeps } from "./pipeline";

function makeDeps(overrides: Partial<PipelineDeps> = {}): PipelineDeps & {
	db: { [K in keyof PipelineDeps["db"]]: ReturnType<typeof vi.fn> };
	storage: { [K in keyof PipelineDeps["storage"]]: ReturnType<typeof vi.fn> };
	separator: { runSeparation: ReturnType<typeof vi.fn> };
	fs: { [K in keyof PipelineDeps["fs"]]: ReturnType<typeof vi.fn> };
	onJobProgress: ReturnType<typeof vi.fn>;
} {
	const db = {
		findHighestBitrateStoredTrack: vi.fn().mockResolvedValue({
			storagePath: "/data/music/Artist/Album/Track.mp3",
			storageType: "s3",
			bitrate: 320,
		}),
		getOrFailSeparation: vi
			.fn()
			.mockResolvedValue({ id: "sep-1", mode: "six_stems" }),
		markProcessing: vi.fn().mockResolvedValue(undefined),
		updateProgress: vi.fn().mockResolvedValue(undefined),
		markCompleted: vi.fn().mockResolvedValue(undefined),
		markFailed: vi.fn().mockResolvedValue(undefined),
		insertStemFile: vi.fn().mockResolvedValue(undefined),
		deleteStemFiles: vi.fn().mockResolvedValue(undefined),
	};
	const storage = {
		downloadObjectToFile: vi.fn().mockResolvedValue(undefined),
		uploadFileToObject: vi.fn().mockResolvedValue({ fileSize: 1234 }),
	};
	const separator = {
		runSeparation: vi.fn().mockImplementation(async (opts) => {
			opts.onProgress?.(50);
			opts.onProgress?.(100);
			return {
				model: "htdemucs_6s",
				stemsDir: "/tmp/out/htdemucs_6s/input",
			};
		}),
	};
	const fs = {
		readdir: vi
			.fn()
			.mockResolvedValue([
				"vocals.mp3",
				"drums.mp3",
				"bass.mp3",
				"other.mp3",
				"guitar.mp3",
				"piano.mp3",
				"_thumbs.txt",
			]),
		rm: vi.fn().mockResolvedValue(undefined),
		mkdir: vi.fn().mockResolvedValue(undefined),
	};
	const onJobProgress = vi.fn().mockResolvedValue(undefined);
	return {
		db,
		storage,
		separator,
		fs,
		onJobProgress,
		tmpRoot: "/tmp",
		...overrides,
	} as any;
}

describe("runPipeline", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("runs the happy path end-to-end and uploads every mp3 stem", async () => {
		const deps = makeDeps();

		await runPipeline({ trackId: "T1", mode: "six_stems" }, deps);

		expect(deps.db.markProcessing).toHaveBeenCalledWith("T1");
		expect(deps.storage.downloadObjectToFile).toHaveBeenCalledWith(
			"/data/music/Artist/Album/Track.mp3",
			expect.stringContaining("input.mp3"),
		);
		// 6 stems uploaded, _thumbs.txt skipped
		expect(deps.storage.uploadFileToObject).toHaveBeenCalledTimes(6);
		expect(deps.db.insertStemFile).toHaveBeenCalledTimes(6);
		expect(deps.db.deleteStemFiles).toHaveBeenCalledWith("T1");
		expect(deps.db.markCompleted).toHaveBeenCalledWith("T1");
		expect(deps.db.markFailed).not.toHaveBeenCalled();
	});

	it("uses canonical S3 keys stems/{trackId}/{stemName}.mp3", async () => {
		const deps = makeDeps();
		await runPipeline({ trackId: "T1", mode: "six_stems" }, deps);

		const uploads = deps.storage.uploadFileToObject.mock.calls.map((c) => c[1]);
		expect(uploads).toContain("stems/T1/vocals.mp3");
		expect(uploads).toContain("stems/T1/drums.mp3");
		expect(uploads).toContain("stems/T1/piano.mp3");
		expect(uploads).not.toContain("stems/T1/_thumbs.mp3");
	});

	it("inserts each StemFile with the right stem name and storagePath", async () => {
		const deps = makeDeps();
		await runPipeline({ trackId: "T1", mode: "six_stems" }, deps);

		const inserts = deps.db.insertStemFile.mock.calls.map((c) => c[0]);
		const vocals = inserts.find((i) => i.stemName === "vocals");
		expect(vocals).toMatchObject({
			separationId: "sep-1",
			trackId: "T1",
			stemName: "vocals",
			storagePath: "stems/T1/vocals.mp3",
			storageType: "s3",
			fileSize: 1234,
		});
	});

	it("forwards demucs progress to onJobProgress, mapped into the 5..95 band", async () => {
		const deps = makeDeps();
		await runPipeline({ trackId: "T1", mode: "six_stems" }, deps);

		const reported = deps.onJobProgress.mock.calls.map((c) => c[0]);
		// initial 0, post-download 5, demucs progress 50→50%, 100→95%, final 100
		expect(reported[0]).toBe(0);
		expect(reported).toContain(5);
		expect(reported).toContain(50);
		expect(reported).toContain(95);
		expect(reported.at(-1)).toBe(100);
	});

	it("marks the separation failed when no StoredTrack exists", async () => {
		const deps = makeDeps();
		deps.db.findHighestBitrateStoredTrack.mockResolvedValue(null);

		await expect(
			runPipeline({ trackId: "T2", mode: "six_stems" }, deps),
		).rejects.toThrow(/No StoredTrack/);

		expect(deps.db.markFailed).toHaveBeenCalledWith(
			"T2",
			expect.stringContaining("No StoredTrack"),
		);
		expect(deps.db.markCompleted).not.toHaveBeenCalled();
		expect(deps.separator.runSeparation).not.toHaveBeenCalled();
	});

	it("rejects unsupported storage types", async () => {
		const deps = makeDeps();
		deps.db.findHighestBitrateStoredTrack.mockResolvedValue({
			storagePath: "/data/music/x.mp3",
			storageType: "local",
			bitrate: 320,
		});

		await expect(
			runPipeline({ trackId: "T3", mode: "six_stems" }, deps),
		).rejects.toThrow(/Unsupported storage type/);
		expect(deps.db.markFailed).toHaveBeenCalled();
	});

	it("marks failed and re-throws when demucs fails", async () => {
		const deps = makeDeps();
		deps.separator.runSeparation.mockRejectedValue(new Error("boom"));

		await expect(
			runPipeline({ trackId: "T4", mode: "six_stems" }, deps),
		).rejects.toThrow(/boom/);
		expect(deps.db.markFailed).toHaveBeenCalledWith("T4", "boom");
	});

	it("cleans up the work dir even on failure", async () => {
		const deps = makeDeps();
		deps.separator.runSeparation.mockRejectedValue(new Error("boom"));

		await expect(
			runPipeline({ trackId: "T5", mode: "six_stems" }, deps),
		).rejects.toThrow();
		expect(deps.fs.rm).toHaveBeenCalled();
	});

	it("does not clobber the run when onJobProgress throws", async () => {
		const deps = makeDeps();
		deps.onJobProgress.mockRejectedValue(new Error("redis down"));

		await expect(
			runPipeline({ trackId: "T6", mode: "six_stems" }, deps),
		).resolves.toBeUndefined();
		expect(deps.db.markCompleted).toHaveBeenCalledWith("T6");
	});

	it("clears stale StemFile rows before re-inserting on a retry", async () => {
		const deps = makeDeps();
		await runPipeline({ trackId: "T7", mode: "two_stems" }, deps);

		// Delete must come before any insert so the unique (trackId, stemName)
		// index never sees a stale row that would conflict.
		const deleteOrder = deps.db.deleteStemFiles.mock.invocationCallOrder[0];
		const firstInsertOrder = deps.db.insertStemFile.mock.invocationCallOrder[0];
		expect(deleteOrder).toBeLessThan(firstInsertOrder);
	});
});
