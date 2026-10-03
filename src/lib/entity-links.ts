/**
 * Where an artist / album name links to. Every place that prints one of those
 * names goes through these helpers so the routes stay in one spot.
 *
 * Library rows (saved tracks, playlists, recent plays, saved albums, shares)
 * only store the artist *name*, so an artist without a Deezer id links to
 * `/artist?name=…` and the artist page resolves it through search (albums the
 * same way, by title + artist).
 */

type Id = string | number | null | undefined;

const present = (id: Id): id is string | number => id != null && String(id).trim() !== "" && String(id) !== "0";

export function artistHref(id: Id, name?: string | null): string | null {
	if (present(id)) return `/artist?id=${encodeURIComponent(String(id))}`;
	const n = name?.trim();
	return n ? `/artist?name=${encodeURIComponent(n)}` : null;
}

/** By id; rows that only kept the title link to `/album?title=…&artist=…`, resolved by the album page. */
export function albumHref(id: Id, title?: string | null, artist?: string | null): string | null {
	if (present(id)) return `/album?id=${encodeURIComponent(String(id))}`;
	const t = title?.trim();
	if (!t) return null;
	const a = artist?.trim();
	return `/album?title=${encodeURIComponent(t)}${a ? `&artist=${encodeURIComponent(primaryArtistName(a))}` : ""}`;
}

/** "A, B", "A feat. B", "A ft B", "A (feat. B)" → "A". Ampersands stay ("Simon & Garfunkel"). */
export function primaryArtistName(name: string): string {
	const first = name.split(/\s*,\s*|\s+\(?(?:feat\.?|ft\.?|featuring)\s+/i)[0] ?? name;
	return first.trim() || name.trim();
}

const norm = (s: string) =>
	s
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();

/**
 * Picks the Deezer artist a printed name refers to: an exact (accent / case
 * insensitive) match on the full name, then on the primary artist, then
 * Deezer's top-ranked result.
 */
export function pickArtistId(name: string, results: Array<{ id?: Id; name?: string | null }>): string | null {
	const candidates = results.filter((r) => present(r.id));
	if (!candidates.length) return null;
	const full = norm(name);
	const primary = norm(primaryArtistName(name));
	const hit = candidates.find((r) => norm(r.name ?? "") === full) ?? candidates.find((r) => norm(r.name ?? "") === primary) ?? candidates[0];
	return String(hit.id);
}

/**
 * Picks the Deezer album a printed title refers to: same title (accent / case
 * insensitive) by the same artist, then same title, then the first result by
 * that artist, then Deezer's top-ranked result.
 */
export function pickAlbumId(title: string, artist: string | null | undefined, results: Array<{ id?: Id; title?: string | null; artist?: { name?: string | null } | null }>): string | null {
	const candidates = results.filter((r) => present(r.id));
	if (!candidates.length) return null;
	const t = norm(title);
	const a = artist ? norm(primaryArtistName(artist)) : null;
	const byArtist = (r: (typeof candidates)[number]) => a != null && norm(r.artist?.name ?? "") === a;
	const sameTitle = (r: (typeof candidates)[number]) => norm(r.title ?? "") === t;
	const hit = candidates.find((r) => sameTitle(r) && byArtist(r)) ?? candidates.find(sameTitle) ?? candidates.find(byArtist) ?? candidates[0];
	return String(hit.id);
}
