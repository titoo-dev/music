import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { leaveOverlays } from "@/lib/overlay-history";

/**
 * Following an artist / album link out of a player surface (Now Playing,
 * queue, lyrics) closes those overlays so the page it opens is visible —
 * without going Back over their history entries (the link replaces them).
 */
export function leavePlayer() {
	leaveOverlays(() => {
		const player = usePlayerStore.getState();
		player.setFullscreenOpen(false);
		player.setQueuePanelOpen(false);
		const lyrics = useLyricsStore.getState();
		lyrics.setVisible(false);
		lyrics.setImmersiveOpen(false);
	});
}
