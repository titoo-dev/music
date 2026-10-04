// S1 repair: legacy StoredTrack rows were keyed by a metadata template
// ("music/{artist} - {title}.mp3"), so different tracks (album / live /
// remaster / clean vs explicit versions) and MP3 128 vs 320 copies of one
// track could share — and overwrite — the same object. Such a row may serve
// another track's audio or the wrong quality. The fix deletes every row
// whose storagePath is shared (rows only: the next play re-caches the track
// under its unique tracks/{trackId}/{bitrate}{ext} key; GC never touches the
// legacy objects). Used by scripts/repair-stored-track-keys.ts.

import { prisma } from "@/lib/prisma";

export interface KeyRow {
	id: string;
	trackId: string;
	bitrate: number;
	storagePath: string;
}

export interface KeyRepairPlan {
	/** storagePath → its rows, for every path used by more than one row. */
	shared: Map<string, KeyRow[]>;
	/** Paths shared by different tracks (served another track's audio). */
	crossTrackPaths: string[];
	/** Paths shared only by bitrates of one track (served the wrong quality). */
	sameTrackPaths: string[];
	/** Rows to delete. */
	rowIds: string[];
}

export function planKeyRepair(rows: KeyRow[]): KeyRepairPlan {
	const byPath = new Map<string, KeyRow[]>();
	for (const row of rows) {
		const list = byPath.get(row.storagePath) ?? [];
		list.push(row);
		byPath.set(row.storagePath, list);
	}
	const shared = new Map([...byPath].filter(([, list]) => list.length > 1));
	const crossTrackPaths: string[] = [];
	const sameTrackPaths: string[] = [];
	for (const [path, list] of shared) {
		(new Set(list.map((r) => r.trackId)).size > 1 ? crossTrackPaths : sameTrackPaths).push(path);
	}
	return {
		shared,
		crossTrackPaths,
		sameTrackPaths,
		rowIds: [...shared.values()].flat().map((r) => r.id),
	};
}

/** Reads every row, plans, and deletes the shared-key rows when `apply`. */
export async function repairSharedKeys({ apply }: { apply: boolean }) {
	const rows: KeyRow[] = await prisma.storedTrack.findMany({
		select: { id: true, trackId: true, bitrate: true, storagePath: true },
	});
	const plan = planKeyRepair(rows);
	let deleted = 0;
	if (apply && plan.rowIds.length > 0) {
		// SharedTrack.storedTrackId is ON DELETE SET NULL; shares re-link on
		// their next play (resolveShareForPlayback).
		({ count: deleted } = await prisma.storedTrack.deleteMany({ where: { id: { in: plan.rowIds } } }));
	}
	return { scanned: rows.length, plan, deleted };
}
