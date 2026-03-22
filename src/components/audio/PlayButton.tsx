"use client";

import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlayButtonProps {
	track: PlayerTrack;
	queue?: PlayerTrack[];
	size?: "sm" | "md";
	className?: string;
}

export function PlayButton({ track, queue, size = "sm", className }: PlayButtonProps) {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const play = usePlayerStore((s) => s.play);
	const pause = usePlayerStore((s) => s.pause);

	const isThisPlaying = currentTrack?.trackId === track.trackId && isPlaying;

	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn(
				size === "sm" ? "h-7 w-7" : "h-8 w-8",
				"rounded-full shrink-0",
				isThisPlaying
					? "bg-primary text-primary-foreground hover:bg-primary/90"
					: "hover:bg-muted",
				className
			)}
			onClick={(e) => {
				e.stopPropagation();
				if (isThisPlaying) {
					pause();
				} else {
					play(track, queue);
				}
			}}
		>
			{isThisPlaying ? (
				<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
					<rect x="1" y="1" width="3.5" height="10" rx="0.5" />
					<rect x="7.5" y="1" width="3.5" height="10" rx="0.5" />
				</svg>
			) : (
				<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
					<path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
				</svg>
			)}
		</Button>
	);
}
