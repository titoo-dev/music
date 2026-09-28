"use client";

import { cn } from "@/lib/utils";
import { Equalizer } from "@/components/motion/icons";

interface PlaybackIndicatorProps {
	className?: string;
	paused?: boolean;
}

export function PlaybackIndicator({ className, paused }: PlaybackIndicatorProps) {
	return <Equalizer playing={!paused} className={cn("text-highlight", className)} />;
}
