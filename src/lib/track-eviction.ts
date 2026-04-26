// Track storage eviction.
// When a track is "evicted" (skipped <30s, or pushed out of the recent-plays
// cap), we delete the audio file from storage but KEEP the metadata so the
// track can be re-streamed (and re-cached) later. The metadata lives in
// DownloadHistory rows; we just null out storagePath/storedTrackId and
// remove the global StoredTrack rows + the actual files.

import { prisma } from "@/lib/prisma";
import { getDeemixApp } from "@/lib/server-state";

/**
 * Evict storage for a single trackId. Removes the audio file(s) from the
 * configured StorageProvider, deletes StoredTrack rows for this track, and
 * nulls storagePath/storedTrackId on every DownloadHistory pointing at it.
 *
 * Returns the number of files actually removed (0 if nothing was stored).
 */
export async function evictTrackStorage(trackId: string): Promise<number> {
	const stored = await prisma.storedTrack.findMany({
		where: { trackId },
		select: { id: true, storagePath: true },
	});

	if (stored.length === 0) {
		// Nothing in StoredTrack but a DownloadHistory row could still hold a
		// direct storagePath (legacy) — null it out for consistency.
		await prisma.downloadHistory.updateMany({
			where: { trackId, storagePath: { not: null } },
			data: { storagePath: null, storedTrackId: null },
		});
		return 0;
	}

	const app = await getDeemixApp();
	const storageProvider = app?.storageProvider;
	let deleted = 0;

	if (storageProvider) {
		for (const row of stored) {
			try {
				await storageProvider.deleteFile(row.storagePath);
				deleted++;
			} catch (e) {
				console.error(
					`[evictTrackStorage] failed to delete ${row.storagePath}:`,
					e
				);
			}
		}
	}

	const storedIds = stored.map((s) => s.id);

	// Null out per-user rows that reference these StoredTracks
	await prisma.downloadHistory.updateMany({
		where: {
			OR: [{ storedTrackId: { in: storedIds } }, { trackId }],
		},
		data: { storagePath: null, storedTrackId: null },
	});

	// Remove SharedTrack rows that reference these StoredTracks (otherwise
	// the FK delete below would fail). Their share links become dead — fine,
	// the file no longer exists anyway.
	await prisma.sharedTrack.deleteMany({
		where: { storedTrackId: { in: storedIds } },
	});

	await prisma.storedTrack.deleteMany({
		where: { id: { in: storedIds } },
	});

	return deleted;
}
