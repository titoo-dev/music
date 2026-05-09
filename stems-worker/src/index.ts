import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";

import * as db from "./db.js";
import * as storage from "./storage.js";
import { runSeparation } from "./separator.js";
import { realFs, runPipeline } from "./pipeline.js";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
	console.error("[stems-worker] REDIS_URL is required");
	process.exit(1);
}

const connection = new IORedis(REDIS_URL, {
	maxRetriesPerRequest: null,
});

connection.on("error", (err) => {
	console.error("[stems-worker] redis error:", err.message);
});

interface SeparateJobData {
	trackId: string;
	mode: "two_stems" | "six_stems";
}

const worker = new Worker<SeparateJobData>(
	"stems",
	async (job: Job<SeparateJobData>) => {
		const { trackId, mode } = job.data;
		console.log(
			`[stems-worker] starting job ${job.id} (track=${trackId}, mode=${mode})`,
		);
		await runPipeline(
			{ trackId, mode },
			{
				db,
				storage,
				separator: { runSeparation },
				fs: realFs,
				onJobProgress: (pct) => job.updateProgress(pct),
			},
		);
		console.log(`[stems-worker] completed job ${job.id}`);
	},
	{
		connection,
		concurrency: 1,
		lockDuration: 15 * 60 * 1000,
	},
);

worker.on("ready", () => {
	console.log("[stems-worker] ready, waiting for jobs on queue 'stems'");
});

worker.on("failed", (job, err) => {
	console.error(`[stems-worker] job ${job?.id} failed:`, err.message);
});

const shutdown = async (signal: string) => {
	console.log(`[stems-worker] received ${signal}, closing...`);
	try {
		await worker.close();
		await connection.quit();
		await db.closePool();
	} finally {
		process.exit(0);
	}
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
