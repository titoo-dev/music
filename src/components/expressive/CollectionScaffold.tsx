"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { sizedCover } from "@/lib/cover-palette";
import { CoverTheme } from "./CoverTheme";
import { ArtworkWall } from "./ArtworkWall";
import { EyebrowPill, StatBadge } from "./Pills";
import { Art, BigPlayButton, ShuffleButton } from "./Tiles";
import { DUR, EASE, entrance } from "./motion";

export interface CollectionStat {
	icon: LucideIcon;
	label: ReactNode;
}

export interface CollectionScaffoldProps {
	title: string;
	/** Drives the palette and the backdrop. */
	cover?: string | null;
	/** 2×2 mosaic artwork (user playlists) instead of `cover`. */
	covers?: string[];
	circle?: boolean;
	eyebrow?: ReactNode;
	/** Subtitle chip, e.g. the album's artist. */
	subtitle?: { label: string; href?: string; image?: string | null } | null;
	stats?: CollectionStat[];
	description?: ReactNode;
	/** Secondary actions, left of shuffle / play (like, add, …). */
	actions?: ReactNode;
	/** Track ids this collection plays (so Play toggles when it is current). */
	trackIds: string[];
	onPlay: () => void;
	onShuffle?: () => void;
	playLabel?: string;
	/** Related artwork; with 8+ covers the hero shows a drifting artwork wall. */
	backdropCovers?: string[];
	children?: ReactNode;
}

/**
 * Shared page scaffold for albums, playlists and artists (the Flutter
 * `CollectionScaffold`): the artwork's own palette, a drifting wall (or the
 * blurred cover) fading into the page, a glowing cover, an eyebrow pill, a
 * display title, stat badges, actions and a big Play button. No compact bar
 * once the title scrolls away: the floating player already covers it.
 */
export function CollectionScaffold({
	title,
	cover,
	covers,
	circle = false,
	eyebrow,
	subtitle,
	stats = [],
	description,
	actions,
	trackIds,
	onPlay,
	onShuffle,
	playLabel = "Play",
	backdropCovers = [],
	children,
}: CollectionScaffoldProps) {
	const art = cover ?? covers?.[0] ?? null;
	const wall = backdropCovers.length >= 8;
	// Short titles get the full display treatment.
	const titleSize = title.length <= 18 ? "text-[2.5rem] sm:text-6xl lg:text-7xl" : title.length <= 40 ? "text-[2rem] sm:text-5xl" : "text-[1.75rem] sm:text-4xl";

	return (
		<CoverTheme src={art}>
			{/* ─── Backdrop: bleeds to the content edges and under the top bar ─── */}
			<div className="relative mx-[calc(50%-50vw)] -mt-[calc(var(--header-h)+24px)] sm:-mt-[calc(var(--header-h)+32px)] px-[calc(50vw-50%)] pt-[calc(var(--header-h)+24px)] sm:pt-[calc(var(--header-h)+32px)]">
				<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[min(640px,100%)] overflow-hidden">
					<div className="bg-tonal-gradient absolute inset-0 transition-[background] duration-700" />
					<AnimatePresence initial={false}>
						{wall ? (
							<motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.long * 2 }} className="absolute inset-0">
								<ArtworkWall urls={backdropCovers} columns={6} period={80} />
							</motion.div>
						) : art ? (
							<motion.div
								key={art}
								initial={{ opacity: 0 }}
								animate={{ opacity: 0.6 }}
								exit={{ opacity: 0 }}
								transition={{ duration: DUR.long * 2 }}
								className="absolute inset-[-20%] bg-cover bg-center blur-[64px] saturate-150"
								style={{ backgroundImage: `url("${sizedCover(art, 250)}")` }}
							/>
						) : null}
					</AnimatePresence>
					{/* Night falls towards the page: keeps the cover and the copy legible. */}
					<div
						className={cn(
							"absolute inset-0",
							wall
								? "bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--background)_55%,transparent),color-mix(in_srgb,var(--background)_78%,transparent)_45%,var(--background)_92%)]"
								: "bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--background)_15%,transparent),color-mix(in_srgb,var(--background)_55%,transparent)_50%,var(--background)_92%)]"
						)}
					/>
				</div>

				{/* ─── Hero ─── */}
				<div className="relative flex flex-col items-center gap-6 pb-4 pt-6 md:flex-row md:items-end md:gap-10 md:pt-12">
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 16 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ duration: 0.6, ease: EASE.decelerate }}
						className={cn(
							"relative size-[min(62vw,260px)] shrink-0 overflow-hidden md:size-[232px] lg:size-[264px]",
							circle ? "rounded-full" : "rounded-[28px]",
							"shadow-[0_18px_48px_2px_color-mix(in_srgb,var(--primary)_35%,transparent),0_8px_16px_rgb(0_0_0/0.3)]"
						)}
					>
						<Art src={cover} covers={covers} size={500} className="size-full" />
					</motion.div>

					<div className="flex w-full min-w-0 flex-1 flex-col items-start">
						{eyebrow && (
							<motion.div {...entrance(0)}>
								<EyebrowPill>{eyebrow}</EyebrowPill>
							</motion.div>
						)}
						<motion.h1 {...entrance(1)} className={cn("type-display mt-3 line-clamp-3 max-w-full break-words text-balance", titleSize)}>
							{title}
						</motion.h1>
						{subtitle && (
							<motion.div {...entrance(2)} className="mt-4">
								<SubtitleChip {...subtitle} />
							</motion.div>
						)}
						{stats.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
								{stats.map((s, i) => (
									<motion.span key={i} {...entrance(i + 3, 8)}>
										<StatBadge icon={s.icon}>{s.label}</StatBadge>
									</motion.span>
								))}
							</div>
						)}
						{description && (
							<motion.div {...entrance(4)} className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
								{description}
							</motion.div>
						)}
						<motion.div {...entrance(5)} className="mt-5 flex w-full items-center gap-2">
							<div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>
							<div className="flex-1" />
							{trackIds.length > 0 && (
								<>
									{onShuffle && <ShuffleButton onShuffle={onShuffle} />}
									<BigPlayButton trackIds={trackIds} onPlay={onPlay} label={playLabel} />
								</>
							)}
						</motion.div>
					</div>
				</div>
			</div>

			<div className="relative">{children}</div>
		</CoverTheme>
	);
}

function SubtitleChip({ label, href, image }: { label: string; href?: string; image?: string | null }) {
	if (!href) return <p className="text-base font-semibold text-muted-foreground">{label}</p>;
	return (
		<motion.span whileTap={{ scale: 0.95 }} className="inline-flex">
			<Link
				href={href}
				className={cn(
					"flex h-[38px] items-center gap-2.5 rounded-full bg-secondary pr-2.5 text-sm font-semibold text-secondary-foreground no-underline transition-colors hover:bg-secondary/80",
					image ? "pl-1" : "pl-3.5"
				)}
			>
				{image && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={sizedCover(image, 120)} alt="" className="size-[30px] rounded-full object-cover" />
				)}
				<span className="truncate">{label}</span>
				<ChevronRight className="size-5 shrink-0" />
			</Link>
		</motion.span>
	);
}
