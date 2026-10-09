import { create } from "zustand";

/**
 * Whether a navigation is on its way (a link was followed, ⌘K opened a page):
 * drives the top loader. It ends when the URL changes, or after `GIVE_UP_MS`
 * if the navigation never lands.
 */

const GIVE_UP_MS = 15_000;

interface NavProgressState {
	/** When the pending navigation started (ms), null when idle. */
	since: number | null;
}

export const useNavProgress = create<NavProgressState>(() => ({ since: null }));

let giveUp: ReturnType<typeof setTimeout> | null = null;

const here = () => window.location.pathname + window.location.search;

/** A navigation to `href` starts (ignored when it is the page already shown). */
export function startNavProgress(href: string) {
	let url: URL;
	try {
		url = new URL(href, window.location.href);
	} catch {
		return;
	}
	if (url.origin !== window.location.origin || url.pathname + url.search === here()) return;
	if (giveUp) clearTimeout(giveUp);
	giveUp = setTimeout(doneNavProgress, GIVE_UP_MS);
	useNavProgress.setState({ since: Date.now() });
}

export function doneNavProgress() {
	if (giveUp) clearTimeout(giveUp);
	giveUp = null;
	if (useNavProgress.getState().since !== null) useNavProgress.setState({ since: null });
}

/** Test helper. */
export function resetNavProgress() {
	if (giveUp) clearTimeout(giveUp);
	giveUp = null;
	useNavProgress.setState({ since: null });
}
