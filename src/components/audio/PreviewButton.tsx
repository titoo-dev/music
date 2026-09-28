"use client";

import { usePreviewStore } from "@/stores/usePreviewStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlayPauseIcon, Spinner } from "@/components/motion/icons";

interface PreviewButtonProps {
	track: {
		id: string;
		title: string;
		artist: string;
		cover?: string;
		previewUrl?: string;
	};
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function PreviewButton({ track, size = "sm", className }: PreviewButtonProps) {
	const { currentTrack, isPlaying, isBuffering, toggle } = usePreviewStore();

	if (!track.previewUrl) return null;

	const isThisTrack = currentTrack?.id === track.id;
	const isThisPlaying = isThisTrack && isPlaying;
	const isThisBuffering = isThisTrack && isBuffering;

	const sizeClasses = {
		sm: "h-7 w-7",
		md: "h-8 w-8",
		lg: "h-10 w-10",
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn(
				sizeClasses[size],
				"rounded-full shrink-0",
				isThisPlaying
					? "bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground"
					: "text-foreground hover:bg-accent",
				className
			)}
			onClick={(e) => {
				e.stopPropagation();
				toggle({
					id: track.id,
					title: track.title,
					artist: track.artist,
					cover: track.cover || "",
					previewUrl: track.previewUrl!,
				});
			}}
		>
			{isThisBuffering ? (
				<Spinner size={12} />
			) : (
				<PlayPauseIcon playing={isThisPlaying} className={size === "lg" ? "size-4" : "size-3.5"} />
			)}
		</Button>
	);
}
