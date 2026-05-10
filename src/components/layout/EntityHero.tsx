"use client";

import type { ReactNode } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { cn } from "@/lib/utils";

interface EntityHeroProps {
	/** Mono uppercase eyebrow line above the title. e.g. "ALBUM · 2024" or "ARTIST · 1.2M FANS". */
	eyebrow?: ReactNode;
	/** Main title, rendered with text-brutal-lg. */
	title: string;
	/** Inline subtitle node — typically the artist link or extra metadata. */
	subtitle?: ReactNode;
	/** Mono small footer line under title. e.g. "12 TRACKS · 48 MIN". */
	meta?: ReactNode;
	/** Cover image src. Optional — entity heroes without artwork (errors, etc.) just skip it. */
	coverSrc?: string | null;
	/** Cover alt text. Defaults to title. */
	coverAlt?: string;
	/** Primary CTA — passed as-is. Caller is responsible for sizing (recommend h-12 md:h-10, w-full md:w-auto for brutalist primary). */
	primaryAction?: ReactNode;
	/** Row of secondary icon buttons — passed as-is. Each should use `size="icon-touch"`. */
	secondaryActions?: ReactNode;
}

/**
 * Shared hero scaffold for entity pages (Album, Artist, Playlist detail).
 *
 * Mobile (<md): cover centered above text, primary action stacked above secondaries.
 * Desktop (≥md): cover left, text right, primary + secondaries inline below text.
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
	primaryAction,
	secondaryActions,
}: EntityHeroProps) {
	return (
		<div>
			{eyebrow && (
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					{eyebrow}
				</p>
			)}
			<div className="flex flex-col gap-5 md:flex-row md:gap-8 md:items-end">
				{coverSrc && (
					<CoverImage
						src={coverSrc}
						alt={coverAlt ?? title}
						className={cn(
							"shrink-0 border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)]",
							"w-44 h-44 sm:w-52 sm:h-52 mx-auto md:mx-0"
						)}
					/>
				)}
				<div className="flex flex-col gap-2 min-w-0 flex-1 text-center md:text-left">
					<h1 className="text-brutal-lg m-0 break-words">{title}</h1>
					{subtitle && (
						<div className="text-sm font-medium text-muted-foreground">
							{subtitle}
						</div>
					)}
					{meta && (
						<p className="text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-muted-foreground">
							{meta}
						</p>
					)}
					{(primaryAction || secondaryActions) && (
						<div className="flex flex-col gap-3 mt-2 md:flex-row md:items-center md:gap-3">
							{primaryAction && <div className="md:shrink-0">{primaryAction}</div>}
							{secondaryActions && (
								<div className="flex items-center gap-1 flex-wrap justify-center md:justify-start">
									{secondaryActions}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
