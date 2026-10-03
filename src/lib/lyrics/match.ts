// Fuzzy matching between the track being played and lyrics candidates
// (LRCLIB search results). Pure — no I/O — so the whole ranking is unit-tested.

export interface LyricsQuery {
	title: string;
	artist: string;
	album?: string | null;
	/** Seconds. Null when unknown. */
	duration?: number | null;
}

export interface LyricsCandidate {
	id?: number;
	trackName: string;
	artistName: string;
	albumName?: string | null;
	duration?: number | null;
	instrumental?: boolean;
	plainLyrics?: string | null;
	syncedLyrics?: string | null;
}

export interface ScoredCandidate {
	candidate: LyricsCandidate;
	score: number;
	/** False when the durations are too far apart for the timestamps to line up. */
	syncReliable: boolean;
}

/** Synced lines drift visibly beyond this gap between recording lengths. */
export const SYNC_TOLERANCE_S = 3;
/** Past this gap it is very likely a different recording (live, extended mix…). */
export const MAX_DURATION_GAP_S = 15;
const MIN_TITLE_SIM = 0.72;
const MIN_ARTIST_SIM = 0.5;
export const MIN_SCORE = 0.6;

// Words that mark a version / release suffix rather than part of the song's name.
const VERSION_WORDS = [
	"feat", "ft", "featuring", "with", "prod",
	"remaster", "remastered", "remasterizado", "remasterizada", "remasterise",
	"version", "edit", "radio", "single", "album", "mono", "stereo", "mix", "remix",
	"explicit", "clean", "deluxe", "bonus", "original", "official", "video", "audio",
	"lyric", "lyrics", "visualizer", "anniversary", "edition", "live", "acoustic",
	"instrumental", "demo", "session", "from", "soundtrack", "ost", "bande originale",
	"extended", "short", "sped up", "slowed", "reverb", "en vivo", "ao vivo", "version originale",
];
const VERSION_RE = new RegExp(`\\b(${VERSION_WORDS.join("|")})\\b|\\b(19|20)\\d{2}\\b`);
// Tested on the normalized text so accents / casing / punctuation don't matter.
const isVersionTag = (s: string) => VERSION_RE.test(normalize(s));
const FEAT_RE = /\s+(?:\(|\[)?\s*(?:feat\.?|ft\.?|featuring)\s+[^)\]]*(?:\)|\])?/gi;

/** Lower-case, strip accents / punctuation, collapse whitespace. */
export function normalize(s: string): string {
	return s
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[’‘`´]/g, "'")
		.replace(/&/g, " and ")
		.replace(/\$/g, "s")
		.replace(/'/g, "")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim()
		.replace(/\s+/g, " ");
}

/**
 * Drop release noise from a title: "(feat. X)", "[Remastered 2011]",
 * "- Radio Edit", "(Official Video)"… Song-name parentheses such as
 * "(I Can't Get No) Satisfaction" are kept.
 */
export function cleanTitle(title: string): string {
	let t = title.replace(FEAT_RE, " ");
	// Bracketed groups carrying a version word.
	t = t.replace(/\s*[([{]([^)\]}]*)[)\]}]/g, (m, inner: string) => (isVersionTag(inner) ? " " : m));
	// Trailing " - Remastered 2009" / " – Live at Wembley".
	t = t.replace(/\s+[-–—]\s+([^-–—]+)$/, (m, tail: string) => (isVersionTag(tail) ? "" : m));
	t = t.replace(/\s+/g, " ").trim();
	return t || title.trim();
}

/** Every title worth trying, most specific first, de-duplicated. */
export function titleVariants(title: string): string[] {
	const out = [title.trim(), cleanTitle(title)];
	// Strip every remaining bracket group ("Song (Pt. 2)" → "Song").
	const bare = cleanTitle(title).replace(/\s*[([{][^)\]}]*[)\]}]/g, "").trim();
	if (bare) out.push(bare);
	return dedupe(out);
}

/** The full artist string, then the main artist alone ("A, B & C" → "A"). */
export function artistVariants(artist: string): string[] {
	const full = artist.replace(FEAT_RE, " ").replace(/\s+/g, " ").trim();
	const main = full.split(/\s*(?:,|;|\/|\s&\s|\sx\s|\sX\s|\s×\s|\svs\.?\s|\set\s|\sand\s|\sy\s|\se\s)\s*/)[0]?.trim();
	return dedupe([artist.trim(), full, main ?? ""]);
}

function dedupe(values: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const v of values) {
		const k = normalize(v);
		if (!v || !k || seen.has(k)) continue;
		seen.add(k);
		out.push(v);
	}
	return out;
}

function bigrams(s: string): Map<string, number> {
	const m = new Map<string, number>();
	const p = s.replace(/ /g, "");
	for (let i = 0; i < p.length - 1; i++) {
		const g = p.slice(i, i + 2);
		m.set(g, (m.get(g) ?? 0) + 1);
	}
	return m;
}

/** 0..1 similarity of two raw strings (Sørensen–Dice on bigrams, after normalize). */
export function similarity(a: string, b: string): number {
	const x = normalize(a);
	const y = normalize(b);
	if (!x || !y) return 0;
	if (x === y) return 1;
	// Whole-word containment ("Blinding Lights" in "Blinding Lights Extended"):
	// only strong when the shorter side covers most of the longer one, so
	// "Love" never matches "I Love You".
	const [short, long] = x.length <= y.length ? [x, y] : [y, x];
	const contained = ` ${long} `.includes(` ${short} `) ? 0.5 + 0.4 * (short.length / long.length) : 0;
	if (x.length < 2 || y.length < 2) return contained;
	const bx = bigrams(x);
	const by = bigrams(y);
	let inter = 0;
	let total = 0;
	for (const [g, n] of bx) {
		inter += Math.min(n, by.get(g) ?? 0);
		total += n;
	}
	for (const n of by.values()) total += n;
	const dice = total ? (2 * inter) / total : 0;
	return Math.max(dice, contained);
}

function best(as: string[], bs: string[]): number {
	let m = 0;
	for (const a of as) for (const b of bs) m = Math.max(m, similarity(a, b));
	return m;
}

/** "Artist - Title" uploads put the artist in the track name; peel it off. */
function candidateTitles(c: LyricsCandidate, artists: string[]): string[] {
	const out = titleVariants(c.trackName);
	const dash = c.trackName.match(/^(.+?)\s+[-–—]\s+(.+)$/);
	if (dash && best([dash[1]], artists) >= 0.8) out.push(...titleVariants(dash[2]));
	return out;
}

function durationScore(gap: number | null): number {
	if (gap === null) return 0.5;
	if (gap <= 2) return 1;
	if (gap <= SYNC_TOLERANCE_S) return 0.9;
	if (gap <= 6) return 0.6;
	if (gap <= 10) return 0.35;
	return 0.15;
}

/** Score one candidate against the query, or null when it is not the same song. */
export function scoreCandidate(query: LyricsQuery, c: LyricsCandidate): ScoredCandidate | null {
	if (!c.trackName || (!c.plainLyrics && !c.syncedLyrics && !c.instrumental)) return null;

	const qArtists = artistVariants(query.artist);
	const cArtists = c.artistName ? artistVariants(c.artistName) : [];
	const titleSim = best(titleVariants(query.title), candidateTitles(c, qArtists));
	if (titleSim < MIN_TITLE_SIM) return null;

	// Some uploads leave the artist field empty / as the uploader; accept when
	// the artist appears in the track or album name instead.
	let artistSim = cArtists.length ? best(qArtists, cArtists) : 0;
	if (artistSim < MIN_ARTIST_SIM) {
		const hay = normalize(`${c.trackName} ${c.albumName ?? ""}`);
		if (qArtists.some((a) => normalize(a).length > 2 && ` ${hay} `.includes(` ${normalize(a)} `))) artistSim = 0.7;
	}
	if (artistSim < MIN_ARTIST_SIM) return null;

	const gap =
		query.duration && c.duration && c.duration > 0 ? Math.abs(query.duration - c.duration) : null;
	if (gap !== null && gap > MAX_DURATION_GAP_S && !(c.plainLyrics && titleSim >= 0.95 && artistSim >= 0.9)) {
		return null;
	}
	// An "instrumental" flag must not hide real lyrics: only trust it on a near-exact hit.
	if (c.instrumental && !c.plainLyrics && !c.syncedLyrics && (gap === null || gap > 2 || titleSim < 0.95)) {
		return null;
	}

	const albumBonus = query.album && c.albumName && similarity(cleanTitle(query.album), cleanTitle(c.albumName)) >= 0.85 ? 0.03 : 0;
	const syncReliable = !!c.syncedLyrics && (gap === null ? true : gap <= SYNC_TOLERANCE_S);
	const score =
		titleSim * 0.45 + artistSim * 0.3 + durationScore(gap) * 0.25 + (syncReliable ? 0.05 : 0) + albumBonus;
	return { candidate: c, score, syncReliable };
}

/** Best acceptable candidate; synced-and-aligned wins over plain at similar scores. */
export function pickBest(query: LyricsQuery, candidates: LyricsCandidate[]): ScoredCandidate | null {
	let top: ScoredCandidate | null = null;
	for (const c of candidates) {
		const s = scoreCandidate(query, c);
		if (!s || s.score < MIN_SCORE) continue;
		if (!top || s.score > top.score) top = s;
	}
	return top;
}
