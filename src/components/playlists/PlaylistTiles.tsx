"use client";

import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * First grid cell of a playlists grid: a tonal-gradient square with a primary
 * "+" medallion, shaped exactly like a `MediaCard`.
 */
export function NewPlaylistTile({ onClick, subtitle = "Start from scratch", index = 0 }: { onClick: () => void; subtitle?: string; index?: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			animate={{ opacity: 1, y: 0 }}
			whileTap={{ scale: 0.95 }}
			transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.035, ease: [0.05, 0.7, 0.1, 1] }}
			className="group relative rounded-2xl p-1.5 transition-colors duration-300 hover:bg-surface-high/70"
		>
			<button type="button" onClick={onClick} className="block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
				<span className="bg-tonal-gradient relative flex aspect-square items-center justify-center overflow-hidden rounded-xl shadow-[0_4px_14px_-6px_rgb(0_0_0/0.25)]">
					{/* A soft light that wakes on hover. */}
					<span aria-hidden className="absolute -right-1/4 -top-1/4 size-3/4 rounded-full bg-white/25 blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-125 dark:bg-white/10" />
					<span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--primary)_70%,transparent)] transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:rotate-90 group-hover:scale-110">
						<Plus className="size-8" strokeWidth={2.25} />
					</span>
				</span>
				<span className="mt-2 block px-0.5">
					<span className="block truncate text-sm font-semibold text-foreground">New playlist</span>
					<span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
				</span>
			</button>
		</motion.div>
	);
}

/** Card-grid skeleton matching `CardGrid` + `MediaCard`. */
export function CardGridSkeleton({ count = 10, round = false, className }: { count?: number; round?: boolean; className?: string }) {
	return (
		<div className={cn("-mx-1.5 grid grid-cols-2 gap-x-1 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6", className)}>
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className={cn("p-1.5", round && "flex flex-col items-center")}>
					<Skeleton className={cn("aspect-square w-full", round ? "rounded-full" : "rounded-xl")} />
					<Skeleton className="mt-2.5 h-3.5 w-3/4 rounded-full" />
					<Skeleton className="mt-1.5 h-3 w-1/2 rounded-full" />
				</div>
			))}
		</div>
	);
}

/** Track-row skeleton matching `TrackRow`. */
export function TrackRowsSkeleton({ count = 8, numbered = false }: { count?: number; numbered?: boolean }) {
	return (
		<div className="-mx-2 space-y-0.5">
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className="flex items-center gap-3 px-2 py-1.5">
					{numbered && <Skeleton className="h-3 w-5 rounded-full" />}
					<Skeleton className="size-12 shrink-0 rounded-lg" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-3.5 rounded-full" style={{ width: `${40 + ((i * 37) % 35)}%` }} />
						<Skeleton className="h-3 rounded-full" style={{ width: `${22 + ((i * 23) % 20)}%` }} />
					</div>
					<Skeleton className="hidden h-3 w-10 rounded-full sm:block" />
				</div>
			))}
		</div>
	);
}

/** Mirrors `CollectionScaffold` (cover, eyebrow, title, stats, actions) + rows. */
export function PlaylistDetailSkeleton() {
	return (
		<div>
			<div className="flex flex-col items-center gap-6 pb-4 pt-6 md:flex-row md:items-end md:gap-10 md:pt-12">
				<Skeleton className="size-[min(62vw,260px)] shrink-0 rounded-[28px] md:size-[232px] lg:size-[264px]" />
				<div className="flex w-full flex-1 flex-col items-start">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="mt-3 h-12 w-3/4 max-w-md rounded-2xl sm:h-16" />
					<div className="mt-4 flex gap-2">
						<Skeleton className="h-8 w-24 rounded-full" />
						<Skeleton className="h-8 w-20 rounded-full" />
						<Skeleton className="h-8 w-32 rounded-full" />
					</div>
					<div className="mt-5 flex w-full items-center gap-2">
						<Skeleton className="size-11 rounded-full" />
						<Skeleton className="size-11 rounded-full" />
						<div className="flex-1" />
						<Skeleton className="size-[52px] rounded-full" />
						<Skeleton className="size-[72px] rounded-full" />
					</div>
				</div>
			</div>
			<div className="mt-6">
				<TrackRowsSkeleton count={8} numbered />
			</div>
		</div>
	);
}
