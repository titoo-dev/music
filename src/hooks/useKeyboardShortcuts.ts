"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

/**
 * Global keyboard shortcuts for the audio player.
 * - Space: play/pause
 * - ArrowRight: next track
 * - ArrowLeft: previous track
 * - M: mute/unmute
 * - ArrowUp: volume up
 * - ArrowDown: volume down
 */
export function useKeyboardShortcuts() {
	useEffect(() => {
		let savedVolume = 0;

		function handleKeyDown(e: KeyboardEvent) {
			// Skip if user is typing in an input/textarea/contenteditable
			const tag = (e.target as HTMLElement)?.tagName;
			if (
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				(e.target as HTMLElement)?.isContentEditable
			) {
				return;
			}

			const state = usePlayerStore.getState();

			switch (e.key) {
				case " ": {
					e.preventDefault();
					if (!state.currentTrack) return;
					state.toggle();
					break;
				}
				case "ArrowRight": {
					e.preventDefault();
					if (!state.currentTrack) return;
					state.next();
					break;
				}
				case "ArrowLeft": {
					e.preventDefault();
					if (!state.currentTrack) return;
					state.prev();
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					state.setVolume(Math.min(100, state.volume + 5));
					break;
				}
				case "ArrowDown": {
					e.preventDefault();
					state.setVolume(Math.max(0, state.volume - 5));
					break;
				}
				case "m":
				case "M": {
					if (state.volume > 0) {
						savedVolume = state.volume;
						state.setVolume(0);
					} else {
						state.setVolume(savedVolume || 80);
					}
					break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
