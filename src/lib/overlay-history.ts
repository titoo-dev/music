import { create } from "zustand";

/**
 * Full-screen overlays (Now Playing, immersive lyrics, the queue on phones,
 * the ⌘K palette) each own a history entry on the same URL while open, so
 * Back / the Android back gesture closes the top-most overlay instead of
 * changing the page hidden underneath.
 *
 * - `openOverlay` pushes the entry; `closeOverlay` (closed from its own UI)
 *   goes Back over it.
 * - Back runs `handlePopState`, which closes the top-most overlay.
 * - Following a link out of an overlay goes through `leaveOverlays`: no Back,
 *   the link replaces the overlay's entry instead (see `useOverlayStack`).
 */

const KEY = "__waveletOverlay";

interface OverlayStack {
	/** Open overlays that own a history entry, bottom → top. */
	ids: string[];
}

export const useOverlayStack = create<OverlayStack>(() => ({ ids: [] }));

const closers = new Map<string, () => void>();
// history.back() calls made here, whose popstate must not close anything.
let ownBacks = 0;
let leaving = 0;

export function openOverlay(id: string, close: () => void) {
	closers.set(id, close);
	const { ids } = useOverlayStack.getState();
	if (ids.includes(id)) return;
	useOverlayStack.setState({ ids: [...ids, id] });
	window.history.pushState({ ...window.history.state, [KEY]: id }, "");
}

/** The overlay closed from its own UI: drop its history entry too. */
export function closeOverlay(id: string) {
	const { ids } = useOverlayStack.getState();
	if (!ids.includes(id)) return;
	useOverlayStack.setState({ ids: ids.filter((x) => x !== id) });
	if (leaving) return;
	if (window.history.state?.[KEY] === id) {
		ownBacks++;
		window.history.back();
	}
}

/** Closes every overlay for a navigation: the caller replaces the overlay's entry rather than going Back. */
export function leaveOverlays(closeAll: () => void) {
	leaving++;
	try {
		closeAll();
	} finally {
		leaving--;
	}
	useOverlayStack.setState({ ids: [] });
}

export function handlePopState() {
	if (ownBacks > 0) {
		ownBacks--;
		return;
	}
	const { ids } = useOverlayStack.getState();
	const top = ids[ids.length - 1];
	if (!top) return;
	useOverlayStack.setState({ ids: ids.slice(0, -1) });
	leaving++;
	try {
		closers.get(top)?.();
	} finally {
		leaving--;
	}
}

/** True while the current history entry belongs to an overlay (a link out should replace it). */
export function overlayEntryOnTop() {
	return typeof window !== "undefined" && window.history.state?.[KEY] != null;
}

/** Test helper. */
export function resetOverlayHistory() {
	closers.clear();
	ownBacks = 0;
	leaving = 0;
	useOverlayStack.setState({ ids: [] });
}
