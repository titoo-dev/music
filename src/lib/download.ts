// ─────────────────────────────────────────────────────────────────────────────
// Client-side file download of a track. Reads the stored (tagged) copy from
// its presigned R2 URL when the server holds it, else streams
// /api/v1/stream/[trackId] (which falls back to the progressive Deezer engine
// on a cache miss, and persists the file server-side on the way), reports
// byte progress, and hands the blob to the browser as a named file.
// ─────────────────────────────────────────────────────────────────────────────

export interface DownloadableTrack {
	trackId: string;
	title: string;
	artist: string;
	album?: string | null;
	cover?: string | null;
	duration?: number | null;
}

export interface DownloadProgress {
	loaded: number;
	/** null when the server didn't send Content-Length (progressive stream). */
	total: number | null;
}

const ILLEGAL = /[\\/:*?"<>|\u0000-\u001f]+/g;

export function sanitizeFileName(name: string): string {
	const cleaned = name.replace(ILLEGAL, " ").replace(/\s+/g, " ").trim();
	return (cleaned || "track").slice(0, 180);
}

export function extensionFor(contentType: string | null | undefined): string {
	const ct = (contentType || "").toLowerCase();
	if (ct.includes("flac")) return "flac";
	if (ct.includes("mp4") || ct.includes("aac") || ct.includes("m4a")) return "m4a";
	if (ct.includes("ogg")) return "ogg";
	return "mp3";
}

export function fileNameFor(track: Pick<DownloadableTrack, "title" | "artist">, contentType?: string | null): string {
	const base = track.artist ? `${track.artist} - ${track.title}` : track.title;
	return `${sanitizeFileName(base)}.${extensionFor(contentType)}`;
}

/**
 * Fetch the stored copy straight from R2 when the server holds the track:
 * the tagged file, with a Content-Length for the progress bar (was: an
 * uncached track came untagged from the live stream, with no total).
 * Null when there is no presigned URL or R2 refused — the caller then goes
 * through /api/v1/stream.
 */
async function fetchFromPresigned(
	trackId: string,
	presignedUrl: (trackId: string) => Promise<string | null>,
	signal?: AbortSignal
): Promise<Response | null> {
	const url = await presignedUrl(trackId).catch(() => null);
	if (!url || signal?.aborted) return null;
	try {
		const res = await fetch(url, { credentials: "omit", mode: "cors", signal });
		if (res.ok) return res;
		res.body?.cancel().catch(() => {});
	} catch (e) {
		if (signal?.aborted) throw e;
	}
	return null;
}

export async function fetchTrackFile(
	trackId: string,
	onProgress: (p: DownloadProgress) => void,
	signal?: AbortSignal,
	opts: { presignedUrl?: (trackId: string) => Promise<string | null> } = {}
): Promise<{ blob: Blob; contentType: string | null }> {
	const res =
		(opts.presignedUrl && (await fetchFromPresigned(trackId, opts.presignedUrl, signal))) ||
		(await fetch(`/api/v1/stream/${encodeURIComponent(trackId)}`, {
			credentials: "include",
			signal,
		}));
	if (!res.ok) {
		let message = `Download failed (${res.status})`;
		try {
			const json = await res.json();
			if (json?.error?.message) message = json.error.message;
		} catch {
			// Non-JSON error body — keep the status message.
		}
		throw new Error(message);
	}

	const contentType = res.headers.get("content-type");
	const lengthHeader = res.headers.get("content-length");
	const total = lengthHeader ? Number(lengthHeader) || null : null;

	if (!res.body) {
		const blob = await res.blob();
		onProgress({ loaded: blob.size, total: blob.size });
		return { blob, contentType };
	}

	const reader = res.body.getReader();
	const chunks: Uint8Array[] = [];
	let loaded = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			chunks.push(value);
			loaded += value.byteLength;
			onProgress({ loaded, total });
		}
	}
	const blob = new Blob(chunks as BlobPart[], { type: contentType || "audio/mpeg" });
	return { blob, contentType };
}

/**
 * Rate-limit progress reports: the first one and the last one (loaded ===
 * total) always go through, the rest at most every `intervalMs` (was: one
 * store update per network chunk — hundreds per file).
 */
export function throttleProgress(
	report: (p: DownloadProgress) => void,
	intervalMs = 200,
	now: () => number = Date.now
): (p: DownloadProgress) => void {
	let last = -Infinity;
	return (p) => {
		const t = now();
		const complete = p.total !== null && p.loaded >= p.total;
		if (!complete && t - last < intervalMs) return;
		last = t;
		report(p);
	};
}

export function saveBlob(blob: Blob, fileName: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	// Give the browser a tick to start the save before revoking.
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
