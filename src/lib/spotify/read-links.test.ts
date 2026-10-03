import { describe, it, expect, vi } from "vitest";
import { readTrackLinks, type TrackLinkBatch, type ReadProgress } from "./read-links";
import type { SpotifyTrackMeta } from "./types";

const meta = (id: string): SpotifyTrackMeta => ({
	spotifyId: id,
	title: `t-${id}`,
	artists: ["a"],
	album: "",
	albumId: null,
	durationMs: 1,
	isrc: null,
	coverUrl: null,
});

const ids = (n: number) => Array.from({ length: n }, (_, i) => `id${i}`);
const ok = (chunk: string[]): TrackLinkBatch => ({ tracks: chunk.map(meta), failed: [], rateLimited: [] });

describe("readTrackLinks", () => {
	it("reads in batches and keeps the pasted order", async () => {
		const fetchBatch = vi.fn(async (chunk: string[]) => ok(chunk));
		const res = await readTrackLinks(ids(60), { fetchBatch, batchSize: 25, sleep: vi.fn() });

		expect(fetchBatch.mock.calls.map(([c]) => c.length)).toEqual([25, 25, 10]);
		expect(res.tracks.map((t) => t.spotifyId)).toEqual(ids(60));
		expect(res.failed).toEqual([]);
	});

	it("pauses on a 429 and resumes where it stopped (was: 500-track paste lost every track after Spotify's rate limit)", async () => {
		const sleep = vi.fn<(ms: number) => Promise<void>>(async () => {});
		const progress: ReadProgress[] = [];
		let refused = false;
		const fetchBatch = vi.fn(async (chunk: string[]) => {
			if (!refused && chunk.includes("id30")) {
				refused = true;
				// read the first 5 of this batch, then Spotify starts refusing
				return { tracks: chunk.slice(0, 5).map(meta), failed: [], rateLimited: chunk.slice(5) };
			}
			return ok(chunk);
		});

		const res = await readTrackLinks(ids(60), {
			fetchBatch,
			batchSize: 25,
			sleep,
			now: () => 1000,
			pauses: [20, 60],
			onProgress: (p) => progress.push(p),
		});

		expect(res.tracks.map((t) => t.spotifyId)).toEqual(ids(60));
		expect(sleep).toHaveBeenCalledWith(20_000);
		expect(progress).toContainEqual({ done: 30, total: 60, resumeAt: 21_000 });
		expect(progress.at(-1)).toEqual({ done: 60, total: 60, resumeAt: null });
	});

	it("escalates the pause while Spotify keeps refusing, then reports the rest as failed", async () => {
		const sleep = vi.fn<(ms: number) => Promise<void>>(async () => {});
		const fetchBatch = vi.fn(async (chunk: string[]) =>
			chunk[0] === "id0" ? ok(chunk) : { tracks: [], failed: [], rateLimited: chunk }
		);

		const res = await readTrackLinks(ids(40), { fetchBatch, batchSize: 25, sleep, pauses: [20, 60] });

		expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([20_000, 60_000]);
		expect(res.tracks).toHaveLength(25);
		expect(res.failed).toEqual(ids(40).slice(25));
	});

	it("passes through tracks Spotify doesn't have", async () => {
		const fetchBatch = vi.fn(async (chunk: string[]) => ({
			tracks: chunk.slice(1).map(meta),
			failed: [chunk[0]],
			rateLimited: [],
		}));
		const res = await readTrackLinks(ids(3), { fetchBatch, sleep: vi.fn() });

		expect(res.failed).toEqual(["id0"]);
		expect(res.tracks.map((t) => t.spotifyId)).toEqual(["id1", "id2"]);
	});

	it("lets a server error reach the caller", async () => {
		const fetchBatch = vi.fn(async () => {
			throw new Error("boom");
		});
		await expect(readTrackLinks(ids(3), { fetchBatch })).rejects.toThrow("boom");
	});
});
