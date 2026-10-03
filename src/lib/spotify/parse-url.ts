// Accepts any of:
//   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc
//   https://open.spotify.com/intl-fr/playlist/37i9dQZF1DXcBWIGoYBM5M
//   spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
//   37i9dQZF1DXcBWIGoYBM5M
//
// Spotify IDs are 22-char base62 strings.

const ID_PATTERN = /^[A-Za-z0-9]{22}$/;

export function parsePlaylistInput(input: string): string | null {
	const raw = input.trim();
	if (!raw) return null;

	if (ID_PATTERN.test(raw)) return raw;

	const uriMatch = raw.match(/^spotify:playlist:([A-Za-z0-9]{22})$/);
	if (uriMatch) return uriMatch[1];

	try {
		const url = new URL(raw);
		if (!/(^|\.)spotify\.com$/.test(url.hostname)) return null;
		const segments = url.pathname.split("/").filter(Boolean);
		const idx = segments.indexOf("playlist");
		if (idx === -1 || idx === segments.length - 1) return null;
		const candidate = segments[idx + 1];
		return ID_PATTERN.test(candidate) ? candidate : null;
	} catch {
		return null;
	}
}

// Track links as Spotify desktop copies them (select all tracks of a
// playlist, Ctrl+C): one https://open.spotify.com/track/{id} per line. Also
// matches links glued together by a single-line field, since IDs are fixed
// width. Returns unique IDs in first-seen order.
const TRACK_LINK = /(?:open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]+)?\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/gi;

export function parseTrackLinks(input: string): string[] {
	const ids = new Set<string>();
	for (const m of input.matchAll(TRACK_LINK)) ids.add(m[1]);
	return [...ids];
}
