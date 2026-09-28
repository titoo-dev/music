"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { CoverImage } from "@/components/ui/cover-image";
import { PlayPauseIcon } from "@/components/motion/icons";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";

interface EntityHeroProps {
	/** Small muted type label above the title. e.g. "Album · 2024" or "Artist". */
	eyebrow?: ReactNode;
	/** Main title. */
	title: string;
	/** Inline subtitle node — typically the artist link or extra metadata. */
	subtitle?: ReactNode;
	/** Small muted footer line under the subtitle. e.g. "12 tracks · 48 min". */
	meta?: ReactNode;
	/** Cover image src. Optional — entity heroes without artwork just skip it. */
	coverSrc?: string | null;
	/** Cover alt text. Defaults to title. */
	coverAlt?: string;
	/** Cover shape — artists render as a circle. */
	coverShape?: "square" | "circle";
	/** Primary CTA — typically a `<HeroPlayButton />`. */
	primaryAction?: ReactNode;
	/** Row of secondary actions — outline icon buttons. */
	secondaryActions?: ReactNode;
}

/**
 * Shared hero scaffold for entity pages (Album, Artist, Playlist detail).
 *
 * Mobile (<md): cover centered above text, actions centered below.
 * Desktop (≥md): cover left, meta right, actions inline below the text.
 *
 * Caller decides PLAY/FOLLOW/SAVE — this only provides the layout shell.
 */
export function EntityHero({
	eyebrow,
	title,
	subtitle,
	meta,
	coverSrc,
	coverAlt,
	coverShape = "square",
	primaryAction,
	secondaryActions,
}: EntityHeroProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			className="flex flex-col items-center gap-6 pt-2 md:flex-row md:items-end md:gap-8"
		>
			{coverSrc && (
				<CoverImage
					src={coverSrc}
					alt={coverAlt ?? title}
					className={cn(
						"shrink-0 size-40 sm:size-48 md:size-52 lg:size-56",
						"shadow-[0_8px_30px_rgb(0_0_0/0.12)] ring-1 ring-border",
						coverShape === "circle" ? "rounded-full" : "rounded-xl"
					)}
				/>
			)}
			<div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center md:items-start md:text-left">
				{eyebrow && (
					<p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
				)}
				<h1 className="m-0 max-w-full break-words text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
					{title}
				</h1>
				{subtitle && (
					<div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
				)}
				{meta && (
					<p className="text-xs text-muted-foreground tabular-nums">{meta}</p>
				)}
				{(primaryAction || secondaryActions) && (
					<div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
						{primaryAction && <div className="shrink-0">{primaryAction}</div>}
						{secondaryActions && (
							<div className="flex flex-wrap items-center gap-2">{secondaryActions}</div>
						)}
					</div>
				)}
			</div>
		</motion.div>
	);
}

/**
 * Round primary play button for entity heroes. Shows a morphing play/pause
 * glyph: when the current player track belongs to `trackIds`, clicking toggles
 * playback; otherwise it calls `onPlay` (start from the top).
 */
export function HeroPlayButton({
	onPlay,
	trackIds,
	label = "Play",
	disabled,
}: {
	onPlay: () => void;
	trackIds: string[];
	label?: string;
	disabled?: boolean;
}) {
	const currentTrackId = usePlayerStore((s) => s.currentTrack?.trackId ?? null);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const toggle = usePlayerStore((s) => s.toggle);
	const isCurrent = currentTrackId != null && trackIds.includes(currentTrackId);
	const playing = isCurrent && isPlaying;

	return (
		<button
			type="button"
			onClick={isCurrent ? toggle : onPlay}
			disabled={disabled}
			aria-label={playing ? "Pause" : label}
			className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-[background-color,transform] duration-150 hover:bg-primary/85 focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
		>
			<PlayPauseIcon playing={playing} className="size-5" />
		</button>
	);
}
