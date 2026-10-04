// Cross-instance dedup of progressive persists (C4). The in-memory download
// lock only sees its own instance; this lease row makes a second instance
// stream the track live (without persisting and without waiting) while
// another one is downloading + uploading it.
//
// Acquire = atomic insert of (trackId, bitrate); when the row exists, a
// conditional update takes it over only once its expiresAt has passed (a
// holder killed at maxDuration never released it). Postgres re-checks the
// WHERE on the locked row, so two contenders can never both take over.

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

/** Longer than the progressive route's maxDuration (300 s). */
export const PERSIST_LEASE_TTL_MS = 330_000;

export interface PersistLease {
	holder: string;
	/** Deletes the row if this holder still owns it. Never throws. */
	release(): Promise<void>;
}

export type LeaseResult = { acquired: true; lease: PersistLease } | { acquired: false };

function isUniqueViolation(e: unknown): boolean {
	return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2002";
}

export async function acquirePersistLease(
	trackId: string,
	bitrate: number,
	opts: { now?: number; ttlMs?: number; holder?: string } = {}
): Promise<LeaseResult> {
	const now = opts.now ?? Date.now();
	const holder = opts.holder ?? randomUUID();
	const expiresAt = new Date(now + (opts.ttlMs ?? PERSIST_LEASE_TTL_MS));
	const lease: PersistLease = {
		holder,
		release: async () => {
			try {
				await prisma.persistLease.deleteMany({ where: { trackId, bitrate, holder } });
			} catch (e) {
				console.warn("[persist-lease] release failed (expires on its own):", e);
			}
		},
	};

	try {
		await prisma.persistLease.create({ data: { trackId, bitrate, holder, expiresAt } });
		return { acquired: true, lease };
	} catch (e) {
		if (!isUniqueViolation(e)) throw e;
	}
	const { count } = await prisma.persistLease.updateMany({
		where: { trackId, bitrate, expiresAt: { lt: new Date(now) } },
		data: { holder, expiresAt, createdAt: new Date(now) },
	});
	return count === 1 ? { acquired: true, lease } : { acquired: false };
}

/** True while some instance holds an unexpired lease on any bitrate of the track. */
export async function hasActivePersistLease(trackId: string, now = Date.now()): Promise<boolean> {
	const live = await prisma.persistLease.count({ where: { trackId, expiresAt: { gt: new Date(now) } } });
	return live > 0;
}
