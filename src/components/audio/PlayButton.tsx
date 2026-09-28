"use client";

import { useRef } from "react";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { warmTrack } from "@/components/audio/AudioEngine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlayPauseIcon, Spinner } from "@/components/motion/icons";

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
					? "bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground"
					: "text-foreground hover:bg-accent",
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
				<Spinner size={12} />
			) : (
				<PlayPauseIcon playing={isThisPlaying} className="size-3.5" />
			)}
		</Button>
	);
}
