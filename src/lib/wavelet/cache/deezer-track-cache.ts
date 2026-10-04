// In-memory TTL cache for Deezer track metadata responses.
// Skips repeat roundtrips to deezer.com when the same track is played within
// the cache window — typical for queue replays, share links, or consecutive
// plays from the same album.
//
// We cache two types of responses:
//   1. gw.get_track_with_fallback(trackId)   → keyed by Deezer user + trackId
//   2. get_tracks_url(trackToken, format)    → keyed by trackToken+format
//
// The gw track answer carries the caller's TRACK_TOKEN, a short-lived token
// signed for that Deezer user (and filesizes that depend on their licence),
// so it is cached per Deezer user (gwTrackKey), never shared between
// accounts. TTL stays well under the token's expiry (typically ~1 hour).
//
// Track URLs (the encrypted CDN URL) are derived from a user-specific
// trackToken, so caching by trackToken is also safe across users (each user
// gets their own token from their gw response).

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 500;

interface Entry<T> {
	value: T;
	expiresAt: number;
}

class TtlCache<T> {
	private store = new Map<string, Entry<T>>();

	get(key: string): T | null {
		const entry = this.store.get(key);
		if (!entry) return null;
		if (Date.now() > entry.expiresAt) {
			this.store.delete(key);
			return null;
		}
		// LRU touch — keep recently-accessed entries fresh in iteration order
		this.store.delete(key);
		this.store.set(key, entry);
		return entry.value;
	}

	set(key: string, value: T): void {
		if (this.store.size >= MAX_ENTRIES) {
			const oldest = this.store.keys().next().value;
			if (oldest) this.store.delete(oldest);
		}
		this.store.set(key, { value, expiresAt: Date.now() + TTL_MS });
	}

	delete(key: string): void {
		this.store.delete(key);
	}
}

export const gwTrackCache = new TtlCache<unknown>();
export const trackUrlCache = new TtlCache<string>();

/**
 * gwTrackCache key: the Deezer user the answer was fetched for + the track.
 * `deezerUserId` is dz.currentUser.id (undefined before login: "anon").
 */
export function gwTrackKey(
	deezerUserId: string | number | null | undefined,
	trackId: string | number
): string {
	return `${deezerUserId ?? "anon"}::${trackId}`;
}

export function trackUrlKey(trackToken: string, format: string): string {
	return `${trackToken}::${format}`;
}
