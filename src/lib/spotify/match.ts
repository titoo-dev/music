// Spotify → Deezer matching pipeline.
//
// Cascade (stop at first hit):
//   1. ISRC exact (highest confidence; ~70-80% of well-tagged catalogues).
//   2. Advanced search (artist + track + album), filtered by duration.
//   3. Advanced search (artist + track), with title cleanup variants.
//   4. Free-text search "title artist" — last-resort fuzzy.
//
// Anything below `MIN_FUZZY_SCORE` is treated as not_found rather than a
// silent low-quality match — the import UI surfaces the misses so the user
// can fix them by hand. Lying with a wrong track is much worse than a gap.

import { DataException } from "@/lib/deezer/errors";
import type { Deezer } from "@/lib/deezer/deezer";
import type { DeezerTrack } from "@/lib/deezer/schema/track-schema";
import type { SpotifyTrackMeta } from "./types";

export type MatchStrategy = "isrc" | "advanced" | "advanced-clean" | "fuzzy";

export interface MatchSuccess {
	status: "matched";
	strategy: MatchStrategy;
	confidence: number; // 0..1
	deezerTrackId: string;
	title: string;
	artist: string;
	album: string;
	albumId: string | null;
	coverUrl: string | null;
	duration: number; // seconds
}

export interface MatchFailure {
	status: "not_found";
	reason: string;
}

export type MatchResult = MatchSuccess | MatchFailure;

const DURATION_TOLERANCE_S = 3;
const MIN_FUZZY_SCORE = 0.72;

// ─── Normalization ──────────────────────────────────────────────────────────

const NOISE_PATTERNS: RegExp[] = [
	/\s*[-–—]\s*remaster(ed)?(\s+\d{4})?$/i,
	/\s*[-–—]\s*\d{4}\s*remaster(ed)?$/i,
	/\s*[-–—]\s*(deluxe|expanded|special|anniversary)(\s+edition)?$/i,
	/\s*[-–—]\s*(live|acoustic|instrumental|radio edit|single version|album version|mono|stereo)(\s+version)?$/i,
	/\s*\((feat\.?|featuring|with|prod\.?\s+by|prod\.?)\s+[^)]+\)\s*/gi,
	/\s*\[(feat\.?|featuring|with|prod\.?\s+by|prod\.?)\s+[^\]]+\]\s*/gi,
	/\s*\((remaster(ed)?|deluxe|live|acoustic|instrumental|radio edit|single version|album version|mono|stereo|\d{4}\s+remaster(ed)?)[^)]*\)\s*/gi,
];

export function cleanTitle(title: string): string {
	let out = title;
	for (const re of NOISE_PATTERNS) out = out.replace(re, " ");
	return out.replace(/\s+/g, " ").trim();
}

function stripDiacritics(s: string): string {
	return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizeForCompare(s: string): string {
	return stripDiacritics(s)
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

// Token-set overlap (Jaccard-like) — order- and duplicate-insensitive.
function tokenScore(a: string, b: string): number {
	const ta = new Set(normalizeForCompare(a).split(" ").filter(Boolean));
	const tb = new Set(normalizeForCompare(b).split(" ").filter(Boolean));
	if (!ta.size || !tb.size) return 0;
	let overlap = 0;
	for (const t of ta) if (tb.has(t)) overlap++;
	return overlap / Math.max(ta.size, tb.size);
}

interface SearchTrackResult {
	id: number;
	title: string;
	duration: number;
	artist: { name: string };
	album: { title: string };
}

interface SearchResponse {
	data?: SearchTrackResult[];
}

// ─── Result extraction ──────────────────────────────────────────────────────

function fromIsrcResult(t: DeezerTrack): MatchSuccess {
	return {
		status: "matched",
		strategy: "isrc",
		confidence: 1,
		deezerTrackId: String(t.id),
		title: t.title,
		artist: t.artist.name,
		album: t.album.title,
		albumId: t.album.id ? String(t.album.id) : null,
		coverUrl: t.album.cover_medium || t.album.cover || null,
		duration: t.duration,
	};
}

function fromSearchResult(
	t: SearchTrackResult,
	strategy: MatchStrategy,
	confidence: number,
	cover: string | null
): MatchSuccess {
	return {
		status: "matched",
		strategy,
		confidence,
		deezerTrackId: String(t.id),
		title: t.title,
		artist: t.artist.name,
		album: t.album.title,
		albumId: null,
		coverUrl: cover,
		duration: t.duration,
	};
}

// Search results carry album cover URLs in album.cover_medium (some shapes).
// The schema isn't strict here; we read defensively.
function pickSearchCover(t: SearchTrackResult): string | null {
	const album = t.album as SearchTrackResult["album"] & {
		cover_medium?: string;
		cover?: string;
	};
	return album.cover_medium ?? album.cover ?? null;
}

// ─── Scoring search candidates ──────────────────────────────────────────────

function scoreCandidate(
	candidate: SearchTrackResult,
	target: SpotifyTrackMeta
): number {
	const titleScore = tokenScore(cleanTitle(candidate.title), cleanTitle(target.title));
	const artistScore = tokenScore(
		candidate.artist.name,
		target.artists[0] ?? ""
	);
	const targetDurS = Math.round(target.durationMs / 1000);
	const durDelta = Math.abs(candidate.duration - targetDurS);
	const durScore =
		durDelta <= DURATION_TOLERANCE_S
			? 1
			: durDelta <= 6
				? 0.6
				: durDelta <= 15
					? 0.2
					: 0;

	// Weighted blend. Title matters most, then artist, then duration as tiebreak.
	return titleScore * 0.55 + artistScore * 0.3 + durScore * 0.15;
}

function pickBest(
	candidates: SearchTrackResult[],
	target: SpotifyTrackMeta
): { candidate: SearchTrackResult; score: number } | null {
	if (!candidates.length) return null;
	let best: { candidate: SearchTrackResult; score: number } | null = null;
	for (const c of candidates.slice(0, 8)) {
		const score = scoreCandidate(c, target);
		if (!best || score > best.score) best = { candidate: c, score };
	}
	return best;
}

// ─── Strategies ─────────────────────────────────────────────────────────────

async function tryIsrc(
	dz: Deezer,
	target: SpotifyTrackMeta
): Promise<MatchSuccess | null> {
	if (!target.isrc) return null;
	try {
		const t = await dz.api.getTrackByISRC(target.isrc);
		if (!t?.id) return null;
		return fromIsrcResult(t);
	} catch (e) {
		// Deezer returns DataException (code 800) when ISRC isn't in catalogue.
		if (e instanceof DataException) return null;
		// Any other error — let the caller fall back to search.
		return null;
	}
}

async function tryAdvanced(
	dz: Deezer,
	target: SpotifyTrackMeta,
	strategy: MatchStrategy,
	filters: { artist?: string; track?: string; album?: string },
	threshold: number
): Promise<MatchSuccess | null> {
	const resp = (await dz.api.advanced_search(filters, { limit: 10 })) as SearchResponse;
	const best = pickBest(resp.data ?? [], target);
	if (!best || best.score < threshold) return null;
	return fromSearchResult(
		best.candidate,
		strategy,
		best.score,
		pickSearchCover(best.candidate)
	);
}

async function tryFreeText(
	dz: Deezer,
	target: SpotifyTrackMeta
): Promise<MatchSuccess | null> {
	const query = `${cleanTitle(target.title)} ${target.artists.join(" ")}`.trim();
	if (!query) return null;
	const resp = (await dz.api.search_track(query, { limit: 10 })) as SearchResponse;
	const best = pickBest(resp.data ?? [], target);
	if (!best || best.score < MIN_FUZZY_SCORE) return null;
	return fromSearchResult(
		best.candidate,
		"fuzzy",
		best.score,
		pickSearchCover(best.candidate)
	);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function matchTrack(
	dz: Deezer,
	target: SpotifyTrackMeta
): Promise<MatchResult> {
	const isrcHit = await tryIsrc(dz, target);
	if (isrcHit) return isrcHit;

	const primaryArtist = target.artists[0] ?? "";

	// 2. Advanced search with cleaned title + album. Stricter threshold.
	if (primaryArtist && target.album) {
		const hit = await tryAdvanced(
			dz,
			target,
			"advanced",
			{
				artist: primaryArtist,
				track: cleanTitle(target.title),
				album: target.album,
			},
			0.8
		);
		if (hit) return hit;
	}

	// 3. Drop the album constraint (frequent cause of misses: re-issues,
	//    different region, single vs album versions).
	if (primaryArtist) {
		const hit = await tryAdvanced(
			dz,
			target,
			"advanced-clean",
			{ artist: primaryArtist, track: cleanTitle(target.title) },
			0.78
		);
		if (hit) return hit;
	}

	// 4. Free-text fallback.
	const fuzzy = await tryFreeText(dz, target);
	if (fuzzy) return fuzzy;

	return {
		status: "not_found",
		reason: target.isrc
			? "Track not found on Deezer (ISRC + search both missed)"
			: "Track not found on Deezer (no ISRC; search missed)",
	};
}

// Convenience: bounded-concurrency batch matcher for the import route.
export async function matchTracks(
	dz: Deezer,
	targets: SpotifyTrackMeta[],
	options: { concurrency?: number; onProgress?: (done: number, total: number) => void } = {}
): Promise<MatchResult[]> {
	const concurrency = Math.max(1, Math.min(options.concurrency ?? 8, 16));
	const results = new Array<MatchResult>(targets.length);
	let cursor = 0;
	let done = 0;

	const worker = async () => {
		while (true) {
			const idx = cursor++;
			if (idx >= targets.length) return;
			try {
				results[idx] = await matchTrack(dz, targets[idx]);
			} catch (e) {
				results[idx] = {
					status: "not_found",
					reason: e instanceof Error ? e.message : "Unknown matcher error",
				};
			}
			done++;
			options.onProgress?.(done, targets.length);
		}
	};

	await Promise.all(Array.from({ length: concurrency }, worker));
	return results;
}
