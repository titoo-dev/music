// Pure helpers shared by R2StorageProvider (writes) and src/lib/object-stream.ts
// (reads). Kept free of network code so route tests can mock the R2 layer
// while still using the real error guards.

/**
 * Value written to StoredTrack.storageType for files in the R2 bucket. Rows
 * with any other value (the suspended Vercel Blob store's "blob", older
 * "s3" / "local") are stale: routes drop them and re-stream the track live.
 */
export const STORAGE_TYPE = "r2";

/**
 * Map a storagePath (as saved in StoredTrack, e.g. "music/Artist/Album/Track.mp3")
 * to an object key. Keys have no notion of absolute paths, so leading slashes
 * are dropped, Windows separators normalized and repeated slashes collapsed
 * (generatePath produces "//" from downloadLocation "music/").
 */
export function toObjectKey(storagePath: string): string {
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

/** The object does not exist (deleted, never uploaded, stale DB row). */
export class StorageNotFoundError extends Error {
	readonly name = "NotFound";
	constructor(key: string) {
		super(`Object not found: ${key}`);
	}
}

/** Storage is unreachable or refusing right now — the file may still exist. */
export class StorageUnavailableError extends Error {
	readonly name = "StorageUnavailable";
	constructor(cause: unknown) {
		super("Object storage unavailable", { cause });
	}
}

export function isStorageNotFound(e: unknown): boolean {
	return e instanceof StorageNotFoundError;
}

export function isStorageUnavailable(e: unknown): boolean {
	return e instanceof StorageUnavailableError;
}
