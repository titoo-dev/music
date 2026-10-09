"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";

/**
 * The page chrome that full-screen player surfaces (Now Playing, immersive
 * lyrics) cover: inert while one is open, so Tab and screen readers stay in
 * the surface instead of wandering into the hidden page behind it.
 * `display: contents` keeps the wrapper out of the layout (sticky header included).
 */
export function BehindOverlays({ children }: { children: React.ReactNode }) {
	const covered = usePlayerStore((s) => s.fullscreenOpen && !!s.currentTrack);
	const lyrics = useLyricsStore((s) => s.immersiveOpen);
	return (
		<div className="contents" inert={covered || lyrics} data-testid="behind-overlays">
			{children}
		</div>
	);
}
