"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Equalizer, PlayPauseIcon, ProgressRing } from "@/components/motion/icons";
import { CoverTheme, EASE, SPRING } from "@/components/expressive";
import { cn } from "@/lib/utils";
import { ArtistLink } from "@/components/links/EntityLink";
import { leavePlayer } from "./leave-player";

/**
 * 30-second preview pill. Floats bottom-center like the main player; when the
 * main player is visible it stacks just above it. Same tonal, cover-themed
 * language as the player card, in a compact stadium.
 */
export function MiniPlayer() {
	const { currentTrack, isPlaying, isBuffering, toggle, stop, volume, setVolume } = usePreviewStore();
	const playerVisible = usePlayerStore((s) => !!s.currentTrack);
	const openSheet = useTrackActionStore((s) => s.openSheet);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			if (!currentTrack) return;
			openSheet({
				id: String(currentTrack.id),
				title: currentTrack.title,
				artist: currentTrack.artist,
				artistId: currentTrack.artistId ?? null,
				cover: currentTrack.cover,
				previewUrl: currentTrack.previewUrl,
			});
		},
		[currentTrack, openSheet]
	);

	return (
		<AnimatePresence>
			{currentTrack && (
				<motion.div
					key="mini-player"
					layout
					initial={{ y: 60, opacity: 0, scale: 0.95 }}
					animate={{ y: 0, opacity: 1, scale: 1 }}
					exit={{ y: 60, opacity: 0, scale: 0.95 }}
					transition={{ type: "spring", damping: 28, stiffness: 320 }}
					role="region"
					aria-label="Preview player"
					className={cn(
						"fixed left-[var(--rail-w)] right-0 z-[46] mx-auto w-fit max-w-[calc(100%-var(--rail-w)-24px)]",
						playerVisible ? "bottom-[calc(var(--player-offset)+var(--player-h)+10px)]" : "bottom-[var(--player-offset)]"
					)}
				>
					<CoverTheme src={currentTrack.cover}>
						<div
							className={cn(
								"flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-2 text-on-primary-container ring-1 ring-inset ring-on-primary-container/8 transition-shadow duration-500",
								"bg-[linear-gradient(135deg,var(--m3-primary-container),color-mix(in_oklch,var(--m3-primary-container)_30%,var(--m3-tertiary-container)))]",
								isPlaying
									? "shadow-[0_10px_24px_-4px_color-mix(in_oklch,var(--m3-primary)_40%,transparent)]"
									: "shadow-[0_6px_14px_-4px_color-mix(in_oklch,var(--m3-primary)_22%,transparent)]"
							)}
						>
							<motion.span
								initial={false}
								animate={{ scale: isPlaying ? 1 : 0.9, rotate: isPlaying ? 0 : -4 }}
								transition={{ type: "spring", stiffness: 400, damping: 17 }}
								className="shrink-0"
							>
								<CoverImage src={currentTrack.cover} className="size-10 rounded-full shadow-[0_3px_10px_-2px_rgb(0_0_0/0.35)]" />
							</motion.span>

							<div className="min-w-0 max-w-[180px]" onContextMenu={handleContextMenu}>
								<p className="truncate text-[13px] font-semibold leading-tight tracking-[-0.01em]">{currentTrack.title}</p>
								<p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] leading-tight text-on-primary-container/75">
									<span className="inline-flex h-4 shrink-0 items-center gap-1 rounded-full bg-primary px-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-primary-foreground">
										{isPlaying && <Equalizer playing className="h-2" />}
										Preview
									</span>
									<ArtistLink id={currentTrack.artistId} name={currentTrack.artist} onClick={leavePlayer} className="truncate hover:text-on-primary-container" />
								</p>
							</div>

							{/* Volume */}
							<div className="relative hidden h-1.5 w-16 shrink-0 rounded-full bg-on-primary-container/15 sm:block">
								<div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${volume}%` }} />
								<input
									type="range"
									min={0}
									max={100}
									value={volume}
									aria-label="Preview volume"
									onChange={(e) => setVolume(parseInt(e.target.value))}
									className="absolute -inset-y-2 inset-x-0 h-5 w-full cursor-pointer opacity-0"
								/>
							</div>

							<span className="relative inline-flex size-10 shrink-0 items-center justify-center">
								<motion.button
									type="button"
									aria-label={isPlaying ? "Pause preview" : "Play preview"}
									initial={false}
									animate={{ borderRadius: isPlaying ? 18 : 11 }}
									whileTap={{ scale: 0.88 }}
									transition={{ borderRadius: { duration: 0.3, ease: EASE.emphasized }, scale: SPRING.press }}
									className="flex size-9 items-center justify-center bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50"
									onClick={() => toggle(currentTrack)}
								>
									<PlayPauseIcon playing={isPlaying} className="size-4" />
								</motion.button>
								{isBuffering && (
									<ProgressRing indeterminate size={40} stroke={2} className="pointer-events-none absolute inset-0 text-primary" trackClassName="text-transparent" />
								)}
							</span>

							<button
								type="button"
								aria-label="Close preview"
								onClick={stop}
								className="flex size-8 shrink-0 items-center justify-center rounded-full text-on-primary-container/70 transition-colors hover:bg-on-primary-container/10 hover:text-on-primary-container active:scale-90"
							>
								<X className="size-4" />
							</button>
						</div>
					</CoverTheme>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
