// Lyrics lookup cascade. Order, stopping at the first synced (time-aligned) hit:
//   1. LRCLIB /api/get, exact metadata (title, artist, duration ±2 s)
//   2. LRCLIB /api/get, cleaned title + main artist ("Song (feat. X) - Remastered" → "Song")
//   3. Deezer GW lyrics for the exact track id (started in parallel with 1)
//   4. LRCLIB /api/search — structured, then free text, then title-only — with
//      every candidate scored by `pickBest` (title / artist similarity + duration)
// Plain lyrics are kept as a fallback along the way; synced lyrics whose source
// recording is too long / short to line up are downgraded to plain text.
import { artistVariants, cleanTitle, pickBest, scoreCandidate, type LyricsCandidate, type LyricsQuery } from "./match";
import { hasUsableSync, parseLrc } from "./lrc";

export interface LyricsResult {
	source: "lrclib" | "deezer" | null;
	syncedLyrics: string | null;
	plainLyrics: string | null;
	instrumental: boolean;
}

export interface DeezerLyrics {
	syncedLyrics: string | null;
	plainLyrics: string | null;
}

export interface FindLyricsOptions {
	/** Deezer lyrics for the exact track; started immediately, awaited only if LRCLIB `get` misses. */
	deezer?: () => Promise<DeezerLyrics | null>;
	fetch?: typeof fetch;
	/** Overall LRCLIB time budget in ms (default 9 s); later search steps are skipped past it. */
	budgetMs?: number;
}

export const NO_LYRICS: LyricsResult = { source: null, syncedLyrics: null, plainLyrics: null, instrumental: false };

const LRCLIB = "https://lrclib.net/api";
const USER_AGENT = "wavelet/0.1.0";
const REQUEST_TIMEOUT_MS = 4000;

type Fetch = typeof fetch;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET an LRCLIB endpoint. 404 / errors → null; one retry on 503 (load shedding). */
export async function lrclib<T>(f: Fetch, path: string, params: Record<string, string | number | null | undefined>): Promise<T | null> {
	const qs = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") qs.set(k, String(v));
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const res = await f(`${LRCLIB}${path}?${qs}`, {
				headers: { "User-Agent": USER_AGENT },
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});
			if (res.status === 503 && attempt === 0) {
				const after = Number(res.headers.get("Retry-After"));
				await sleep(Math.min(Number.isFinite(after) && after > 0 ? after * 1000 : 500, 1000));
				continue;
			}
			if (!res.ok) return null;
			return (await res.json()) as T;
		} catch {
			return null;
		}
	}
	return null;
}

function plainFromSync(lrc: string): string {
	return parseLrc(lrc).map((l) => l.text).join("\n");
}

function fromCandidate(c: LyricsCandidate, syncReliable: boolean): LyricsResult {
	const synced = syncReliable && hasUsableSync(c.syncedLyrics) ? c.syncedLyrics : null;
	const plain = c.plainLyrics?.trim() ? c.plainLyrics : c.syncedLyrics ? plainFromSync(c.syncedLyrics) || null : null;
	return {
		source: "lrclib",
		syncedLyrics: synced,
		plainLyrics: plain,
		instrumental: !synced && !plain && !!c.instrumental,
	};
}

const ENOUGH_MATCHES = 5;

function acceptable(q: LyricsQuery, candidates: LyricsCandidate[]) {
	let count = 0;
	for (const c of candidates) if (scoreCandidate(q, c)) count++;
	return { best: pickBest(q, candidates), count };
}

function hasText(r: LyricsResult | null): boolean {
	return !!r && !!(r.syncedLyrics || r.plainLyrics);
}

export async function findLyrics(query: LyricsQuery | null, opts: FindLyricsOptions = {}): Promise<LyricsResult> {
	const f = opts.fetch ?? fetch;
	const deadline = Date.now() + (opts.budgetMs ?? 9000);
	const deezerP: Promise<DeezerLyrics | null> = opts.deezer
		? opts.deezer().catch(() => null)
		: Promise.resolve(null);

	const deezerResult = async (): Promise<LyricsResult | null> => {
		const dz = await deezerP;
		if (!dz) return null;
		const synced = hasUsableSync(dz.syncedLyrics) ? dz.syncedLyrics : null;
		const plain = dz.plainLyrics?.trim() ? dz.plainLyrics : synced ? plainFromSync(synced) : null;
		return synced || plain ? { source: "deezer", syncedLyrics: synced, plainLyrics: plain, instrumental: false } : null;
	};

	if (!query) return (await deezerResult()) ?? NO_LYRICS;

	const duration = query.duration && query.duration >= 1 && query.duration <= 3600 ? Math.round(query.duration) : null;
	const q: LyricsQuery = { ...query, duration };
	const title = cleanTitle(q.title);
	const artists = artistVariants(q.artist);
	const mainArtist = artists[artists.length - 1];

	// 1–2. Exact lookups. LRCLIB already matched duration ±2 s, so their sync is trusted.
	let exact: LyricsResult | null = null;
	const gets: Array<[string, string]> = [[q.title, q.artist]];
	if (title !== q.title || mainArtist !== q.artist) gets.push([title, mainArtist]);
	for (const [track_name, artist_name] of gets) {
		const hit = await lrclib<LyricsCandidate>(f, "/get", { track_name, artist_name, duration });
		if (!hit) continue;
		const r = fromCandidate(hit, true);
		if (r.syncedLyrics) return r;
		if (!exact && (hasText(r) || r.instrumental)) exact = r;
		if (hasText(r)) break;
	}

	// 3. Deezer has the lyrics of this exact recording.
	const dz = await deezerResult();
	if (dz?.syncedLyrics) return dz;

	// 4. Fuzzy search, stopping as soon as an aligned synced match shows up.
	const searches: Array<Record<string, string>> = [
		{ track_name: title, artist_name: mainArtist },
		{ q: `${mainArtist} ${title}` },
		{ track_name: title },
	];
	const pool = new Map<string, LyricsCandidate>();
	let best: ReturnType<typeof pickBest> = null;
	for (const params of searches) {
		if (Date.now() > deadline) break;
		const results = await lrclib<LyricsCandidate[]>(f, "/search", params);
		if (!Array.isArray(results)) continue;
		for (const c of results) pool.set(String(c.id ?? `${c.trackName}|${c.artistName}|${c.duration}`), c);
		const accepted = acceptable(q, [...pool.values()]);
		best = accepted.best;
		if (best?.syncReliable && hasUsableSync(best.candidate.syncedLyrics)) break;
		// Plenty of copies of the right song, none aligned: this recording's
		// length is simply different — more queries won't change that.
		if (accepted.count >= ENOUGH_MATCHES) break;
	}

	const found = best ? fromCandidate(best.candidate, best.syncReliable) : null;
	if (found?.syncedLyrics) return found;
	if (hasText(exact)) return exact!;
	if (dz) return dz;
	if (hasText(found)) return found!;
	if (exact?.instrumental) return exact;
	if (found?.instrumental) return found;
	return NO_LYRICS;
}
