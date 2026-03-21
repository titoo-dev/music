"use client";

import { usePreviewStore } from "@/stores/usePreviewStore";
import { Button } from "@/components/ui/button";

export function MiniPlayer() {
	const { currentTrack, isPlaying, toggle, stop, volume, setVolume } = usePreviewStore();

	if (!currentTrack) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
			<div className="mx-auto max-w-6xl flex items-center gap-4 px-6 py-2">
				{/* Cover */}
				{currentTrack.cover && (
					<img
						src={currentTrack.cover}
						alt=""
						className="h-10 w-10 rounded object-cover"
					/>
				)}

				{/* Track info */}
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium truncate">{currentTrack.title}</p>
					<p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
				</div>

				{/* Volume */}
				<div className="hidden sm:flex items-center gap-2">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
						<path d="M11 5L6 9H2v6h4l5 4V5z" />
						{volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
						{volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
					</svg>
					<input
						type="range"
						min={0}
						max={100}
						value={volume}
						onChange={(e) => setVolume(parseInt(e.target.value))}
						className="w-20 h-1 accent-foreground cursor-pointer"
					/>
				</div>

				{/* Play/Pause */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 rounded-full"
					onClick={() => toggle(currentTrack)}
				>
					{isPlaying ? (
						<svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
							<rect x="1" y="1" width="3.5" height="10" rx="0.5" />
							<rect x="7.5" y="1" width="3.5" height="10" rx="0.5" />
						</svg>
					) : (
						<svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
							<path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
						</svg>
					)}
				</Button>

				{/* Close */}
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground hover:text-foreground"
					onClick={stop}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</Button>
			</div>
		</div>
	);
}
