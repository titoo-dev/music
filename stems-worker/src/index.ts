import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";

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
		console.log(`[stems-worker] received job ${job.id} (track=${trackId}, mode=${mode})`);
		// PR 3 will replace this stub with the real Demucs pipeline.
		throw new Error("stems-worker pipeline not implemented yet (PR 3)");
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
	await worker.close();
	await connection.quit();
	process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
