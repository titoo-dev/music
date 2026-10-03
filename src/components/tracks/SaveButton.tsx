"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { HeartGlyph } from "@/components/motion/icons";
import { SPRING } from "@/components/expressive";
import { useSavedTracks, type SaveTrackInput } from "@/hooks/useLibrary";
import { cn } from "@/lib/utils";

/**
 * Heart toggle for "Save to library" / "Remove from library" (the Flutter
 * `PopToggleButton`): fills in `primary` with a pop and a ring burst.
 * Uses optimistic updates via the useSavedTracks hook so the UI reacts
 * instantly even though the actual API call is fire-and-forget.
 *
 * - `plain` (default): a 32px round icon button for rows and bars.
 * - `tonal`: a 48px secondaryContainer circle (now playing, sheet headers).
 */
export function SaveButton({
	track,
	className = "",
	variant = "plain",
}: {
	track: SaveTrackInput;
	className?: string;
	variant?: "plain" | "tonal";
}) {
	const { isSaved, save, unsave } = useSavedTracks([track.trackId]);
	const saved = isSaved(track.trackId);
	// Bumped on every like so the burst replays.
	const [burst, setBurst] = useState(0);

	const handleClick = async (e: React.MouseEvent | React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		try {
			if (saved) {
				await unsave(track.trackId);
			} else {
				setBurst((b) => b + 1);
				if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
				await save(track);
			}
		} catch {
			// Optimistic update will revert on its own
		}
	};

	const label = saved ? "Remove from library" : "Save to library";
	const tonal = variant === "tonal";

	return (
		<motion.button
			type="button"
			onClick={handleClick}
			onMouseDown={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
			whileTap={{ scale: 0.82 }}
			transition={SPRING.press}
			aria-label={label}
			aria-pressed={saved}
			title={label}
			className={cn(
				"relative inline-flex shrink-0 items-center justify-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/30",
				tonal
					? "size-12 bg-secondary text-secondary-foreground hover:bg-secondary/80 [&_svg]:size-6"
					: "size-8 text-muted-foreground hover:bg-foreground/8 hover:text-foreground [&_svg]:size-[18px]",
				className,
				saved && (tonal ? "bg-primary-container text-primary hover:bg-primary-container/85" : "text-primary hover:text-primary")
			)}
		>
			{burst > 0 && saved && (
				<motion.span
					key={burst}
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary"
					initial={{ scale: 0.4, opacity: 0.9 }}
					animate={{ scale: 1.35, opacity: 0 }}
					transition={{ duration: 0.5, ease: [0.05, 0.7, 0.1, 1] }}
				/>
			)}
			<motion.span
				key={saved ? "on" : "off"}
				className="inline-flex"
				initial={saved ? { scale: 0.5 } : false}
				animate={{ scale: 1 }}
				transition={SPRING.pop}
			>
				<HeartGlyph filled={saved} />
			</motion.span>
		</motion.button>
	);
}
