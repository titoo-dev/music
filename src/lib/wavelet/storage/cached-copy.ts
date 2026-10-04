// Which cached copy (StoredTrack row) may serve a play. One rule for every
// reader: stream-url, stream, the stream-progressive cache check, public
// shares and stream-warm.
//
// Rows are compared by quality RANK, never by the raw TrackFormats number:
// MP3_MISC (8) is the worst MP3, MP3_320 (3) beats MP3_128 (1), FLAC (9) is
// the best stereo format. With M = server maxBitrate and E = M capped by the
// listener's licence:
//   best = highest-rank row stored in R2 with rank <= rank(M)
//   serve best when rank(best) >= rank(E), or when best.requestedBitrate
//   (what the persisting play asked for) >= rank(E): Deezer had nothing
//   better for that request. Otherwise the progressive play re-persists an
//   upgraded copy ("upgrade").
// Listeners without a licence (public shares, unknown credential) are never
// sent to an upgrade: they get the best copy as it is.

import { TrackFormats } from "@/lib/deezer";
import { prisma } from "@/lib/prisma";
import { STORAGE_TYPE } from "./objects";

export interface StreamLicence {
	canStreamHq: boolean;
	canStreamLossless: boolean;
}

const RANK: Record<number, number> = {
	[TrackFormats.LOCAL]: 0,
	[TrackFormats.DEFAULT]: 0,
	[TrackFormats.MP3_128]: 1,
	[TrackFormats.MP3_320]: 2,
	[TrackFormats.FLAC]: 3,
	[TrackFormats.MP4_RA1]: 4,
	[TrackFormats.MP4_RA2]: 5,
	[TrackFormats.MP4_RA3]: 6,
};

/** Quality rank of a TrackFormats value (unknown → 0, the lowest). */
export function qualityRank(bitrate: number | null | undefined): number {
	return bitrate == null ? 0 : (RANK[bitrate] ?? 0);
}

/**
 * The best format `licence` may stream, at most `maxBitrate`. FLAC and the
 * 360 formats need can_stream_lossless, MP3_320 needs can_stream_hq. An
 * unknown licence (null) does not cap.
 */
export function capByLicence(maxBitrate: number, licence: StreamLicence | null | undefined): number {
	if (!licence) return maxBitrate;
	const rank = qualityRank(maxBitrate);
	if (rank >= qualityRank(TrackFormats.FLAC) && !licence.canStreamLossless) {
		return licence.canStreamHq ? TrackFormats.MP3_320 : TrackFormats.MP3_128;
	}
	if (rank === qualityRank(TrackFormats.MP3_320) && !licence.canStreamHq) {
		return TrackFormats.MP3_128;
	}
	return maxBitrate;
}

/** Licence of a logged-in Deezer session (dz.currentUser); null when unknown. */
export function licenceFromDeezerUser(
	user: { can_stream_hq?: boolean; can_stream_lossless?: boolean } | null | undefined
): StreamLicence | null {
	if (!user) return null;
	return { canStreamHq: !!user.can_stream_hq, canStreamLossless: !!user.can_stream_lossless };
}

export interface CachedRow {
	id: string;
	trackId: string;
	bitrate: number;
	storagePath: string;
	storageType: string;
	requestedBitrate?: number | null;
}

export interface CacheQuery {
	/** Server-wide maxBitrate (M); null = unknown, no cap. */
	maxBitrate: number | null;
	/** The listener's licence; null = none / unknown (no upgrades). */
	licence: StreamLicence | null;
	/** Send under-quality copies to an upgrade. Default: only with a licence. */
	upgrade?: boolean;
}

export type CachedCopyDecision<T extends CachedRow> =
	/** Serve `row`. */
	| { kind: "hit"; row: T; stale: T[] }
	/** A copy exists but the listener may get better: re-persist (live=1). */
	| { kind: "upgrade"; best: T; stale: T[] }
	/** Nothing usable. */
	| { kind: "miss"; stale: T[] };

/** Pure C6 decision over the rows of one track. `stale` = rows in older storage. */
export function chooseCachedCopy<T extends CachedRow>(rows: T[], q: CacheQuery): CachedCopyDecision<T> {
	const stale = rows.filter((r) => r.storageType !== STORAGE_TYPE);
	// An unknown server setting (not a TrackFormats value) does not cap.
	const capped = q.maxBitrate != null && q.maxBitrate in RANK;
	const maxRank = capped ? qualityRank(q.maxBitrate) : Infinity;
	let best: T | null = null;
	for (const r of rows) {
		if (r.storageType !== STORAGE_TYPE || qualityRank(r.bitrate) > maxRank) continue;
		if (!best || qualityRank(r.bitrate) > qualityRank(best.bitrate)) best = r;
	}
	if (!best) return { kind: "miss", stale };

	const upgrade = q.upgrade ?? q.licence != null;
	if (!upgrade || !capped) return { kind: "hit", row: best, stale };
	const wanted = qualityRank(capByLicence(q.maxBitrate as number, q.licence));
	const asked = qualityRank(best.requestedBitrate ?? best.bitrate);
	if (qualityRank(best.bitrate) >= wanted || asked >= wanted) return { kind: "hit", row: best, stale };
	return { kind: "upgrade", best, stale };
}

/** Loads every StoredTrack row of `trackId` and applies chooseCachedCopy. */
export async function findCachedCopy(trackId: string, q: CacheQuery) {
	const rows = (await prisma.storedTrack.findMany({ where: { trackId } })) ?? [];
	return chooseCachedCopy(rows, q);
}

/** Licence columns of the user's DeezerCredential; null without one (or on error). */
export async function loadStreamLicence(userId: string): Promise<StreamLicence | null> {
	try {
		const cred = await prisma.deezerCredential.findUnique({
			where: { userId },
			select: { canStreamHq: true, canStreamLossless: true },
		});
		return cred ? { canStreamHq: !!cred.canStreamHq, canStreamLossless: !!cred.canStreamLossless } : null;
	} catch {
		return null;
	}
}

/** Server maxBitrate (fresh settings) or null when the app is unavailable. */
export async function serverMaxBitrate(): Promise<number | null> {
	try {
		const { getWaveletApp } = await import("@/lib/server-state");
		const app = await getWaveletApp();
		if (!app) return null;
		const settings = await app.freshSettings();
		return typeof settings?.maxBitrate === "number" ? settings.maxBitrate : Number(settings?.maxBitrate) || null;
	} catch {
		return null;
	}
}

/** M and the user's licence, for readers that only know the user id. */
export async function resolveCacheQuery(userId: string): Promise<CacheQuery> {
	const [maxBitrate, licence] = await Promise.all([serverMaxBitrate(), loadStreamLicence(userId)]);
	return { maxBitrate, licence };
}
