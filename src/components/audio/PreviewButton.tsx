"use client";

import { usePreviewStore } from "@/stores/usePreviewStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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
					? "bg-primary text-primary-foreground hover:bg-primary/90"
					: "hover:bg-muted",
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
				<Loader2 className="h-3 w-3 animate-spin" />
			) : isThisPlaying ? (
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
