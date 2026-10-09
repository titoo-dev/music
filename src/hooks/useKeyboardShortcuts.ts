"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useCommandStore } from "@/stores/useCommandStore";

/**
 * Global keyboard shortcuts.
 * - ⌘K / Ctrl+K: toggle the command palette (search + downloads)
 * - /: open the command palette
 * Audio player:
 * - Space: play/pause
 * - ArrowRight: next track
 * - ArrowLeft: previous track
 * - Shift+ArrowRight / L: seek forward 10s
 * - Shift+ArrowLeft / J: seek backward 10s
 * - Shift+ArrowUp: volume up
 * - Shift+ArrowDown: volume down
 * - M: mute/unmute
 * With nothing loaded, Space and the arrows stay with the browser (page
 * scrolling); plain ArrowUp / ArrowDown always do.
 */
export function useKeyboardShortcuts() {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// ⌘K / Ctrl+K toggles the command palette from anywhere, even inputs.
			if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
				e.preventDefault();
				useCommandStore.getState().toggle();
				return;
			}
			// Palette owns the keyboard while it's open.
			if (useCommandStore.getState().isOpen) return;

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

			if (e.metaKey || e.ctrlKey || e.altKey) return;

			const state = usePlayerStore.getState();

			switch (e.key) {
				case "/": {
					e.preventDefault();
					useCommandStore.getState().open();
					break;
				}
				case " ": {
					if (!state.currentTrack) return;
					e.preventDefault();
					state.toggle();
					break;
				}
				case "ArrowRight": {
					if (!state.currentTrack) return;
					e.preventDefault();
					if (e.shiftKey) {
						// Shift+ArrowRight: seek forward 10s
						state.seek(Math.min(state.duration, state.currentTime + 10));
					} else {
						state.next();
					}
					break;
				}
				case "ArrowLeft": {
					if (!state.currentTrack) return;
					e.preventDefault();
					if (e.shiftKey) {
						// Shift+ArrowLeft: seek backward 10s
						state.seek(Math.max(0, state.currentTime - 10));
					} else {
						state.prev();
					}
					break;
				}
				case "ArrowUp": {
					// Plain ArrowUp / ArrowDown scroll the page.
					if (!e.shiftKey) return;
					e.preventDefault();
					state.setVolume(Math.min(100, state.volume + 5));
					break;
				}
				case "ArrowDown": {
					if (!e.shiftKey) return;
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
