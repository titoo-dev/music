"use client";

import { usePreviewStore } from "@/stores/usePreviewStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

export function MiniPlayer() {
	const { currentTrack, isPlaying, toggle, stop, volume, setVolume } =
		usePreviewStore();

	return (
		<AnimatePresence>
			{currentTrack && (
				<motion.div
					key="mini-player"
					initial={{ y: 80, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 80, opacity: 0 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="fixed bottom-5 right-5 z-50 flex items-center gap-3 border-2 sm:border-[3px] border-foreground bg-background px-4 py-3 shadow-[var(--shadow-brutal-hover)]"
				>
					{/* Cover */}
					<CoverImage
						src={currentTrack.cover}
						className="h-10 w-10"
					/>

					{/* Track info */}
					<div className="min-w-0 max-w-[140px]">
						<p className="truncate text-sm font-bold leading-tight">
							{currentTrack.title}
						</p>
						<p className="truncate text-xs text-muted-foreground leading-tight font-medium">
							{currentTrack.artist}
						</p>
					</div>

					{/* Volume */}
					<div className="hidden sm:flex items-center gap-1.5">
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							className="shrink-0 text-foreground"
						>
							<path d="M11 5L6 9H2v6h4l5 4V5z" />
							{volume > 0 && (
								<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
							)}
							{volume > 50 && (
								<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
							)}
						</svg>
						<input
							type="range"
							min={0}
							max={100}
							value={volume}
							onChange={(e) => setVolume(parseInt(e.target.value))}
							className="w-16 h-1 accent-primary cursor-pointer"
						/>
					</div>

					{/* Play/Pause */}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 border-[2px] border-foreground"
						onClick={() => toggle(currentTrack)}
					>
						{isPlaying ? (
							<svg
								width="15"
								height="15"
								viewBox="0 0 12 12"
								fill="currentColor"
							>
								<rect x="1" y="1" width="3.5" height="10" />
								<rect x="7.5" y="1" width="3.5" height="10" />
							</svg>
						) : (
							<svg
								width="15"
								height="15"
								viewBox="0 0 12 12"
								fill="currentColor"
							>
								<path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
							</svg>
						)}
					</Button>

					{/* Close */}
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={stop}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
