// BullMQ queue for stem-separation jobs. The queue lives in the Next.js
// process (producer) and the stems-worker container (consumer). Both connect
// to the same Redis via REDIS_URL.
//
// Job dedup: jobId = trackId. Concurrent requests for the same track collapse
// into a single worker run; once it completes the row in StemSeparation
// becomes the cache and subsequent calls short-circuit before reaching here.
//
// Re-running after completion: completed jobs are evicted after 24h (see
// removeOnComplete.age), at which point the same trackId can be re-queued.

import { Queue } from "bullmq";
import IORedis, { type Redis } from "ioredis";

export type StemMode = "two_stems" | "six_stems";

export interface SeparateJobData {
	trackId: string;
	mode: StemMode;
}

export type StemJobState =
	| "waiting"
	| "active"
	| "delayed"
	| "completed"
	| "failed"
	| "paused"
	| "stuck"
	| "prioritized"
	| "waiting-children"
	| "unknown";

export interface StemJobStatus {
	state: StemJobState;
	progress: number;
	failedReason?: string;
}

const QUEUE_NAME = "stems";

// BullMQ rejects custom job IDs that look like integers (`Error: Custom Id
// cannot be integers`) AND custom IDs that contain `:` (`Error: Custom Id
// cannot contain :`). Deezer track IDs are numeric strings, so we prefix
// them with `track-`. The same prefix has to be used everywhere we read
// or write a job keyed on trackId.
const JOB_ID_PREFIX = "track-";
function jobIdFor(trackId: string): string {
	return `${JOB_ID_PREFIX}${trackId}`;
}

let _connection: Redis | null = null;
let _queue: Queue<SeparateJobData> | null = null;

function getConnection(): Redis {
	if (_connection) return _connection;
	const url = process.env.REDIS_URL;
	if (!url) throw new Error("REDIS_URL is not set");
	_connection = new IORedis(url, { maxRetriesPerRequest: null });
	return _connection;
}

function getQueue(): Queue<SeparateJobData> {
	if (_queue) return _queue;
	_queue = new Queue<SeparateJobData>(QUEUE_NAME, {
		connection: getConnection(),
		defaultJobOptions: {
			removeOnComplete: { age: 86400 },
			removeOnFail: { age: 3600 },
			attempts: 2,
			backoff: { type: "exponential", delay: 30000 },
		},
	});
	return _queue;
}

export async function enqueueSeparation(trackId: string, mode: StemMode) {
	const queue = getQueue();
	return queue.add("separate", { trackId, mode }, { jobId: jobIdFor(trackId) });
}

export async function getJobStatus(trackId: string): Promise<StemJobStatus | null> {
	const queue = getQueue();
	const job = await queue.getJob(jobIdFor(trackId));
	if (!job) return null;
	const state = (await job.getState()) as StemJobState;
	const progress = typeof job.progress === "number" ? job.progress : 0;
	return {
		state,
		progress,
		failedReason: job.failedReason,
	};
}
