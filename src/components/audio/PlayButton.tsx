"use client";

import { useRef } from "react";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { warmTrack } from "@/components/audio/AudioEngine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const HOVER_WARM_DELAY_MS = 150;

interface PlayButtonProps {
	track: PlayerTrack;
	queue?: PlayerTrack[];
	size?: "sm" | "md";
	className?: string;
}

export function PlayButton({ track, queue, size = "sm", className }: PlayButtonProps) {
	const warmTimerRef = useRef<number | null>(null);
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const isBuffering = usePlayerStore((s) => s.isBuffering);
	const play = usePlayerStore((s) => s.play);
	const pause = usePlayerStore((s) => s.pause);

	const isThisTrack = currentTrack?.trackId === track.trackId;
	const isThisPlaying = isThisTrack && isPlaying;
	const isThisBuffering = isThisTrack && isBuffering;
	const resume = usePlayerStore((s) => s.resume);

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
			onMouseEnter={() => {
				if (isThisTrack) return;
				if (warmTimerRef.current) clearTimeout(warmTimerRef.current);
				warmTimerRef.current = window.setTimeout(() => {
					warmTrack(track.trackId, { audio: "full" });
					warmTimerRef.current = null;
				}, HOVER_WARM_DELAY_MS);
			}}
			onMouseLeave={() => {
				if (warmTimerRef.current) {
					clearTimeout(warmTimerRef.current);
					warmTimerRef.current = null;
				}
			}}
			onFocus={() => {
				if (!isThisTrack) warmTrack(track.trackId, { audio: "full" });
			}}
			onClick={(e) => {
				e.stopPropagation();
				if (isThisPlaying) {
					pause();
				} else if (isThisTrack) {
					resume();
				} else {
					play(track, queue);
				}
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
