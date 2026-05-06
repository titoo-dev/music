// Cache layer in front of matchTrack(): looks up TrackMatch by source+sourceId
// and only invokes the cascade matcher on a cache miss. Negative results
// (not_found) are stored too, but with a shorter effective TTL so a track
// added to Deezer later eventually gets re-tried.

import { prisma } from "@/lib/prisma";
import type { Deezer } from "@/lib/deezer/deezer";
import { matchTrack, type MatchResult } from "./match";
import type { SpotifyTrackMeta } from "./types";

const NEG_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for "not found" entries

export interface ResolvedMatch {
	source: "spotify";
	sourceId: string;
	deezerTrackId: string | null;
	strategy: string | null;
	confidence: number | null;
	cached: boolean;
}

interface LookupOptions {
	skipCache?: boolean; // force re-resolution (e.g. user "retry")
}

export async function getOrResolveMatch(
	dz: Deezer,
	target: SpotifyTrackMeta,
	options: LookupOptions = {}
): Promise<ResolvedMatch> {
	const source = "spotify";
	const sourceId = target.spotifyId;

	if (!options.skipCache) {
		const cached = await prisma.trackMatch.findUnique({
			where: { source_sourceId: { source, sourceId } },
		});
		if (cached) {
			const isNegativeAndStale =
				cached.deezerTrackId === null &&
				cached.resolvedAt.getTime() < Date.now() - NEG_TTL_MS;
			if (!isNegativeAndStale) {
				return {
					source,
					sourceId,
					deezerTrackId: cached.deezerTrackId,
					strategy: cached.strategy,
					confidence: cached.confidence,
					cached: true,
				};
			}
		}
	}

	const result = await matchTrack(dz, target);
	const persisted = await persistMatch(source, sourceId, target.isrc, result);
	return { ...persisted, cached: false };
}

// Bulk variant for the suggestion endpoint: looks up many sourceIds in one
// query, returning a Map<sourceId, ResolvedMatch | null>. Misses are
// returned as null (caller decides whether to resolve them synchronously
// or just annotate as unmatched).
export async function lookupCachedMatches(
	sourceIds: string[]
): Promise<Map<string, ResolvedMatch>> {
	if (sourceIds.length === 0) return new Map();
	const rows = await prisma.trackMatch.findMany({
		where: { source: "spotify", sourceId: { in: sourceIds } },
	});
	const map = new Map<string, ResolvedMatch>();
	for (const row of rows) {
		if (
			row.deezerTrackId === null &&
			row.resolvedAt.getTime() < Date.now() - NEG_TTL_MS
		) {
			continue; // stale negative — let caller treat as miss
		}
		map.set(row.sourceId, {
			source: "spotify",
			sourceId: row.sourceId,
			deezerTrackId: row.deezerTrackId,
			strategy: row.strategy,
			confidence: row.confidence,
			cached: true,
		});
	}
	return map;
}

async function persistMatch(
	source: string,
	sourceId: string,
	isrc: string | null,
	result: MatchResult
): Promise<ResolvedMatch> {
	const data =
		result.status === "matched"
			? {
					deezerTrackId: result.deezerTrackId,
					strategy: result.strategy,
					confidence: result.confidence,
					isrc,
				}
			: {
					deezerTrackId: null,
					strategy: "not_found",
					confidence: null,
					isrc,
				};

	await prisma.trackMatch.upsert({
		where: { source_sourceId: { source, sourceId } },
		create: {
			source,
			sourceId,
			...data,
			resolvedAt: new Date(),
		},
		update: { ...data, resolvedAt: new Date() },
	});

	return {
		source: "spotify",
		sourceId,
		deezerTrackId: data.deezerTrackId,
		strategy: data.strategy,
		confidence: data.confidence,
		cached: false,
	};
}
