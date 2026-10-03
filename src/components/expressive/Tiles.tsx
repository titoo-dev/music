"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Music, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { sizedCover } from "@/lib/cover-palette";
import { Equalizer, PlayPauseIcon } from "@/components/motion/icons";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { DUR, EASE, SPRING } from "./motion";

/** Square artwork (or a 2×2 mosaic with four or more covers). */
export function Art({ src, covers, className, rounded = "rounded-none", size = 250 }: { src?: string | null; covers?: string[]; className?: string; rounded?: string; size?: number }) {
	if (covers && covers.length >= 4) {
		return (
			<span className={cn("grid grid-cols-2 grid-rows-2 overflow-hidden bg-surface-highest", rounded, className)}>
				{covers.slice(0, 4).map((c, i) => (
					// eslint-disable-next-line @next/next/no-img-element
					<img key={i} src={sizedCover(c, Math.round(size / 2))} alt="" loading="lazy" className="size-full object-cover" />
				))}
			</span>
		);
	}
	const one = src ?? covers?.[0];
	return one ? (
		// eslint-disable-next-line @next/next/no-img-element
		<img src={sizedCover(one, size)} alt="" loading="lazy" className={cn("object-cover", rounded, className)} />
	) : (
		<span className={cn("flex items-center justify-center bg-surface-highest text-muted-foreground", rounded, className)}>
			<Music className="size-1/3" />
		</span>
	);
}

/** The "Liked songs" artwork: liked gradient + heart. */
export function LikedArt({ className }: { className?: string }) {
	return (
		<span className={cn("bg-liked-gradient flex items-center justify-center text-white", className)}>
			<Heart className="size-[42%] fill-current" />
		</span>
	);
}

/**
 * Compact "quick pick" tile: inset artwork, title + subtitle on a soft surface.
 * Hover lifts the art, washes the tile with a blurred copy of it and slides in
 * a play key (for tiles that play). The current track keeps the wash, an
 * accent ring and a now-playing veil on the art.
 */
export function QuickTile({
	title,
	subtitle,
	subtitleHref,
	art,
	href,
	onClick,
	current = false,
	playing = false,
	index = 0,
}: {
	title: string;
	subtitle?: string | null;
	/** Makes the subtitle (an artist name) its own link, apart from the tile's target. */
	subtitleHref?: string | null;
	art: ReactNode;
	href?: string;
	onClick?: () => void;
	current?: boolean;
	playing?: boolean;
	index?: number;
}) {
	const label = subtitle ? `${title} · ${subtitle}` : title;
	// The tile's target is a full-bleed layer under the (click-through) content,
	// so the subtitle link can sit beside it instead of nested inside it.
	const target = "absolute inset-0 z-0 rounded-[inherit] outline-none";
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.38, delay: Math.min(index, 10) * 0.05, ease: EASE.decelerate }}
			whileTap={{ scale: 0.97 }}
			className={cn(
				"group relative isolate flex h-16 w-full items-center gap-3 overflow-hidden rounded-[18px] p-1.5 pr-2 ring-1 ring-inset transition-[background-color,box-shadow] duration-300",
				"has-[>:first-child:focus-visible]:ring-2 has-[>:first-child:focus-visible]:ring-ring/50",
				current
					? "bg-surface-container ring-highlight/35 shadow-[0_10px_28px_-14px_var(--highlight)]"
					: "bg-surface-container ring-border/60 hover:bg-surface-high hover:shadow-[0_10px_28px_-16px_rgb(0_0_0/0.35)]"
			)}
		>
			{href ? <Link href={href} aria-label={label} className={target} /> : <button type="button" onClick={onClick} aria-label={label} className={target} />}
			{/* Artwork wash: a blurred, saturated copy of the cover behind the tile's content. */}
			<span
				aria-hidden
				data-testid="quick-tile-wash"
				className={cn(
					"pointer-events-none absolute -inset-6 -z-10 blur-2xl saturate-150 transition-opacity duration-500 [&>*]:size-full",
					current ? "opacity-40 dark:opacity-50" : "opacity-0 group-hover:opacity-30 dark:group-hover:opacity-40"
				)}
			>
				{art}
			</span>
			<span aria-hidden className="pointer-events-none relative size-[52px] shrink-0 overflow-hidden rounded-[12px] shadow-[0_6px_14px_-6px_rgb(0_0_0/0.45)] transition-transform duration-300 ease-out group-hover:scale-[1.04]">
				{art}
				<AnimatePresence>
					{current && (
						<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
							<Equalizer playing={playing} className="h-4" />
						</motion.span>
					)}
				</AnimatePresence>
			</span>
			<span className="pointer-events-none relative min-w-0 flex-1 text-left">
				<span className={cn("block truncate text-sm font-semibold leading-tight tracking-[-0.01em]", current ? "text-highlight" : "text-foreground")}>{title}</span>
				{subtitle &&
					(subtitleHref ? (
						<span className="mt-1 block truncate text-xs leading-tight text-muted-foreground">
							<Link href={subtitleHref} className="pointer-events-auto no-underline underline-offset-2 transition-colors hover:text-foreground hover:underline">
								{subtitle}
							</Link>
						</span>
					) : (
						<span className="mt-1 block truncate text-xs leading-tight text-muted-foreground">{subtitle}</span>
					))}
			</span>
			{onClick && !href && (
				<span
					aria-hidden
					className={cn(
						"pointer-events-none relative mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)] transition-[opacity,translate,scale] duration-300 ease-out",
						current
							? "opacity-100"
							: "translate-x-2 scale-90 opacity-0 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-has-[>:first-child:focus-visible]:translate-x-0 group-has-[>:first-child:focus-visible]:scale-100 group-has-[>:first-child:focus-visible]:opacity-100"
					)}
				>
					<PlayPauseIcon playing={current && playing} className="size-4" />
				</span>
			)}
		</motion.div>
	);
}

/** Primary circular heart badge that pops in (saved albums on cards). */
export function SavedBadge() {
	return (
		<motion.span
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={SPRING.pop}
			aria-label="Saved"
			className="flex size-6 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm"
		>
			<Heart className="size-3.5 fill-current" />
		</motion.span>
	);
}

/**
 * Large circular Play ⇄ Pause for a collection, with a buffering ring and a
 * glow that swells while this collection plays.
 */
export function BigPlayButton({
	trackIds,
	onPlay,
	label = "Play",
	disabled,
	size = 64,
}: {
	trackIds: string[];
	onPlay: () => void;
	label?: string;
	disabled?: boolean;
	size?: number;
}) {
	const currentId = usePlayerStore((s) => s.currentTrack?.trackId ?? null);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const isBuffering = usePlayerStore((s) => s.isBuffering);
	const toggle = usePlayerStore((s) => s.toggle);
	const isThis = currentId != null && trackIds.includes(currentId);
	const playing = isThis && isPlaying;
	const ring = size + 8;

	return (
		<span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: ring, height: ring }}>
			<motion.button
				type="button"
				aria-label={playing ? "Pause" : label}
				title={playing ? "Pause" : label}
				disabled={disabled}
				onClick={isThis ? toggle : onPlay}
				whileTap={{ scale: 0.9 }}
				animate={{ scale: playing ? 1.06 : 1 }}
				transition={{ duration: DUR.medium, ease: EASE.emphasized }}
				className={cn(
					"flex items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-[background-color,box-shadow] duration-500 hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
					playing
						? "shadow-[0_8px_28px_2px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
						: "shadow-[0_6px_14px_-2px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
				)}
				style={{ width: size, height: size }}
			>
				<PlayPauseIcon playing={playing} className="size-[46%]" />
			</motion.button>
			<AnimatePresence>
				{isThis && isBuffering && (
					<motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }} exit={{ opacity: 0 }} transition={{ rotate: { repeat: Infinity, duration: 1, ease: "linear" } }} viewBox="0 0 40 40" className="pointer-events-none absolute inset-0 text-primary">
						<circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="30 90" />
					</motion.svg>
				)}
			</AnimatePresence>
		</span>
	);
}

/** Tonal 52px shuffle button next to BigPlayButton. */
export function ShuffleButton({ onShuffle, disabled, active = false }: { onShuffle: () => void; disabled?: boolean; active?: boolean }) {
	return (
		<motion.button
			type="button"
			aria-label="Shuffle"
			title="Shuffle"
			aria-pressed={active}
			disabled={disabled}
			onClick={onShuffle}
			whileTap={{ scale: 0.9, rotate: -12 }}
			className={cn(
				"flex size-[52px] shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
				active ? "bg-primary-container text-on-primary-container" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
			)}
		>
			<Shuffle className="size-6" />
		</motion.button>
	);
}

/** Tonal round icon button (secondary actions in hero action rows). */
export function TonalIconButton({
	label,
	onClick,
	children,
	active = false,
	className,
	disabled,
}: {
	label: string;
	onClick?: () => void;
	children: ReactNode;
	active?: boolean;
	className?: string;
	disabled?: boolean;
}) {
	return (
		<motion.button
			type="button"
			aria-label={label}
			title={label}
			aria-pressed={active}
			disabled={disabled}
			onClick={onClick}
			whileTap={{ scale: 0.88 }}
			className={cn(
				"flex size-11 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
				active ? "bg-primary-container text-on-primary-container" : "bg-secondary text-secondary-foreground hover:bg-secondary/75",
				className
			)}
		>
			{children}
		</motion.button>
	);
}
