// Conservative storage garbage collection (daily cron, /api/v1/internal/gc).
//
//  0. SharedTrack links expired for more than 30 days.
//  1. StoredTrack rows older than 24 h whose track has no reference at all
//     (SavedTrack, AlbumTrack, live SharedTrack, RecentPlay) and no persist in
//     flight: the row goes, and its object too unless another row still
//     points at it. Catches orphans left by a skip during a persist.
//  2. Objects under tracks/ older than 24 h that no row points at (an upload
//     whose DB write failed, rows deleted by the key repair script, ...).
//
// Bounded per run (rows and listing pages) so it fits the route's duration.

import { prisma } from "@/lib/prisma";
import { getTrackRefCount } from "@/lib/library";
import { hasActivePersistLease } from "./persist-lease";
import { TRACKS_PREFIX } from "./objects";
import { listObjectsPage } from "./r2";

export const GC_MIN_AGE_MS = 24 * 60 * 60 * 1000;
/** Expired share links stay listed (as "Expired") this long, then go. */
export const EXPIRED_SHARE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export interface GcOptions {
	/** Deletes one object; should swallow "already gone". */
	deleteObject: (key: string) => Promise<void>;
	now?: number;
	/** Candidate rows examined per run. */
	maxRows?: number;
	/** ListObjectsV2 pages (1000 keys each) scanned per run. */
	maxListPages?: number;
	/** Test seam for the bucket listing. */
	listPage?: typeof listObjectsPage;
}

export interface GcReport {
	rowsDeleted: number;
	objectsDeleted: number;
	objectsScanned: number;
	orphanObjectsDeleted: number;
	expiredSharesDeleted: number;
}

interface CandidateRow {
	id: string;
	trackId: string;
	storagePath: string;
}

export async function collectStorageGarbage(opts: GcOptions): Promise<GcReport> {
	const now = opts.now ?? Date.now();
	const cutoff = new Date(now - GC_MIN_AGE_MS);
	const maxRows = opts.maxRows ?? 500;
	const maxListPages = opts.maxListPages ?? 10;
	const listPage = opts.listPage ?? listObjectsPage;
	const report: GcReport = {
		rowsDeleted: 0,
		objectsDeleted: 0,
		objectsScanned: 0,
		orphanObjectsDeleted: 0,
		expiredSharesDeleted: 0,
	};

	// 0. Share links expired long enough ago that their owner no longer
	// needs to see them in their list.
	const purged = await prisma.sharedTrack.deleteMany({
		where: { expiresAt: { lt: new Date(now - EXPIRED_SHARE_RETENTION_MS) } },
	});
	report.expiredSharesDeleted = purged.count;

	// 1. Unreferenced rows. The SQL pre-filter keeps the batch useful (old but
	// referenced rows would otherwise fill it forever); every track is
	// re-checked right before deleting.
	const candidates = await prisma.$queryRaw<CandidateRow[]>`
		SELECT st."id", st."trackId", st."storagePath"
		FROM "stored_track" st
		WHERE st."createdAt" < ${cutoff}
			AND NOT EXISTS (SELECT 1 FROM "saved_track" x WHERE x."trackId" = st."trackId")
			AND NOT EXISTS (SELECT 1 FROM "album_track" x WHERE x."trackId" = st."trackId")
			AND NOT EXISTS (SELECT 1 FROM "shared_track" x WHERE x."trackId" = st."trackId"
				AND (x."expiresAt" IS NULL OR x."expiresAt" > ${new Date(now)}))
			AND NOT EXISTS (SELECT 1 FROM "recent_play" x WHERE x."trackId" = st."trackId")
		ORDER BY st."createdAt" ASC
		LIMIT ${maxRows}`;

	const byTrack = new Map<string, CandidateRow[]>();
	for (const row of candidates ?? []) {
		const rows = byTrack.get(row.trackId) ?? [];
		rows.push(row);
		byTrack.set(row.trackId, rows);
	}
	for (const [trackId, rows] of byTrack) {
		const refs = await getTrackRefCount(trackId, now);
		if (refs.total > 0 || (await hasActivePersistLease(trackId, now))) continue;
		const { count } = await prisma.storedTrack.deleteMany({
			where: { id: { in: rows.map((r) => r.id) }, createdAt: { lt: cutoff } },
		});
		report.rowsDeleted += count;
		for (const path of new Set(rows.map((r) => r.storagePath))) {
			if ((await prisma.storedTrack.count({ where: { storagePath: path } })) > 0) continue;
			await opts.deleteObject(path);
			report.objectsDeleted++;
		}
	}

	// 2. Orphan objects under the C9 prefix (legacy "music/" keys are left alone).
	let token: string | undefined;
	let pages = 0;
	do {
		const page = await listPage(TRACKS_PREFIX, token);
		pages++;
		report.objectsScanned += page.objects.length;
		const old = page.objects.filter((o) => o.lastModified.getTime() < cutoff.getTime());
		if (old.length > 0) {
			const rows = await prisma.storedTrack.findMany({
				where: { storagePath: { in: old.map((o) => o.key) } },
				select: { storagePath: true },
			});
			const used = new Set((rows ?? []).map((r: { storagePath: string }) => r.storagePath));
			for (const o of old) {
				if (used.has(o.key)) continue;
				await opts.deleteObject(o.key);
				report.orphanObjectsDeleted++;
			}
		}
		token = page.nextToken;
	} while (token && pages < maxListPages);

	return report;
}
