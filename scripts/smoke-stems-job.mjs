// One-shot smoke test: push a fake stems job and watch the worker fail
// with "No StoredTrack" — that proves BullMQ ↔ worker ↔ Postgres are wired
// up end-to-end without needing a real cached track.
//
// Usage: node scripts/smoke-stems-job.mjs

import { Queue } from "bullmq";
import IORedis from "ioredis";

const url = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = new IORedis(url, { maxRetriesPerRequest: null });

// Insert a StemSeparation row first so the worker reaches the StoredTrack
// lookup (otherwise it fails earlier on getOrFailSeparation).
import pg from "pg";
const dbUrl =
	process.env.DATABASE_URL ?? "postgresql://deemix:deemix@localhost:15432/deemix";
const pool = new pg.Pool({ connectionString: dbUrl });

const trackId = "SMOKE_TEST_TRACK_" + Date.now();

await pool.query(
	`INSERT INTO stem_separation
	    (id, "trackId", status, mode, progress, "createdAt", "updatedAt")
	 VALUES ($1, $2, 'pending', 'two_stems', 0, NOW(), NOW())
	 ON CONFLICT ("trackId") DO NOTHING`,
	["smoke-" + Date.now(), trackId],
);

const q = new Queue("stems", { connection });
await q.add("separate", { trackId, mode: "two_stems" }, { jobId: trackId });
console.log(`Pushed smoke-test job for trackId=${trackId}`);
console.log("Watch: docker compose logs stems-worker --tail 20");

await q.close();
await connection.quit();
await pool.end();
