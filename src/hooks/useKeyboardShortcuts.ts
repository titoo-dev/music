"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

/**
 * Global keyboard shortcuts for the audio player.
 * - Space: play/pause
 * - ArrowRight: next track
 * - ArrowLeft: previous track
 * - Shift+ArrowRight / L: seek forward 10s
 * - Shift+ArrowLeft / J: seek backward 10s
 * - ArrowUp: volume up
 * - ArrowDown: volume down
 * - M: mute/unmute
 */
export function useKeyboardShortcuts() {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const target = e.target as HTMLElement | null;
			// Skip if user is typing in an input/textarea/contenteditable
			const tag = target?.tagName;
			if (
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				target?.isContentEditable
			) {
				return;
			}
			// Skip if focus is on a Radix/ARIA interactive control that handles
			// Space/Arrow itself (slider thumbs, switches, comboboxes, etc.).
			// Space on a focused button still hits us — that's intentional.
			const role = target?.getAttribute("role");
			if (
				role === "slider" ||
				role === "switch" ||
				role === "combobox" ||
				role === "menuitem" ||
				role === "menuitemcheckbox" ||
				role === "menuitemradio" ||
				role === "option" ||
				role === "tab" ||
				role === "spinbutton"
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
					if (e.shiftKey) {
						// Shift+ArrowRight: seek forward 10s
						state.seek(Math.min(state.duration, state.currentTime + 10));
					} else {
						state.next();
					}
					break;
				}
				case "ArrowLeft": {
					e.preventDefault();
					if (!state.currentTrack) return;
					if (e.shiftKey) {
						// Shift+ArrowLeft: seek backward 10s
						state.seek(Math.max(0, state.currentTime - 10));
					} else {
						state.prev();
					}
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
				case "l":
				case "L": {
					if (!state.currentTrack) return;
					state.seek(Math.min(state.duration, state.currentTime + 10));
					break;
				}
				case "j":
				case "J": {
					if (!state.currentTrack) return;
					state.seek(Math.max(0, state.currentTime - 10));
					break;
				}
				case "m":
				case "M": {
					state.toggleMute();
					break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
