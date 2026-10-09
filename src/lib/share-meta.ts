// Metadata of a public share link. It comes from the client and is shown on
// a public page and fetched by the OG image renderer, so it is cleaned here.

/** Longest title / artist / album kept on a share. */
export const MAX_SHARE_TEXT = 200;

/** Longest duration kept, in seconds (a day). */
const MAX_DURATION = 24 * 60 * 60;

function isDeezerImageHost(host: string) {
	return host === "dzcdn.net" || host.endsWith(".dzcdn.net") || host === "api.deezer.com";
}

/** The URL when it is https Deezer artwork, else null. */
export function safeCoverUrl(value: unknown): string | null {
	if (typeof value !== "string") return null;
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	return url.protocol === "https:" && isDeezerImageHost(url.hostname) ? url.toString() : null;
}

function text(value: unknown): string {
	return typeof value === "string" ? value.trim().slice(0, MAX_SHARE_TEXT) : "";
}

export interface ShareMeta {
	title: string;
	artist: string;
	album: string | null;
	coverUrl: string | null;
	duration: number | null;
}

export function sanitizeShareMeta(body: Record<string, unknown> | null | undefined): ShareMeta {
	const d = body?.duration;
	return {
		title: text(body?.title),
		artist: text(body?.artist),
		album: text(body?.album) || null,
		coverUrl: safeCoverUrl(body?.coverUrl),
		duration: typeof d === "number" && Number.isFinite(d) && d >= 0 && d <= MAX_DURATION ? Math.floor(d) : null,
	};
}
