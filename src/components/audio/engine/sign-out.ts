// What the player forgets when the signed-in user goes away (sign-out or
// another account): the presigned URL cache and its per-track refusals, the
// prefetch pools and warm levels, and the IndexedDB audio cache — the
// Service Worker serves that one for /api/v1/stream/{id} without asking the
// server (was: cached audio kept playing after sign-out).

import { clearCache } from "@/lib/audio-cache";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { presignedUrls } from "./presigned-urls";
import { resetPrefetchState } from "./prefetch";

/** Written by AudioEngine on pagehide to resume a refresh where it was. */
const RESUME_KEY = "wavelet-resume";

export function forgetSignedInState(deps: { clearAudioCache?: () => Promise<void> } = {}): Promise<void> {
	presignedUrls.reset();
	resetPrefetchState();
	// The player too: the persisted queue and resume position are the previous
	// user's, and they can't be streamed without a session anyway (was: the
	// last track stayed in the player bar after sign-out).
	usePlayerStore.getState().stop();
	try {
		localStorage.removeItem(RESUME_KEY);
	} catch {
		// Storage disabled — nothing to forget
	}
	return (deps.clearAudioCache ?? clearCache)().catch(() => {});
}

interface UserStore {
	getState(): { user: { id: string } | null };
	subscribe(listener: (state: { user: { id: string } | null }) => void): () => void;
}

/**
 * Call `onSignOut` whenever a signed-in user goes away — signed out, or
 * replaced by another account. The first sign-in (null → user) of a page
 * load is not a sign-out.
 */
export function watchSignOut(store: UserStore, onSignOut: () => void): () => void {
	let current = store.getState().user?.id ?? null;
	return store.subscribe((state) => {
		const next = state.user?.id ?? null;
		if (current !== null && next !== current) onSignOut();
		current = next;
	});
}
