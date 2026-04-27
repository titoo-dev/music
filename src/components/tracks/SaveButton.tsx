"use client";

import { Heart } from "lucide-react";
import { useSavedTracks, type SaveTrackInput } from "@/hooks/useLibrary";

/**
 * Heart toggle for "Save to library" / "Remove from library".
 * Uses optimistic updates via the useSavedTracks hook so the UI reacts
 * instantly even though the actual API call is fire-and-forget.
 */
export function SaveButton({
	track,
	className = "",
}: {
	track: SaveTrackInput;
	className?: string;
}) {
	const { isSaved, save, unsave } = useSavedTracks([track.trackId]);
	const saved = isSaved(track.trackId);

	const handleClick = async (e: React.MouseEvent | React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		try {
			if (saved) {
				await unsave(track.trackId);
			} else {
				await save(track);
			}
		} catch {
			// Optimistic update will revert on its own
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			onMouseDown={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
			aria-label={saved ? "Remove from library" : "Save to library"}
			title={saved ? "Remove from library" : "Save to library"}
			className={`shrink-0 inline-flex items-center justify-center size-7 text-muted-foreground hover:text-foreground transition-colors ${className}`}
		>
			<Heart
				className={`size-4 transition-all ${
					saved ? "fill-primary text-primary" : ""
				}`}
			/>
		</button>
	);
}
