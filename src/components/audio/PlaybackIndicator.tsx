"use client";

import { cn } from "@/lib/utils";

interface PlaybackIndicatorProps {
	className?: string;
	paused?: boolean;
}

export function PlaybackIndicator({ className, paused }: PlaybackIndicatorProps) {
	return (
		<div className={cn("flex items-end justify-center gap-[2px] h-3 w-4", className)}>
			{[0, 0.15, 0.3].map((delay, i) => (
				<span
					key={i}
					className="w-[3px] rounded-full bg-primary"
					style={{
						animation: paused ? "none" : `playback-eq 0.6s ${delay}s ease-in-out infinite`,
						height: paused ? 6 : 3,
					}}
				/>
			))}
		</div>
	);
}
