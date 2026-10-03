"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aurora, HERO_NIGHT, type Palette } from "./Aurora";
import { ArtworkWall } from "./ArtworkWall";
import { DUR } from "./motion";

/** White filled button for a banner's primary action. */
export const heroPrimaryButton =
	"inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[var(--hero-base)] shadow-sm transition-[transform,background-color] hover:bg-white/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px]";

/** Frosted button for a banner's secondary actions. */
export const heroGlassButton =
	"inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/[0.18] px-5 text-sm font-semibold text-white backdrop-blur-md transition-[transform,background-color] hover:bg-white/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px]";

/**
 * Rounded aurora banner, optionally with a drifting wall of [covers] behind:
 * the hero moment of a page. Content is white on a fixed night palette.
 */
export function HeroBanner({
	children,
	covers = [],
	palette = HERO_NIGHT,
	radius = 28,
	className,
	contentClassName,
	minCovers = 6,
}: {
	children: ReactNode;
	covers?: string[];
	palette?: Palette;
	radius?: number;
	className?: string;
	contentClassName?: string;
	/** Below this many covers the wall stays hidden (it would repeat too visibly). */
	minCovers?: number;
}) {
	const wall = covers.length >= minCovers;
	return (
		<section
			className={cn("relative isolate overflow-hidden text-white", className)}
			style={{
				borderRadius: radius,
				boxShadow: `0 8px 20px -12px color-mix(in srgb, ${palette.lights[1]} 22%, transparent)`,
				["--hero-base" as string]: palette.base,
			}}
		>
			<Aurora palette={palette} className="-z-10" />
			<AnimatePresence>
				{wall && (
					<motion.div
						key="wall"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: DUR.long * 2 }}
						className="absolute inset-0 -z-10"
					>
						<ArtworkWall urls={covers} columns={5} />
						{/* Lets the aurora glow through and keeps the copy legible. */}
						<div
							className="absolute inset-0"
							style={{
								background: `linear-gradient(to bottom left, color-mix(in srgb, ${palette.base} 35%, transparent), color-mix(in srgb, ${palette.base} 82%, transparent) 55%, color-mix(in srgb, ${palette.base} 96%, transparent))`,
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<div className={cn("relative p-6 sm:p-8", contentClassName)}>{children}</div>
		</section>
	);
}

/** Large two-line display title; the second line wears the brand gradient. */
export function HeroTitle({ first, second, className, as: Tag = "h1" }: { first: ReactNode; second?: ReactNode; className?: string; as?: "h1" | "h2" }) {
	return (
		<Tag className={cn("type-display text-[2.25rem] text-white sm:text-5xl", className)}>
			<span className="block">{first}</span>
			{second && <span className="brand-text block w-fit pb-[0.08em]">{second}</span>}
		</Tag>
	);
}

/** Frosted stadium badge for white-on-banner stats and perks. */
export function GlassPill({ icon: Icon, value, label, className }: { icon?: LucideIcon; value?: ReactNode; label: ReactNode; className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.14] py-[7px] pl-2.5 pr-3.5 text-sm text-white backdrop-blur-md", className)}>
			{Icon && <Icon className="size-[15px]" strokeWidth={2.25} />}
			{value !== undefined && (
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={String(value)}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						className="font-semibold tabular-nums"
					>
						{value}
					</motion.span>
				</AnimatePresence>
			)}
			<span className="text-white/80">{label}</span>
		</span>
	);
}

/** Frosted icon badge on a banner. */
export function GlassIconBadge({ icon: Icon, size = 52, className }: { icon: LucideIcon; size?: number; className?: string }) {
	return (
		<span
			className={cn("inline-flex items-center justify-center border border-white/20 bg-white/[0.16] text-white backdrop-blur-md", className)}
			style={{ width: size, height: size, borderRadius: size * 0.32 }}
		>
			<Icon style={{ width: size * 0.5, height: size * 0.5 }} />
		</span>
	);
}

/** Uppercase eyebrow on a banner. */
export function HeroEyebrow({ children, className }: { children: ReactNode; className?: string }) {
	return <p className={cn("type-eyebrow text-white/75", className)}>{children}</p>;
}
