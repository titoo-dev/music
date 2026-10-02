// Pure helpers shared by BlobStorageProvider (writes) and src/lib/blob-stream.ts
// (reads). Kept free of @vercel/blob imports so route tests can mock the
// network layer while still using the real error guards.

/** Value written to StoredTrack.storageType for files living in Vercel Blob. */
export const BLOB_STORAGE_TYPE = "blob";

/** Every file is private: browsers only ever get short-lived presigned URLs. */
export const BLOB_ACCESS = "private" as const;

/**
 * Map a storagePath (as saved in StoredTrack, e.g. "music/Artist/Album/Track.mp3")
 * to a Blob pathname. Blob has no notion of absolute paths, so leading slashes
 * are dropped, Windows separators normalized and repeated slashes collapsed
 * (Blob rejects "//", which generatePath produces from downloadLocation "music/").
 */
export function toBlobPathname(storagePath: string): string {
	return storagePath.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\//, "");
}

export function inferContentType(path: string): string {
	const ext = path.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "flac":
			return "audio/flac";
		case "mp4":
			return "audio/mp4";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		default:
			return "audio/mpeg";
	}
}

/** The blob does not exist (deleted, never uploaded, stale DB row). */
export class StorageNotFoundError extends Error {
	readonly name = "NotFound";
	constructor(pathname: string) {
		super(`Blob not found: ${pathname}`);
	}
}

/** Blob is unreachable right now — the file may still exist. */
export class StorageUnavailableError extends Error {
	readonly name = "StorageUnavailable";
	constructor(cause: unknown) {
		super("Blob storage unavailable", { cause });
	}
}

export function isStorageNotFound(e: unknown): boolean {
	return e instanceof StorageNotFoundError;
}

export function isStorageUnavailable(e: unknown): boolean {
	return e instanceof StorageUnavailableError;
}
