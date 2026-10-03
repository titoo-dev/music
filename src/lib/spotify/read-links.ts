// Client-driven reading of pasted track links. Spotify's embed pages refuse
// (429) after a few hundred requests from one IP and stay closed for
// minutes, so a single request can't read 500 tracks reliably. The browser
// sends small batches, pauses when Spotify pushes back, and resumes where it
// stopped; the server only ever spends a few seconds per batch.

import type { SpotifyTrackMeta } from "./types";

export interface TrackLinkBatch {
	tracks: SpotifyTrackMeta[];
	failed: string[];
	rateLimited: string[];
}

export interface ReadProgress {
	done: number;
	total: number;
	// Set while paused for Spotify's rate limit: epoch ms when reading resumes.
	resumeAt: number | null;
}

export interface ReadTrackLinksOptions {
	fetchBatch: (ids: string[]) => Promise<TrackLinkBatch>;
	onProgress?: (p: ReadProgress) => void;
	sleep?: (ms: number) => Promise<void>;
	now?: () => number;
	batchSize?: number;
	// Successive pauses (s) when a batch reads nothing; past the last one the
	// remaining links are reported as failed.
	pauses?: number[];
}

export const DEFAULT_BATCH_SIZE = 25;
export const DEFAULT_PAUSES = [20, 45, 90, 120];

export async function readTrackLinks(
	ids: string[],
	{
		fetchBatch,
		onProgress,
		sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
		now = Date.now,
		batchSize = DEFAULT_BATCH_SIZE,
		pauses = DEFAULT_PAUSES,
	}: ReadTrackLinksOptions
): Promise<{ tracks: SpotifyTrackMeta[]; failed: string[] }> {
	const read = new Map<string, SpotifyTrackMeta>();
	const failed = new Set<string>();
	let queue = [...ids];
	let pauseIdx = 0;
	const report = (resumeAt: number | null = null) =>
		onProgress?.({ done: read.size + failed.size, total: ids.length, resumeAt });

	report();
	while (queue.length) {
		const chunk = queue.slice(0, batchSize);
		const batch = await fetchBatch(chunk);
		for (const t of batch.tracks) read.set(t.spotifyId, t);
		for (const id of batch.failed) failed.add(id);

		const retry = new Set(batch.rateLimited);
		const handled = chunk.filter((id) => !retry.has(id));
		queue = [...batch.rateLimited, ...queue.slice(batchSize)];
		report();

		if (!retry.size) continue;
		if (handled.length === 0) {
			if (pauseIdx >= pauses.length) {
				queue.forEach((id) => failed.add(id));
				break;
			}
			const ms = pauses[pauseIdx++] * 1000;
			report(now() + ms);
			await sleep(ms);
		} else {
			// Partial batch: Spotify just started refusing — give it the first pause.
			const ms = pauses[0] * 1000;
			report(now() + ms);
			await sleep(ms);
		}
		report();
	}

	return {
		tracks: ids.flatMap((id) => {
			const t = read.get(id);
			return t ? [t] : [];
		}),
		failed: ids.filter((id) => failed.has(id)),
	};
}
