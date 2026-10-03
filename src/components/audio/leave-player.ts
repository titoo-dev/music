import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";

/**
 * Following an artist / album link out of a player surface (Now Playing,
 * queue, lyrics) closes those overlays so the page it opens is visible.
 */
export function leavePlayer() {
	const player = usePlayerStore.getState();
	player.setFullscreenOpen(false);
	player.setQueuePanelOpen(false);
	const lyrics = useLyricsStore.getState();
	lyrics.setVisible(false);
	lyrics.setImmersiveOpen(false);
}
