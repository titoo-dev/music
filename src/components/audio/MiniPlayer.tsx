"use client";

import { useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { CoverImage } from "@/components/ui/cover-image";
import { PlayPauseIcon, ProgressRing } from "@/components/motion/icons";
import { cn } from "@/lib/utils";

/**
 * 30-second preview pill. Floats bottom-center like the main player; when the
 * main player is visible it stacks just above it.
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
						"glass fixed inset-x-0 z-[46] mx-auto flex w-fit max-w-[calc(100%-24px)] items-center gap-3 rounded-full border border-border py-1.5 pl-1.5 pr-2 shadow-float",
						playerVisible
							? "bottom-[calc(var(--player-offset)+var(--player-h)+10px)]"
							: "bottom-[var(--player-offset)]"
					)}
				>
					<CoverImage src={currentTrack.cover} className="size-9 rounded-full" />

					<div className="min-w-0 max-w-[160px]" onContextMenu={handleContextMenu}>
						<p className="truncate text-[13px] font-medium leading-tight">{currentTrack.title}</p>
						<p className="truncate text-[11px] leading-tight text-muted-foreground">
							<span className="mr-1 rounded-sm bg-muted px-1 py-px text-[10px] text-muted-foreground">Preview</span>
							{currentTrack.artistId ? (
								<Link href={`/artist?id=${currentTrack.artistId}`} className="hover:text-foreground hover:underline">
									{currentTrack.artist}
								</Link>
							) : (
								currentTrack.artist
							)}
						</p>
					</div>

					<input
						type="range"
						min={0}
						max={100}
						value={volume}
						aria-label="Preview volume"
						onChange={(e) => setVolume(parseInt(e.target.value))}
						className="hidden h-1 w-16 cursor-pointer accent-foreground sm:block"
					/>

					<button
						type="button"
						aria-label={isPlaying ? "Pause preview" : "Play preview"}
						className="relative flex size-9 items-center justify-center rounded-full bg-foreground text-background"
						onClick={() => toggle(currentTrack)}
					>
						{isBuffering && (
							<ProgressRing indeterminate size={36} stroke={2} className="absolute inset-0 text-highlight" trackClassName="text-transparent" />
						)}
						<PlayPauseIcon playing={isPlaying} className="size-4" />
					</button>

					<button
						type="button"
						aria-label="Close preview"
						onClick={stop}
						className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<X className="size-4" />
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
