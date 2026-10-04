// What the player forgets when the signed-in user goes away (sign-out or
// another account): the presigned URL cache and its per-track refusals, the
// prefetch pools and warm levels, and the IndexedDB audio cache — the
// Service Worker serves that one for /api/v1/stream/{id} without asking the
// server (was: cached audio kept playing after sign-out).

import { clearCache } from "@/lib/audio-cache";
import { presignedUrls } from "./presigned-urls";
import { resetPrefetchState } from "./prefetch";

export function forgetSignedInState(deps: { clearAudioCache?: () => Promise<void> } = {}): Promise<void> {
	presignedUrls.reset();
	resetPrefetchState();
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
