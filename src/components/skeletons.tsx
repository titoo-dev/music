import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Skeletons mirror the final layouts (the expressive kit's shapes: 28px
// heroes, stadium pills, 12px cards) so the page doesn't jump when data lands.

/** `ui/skeleton` with tailwind-merge, so the final shapes (rounded-full, rounded-[28px]) win over its default radius. */
function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

const glow = "shadow-[0_18px_48px_2px_color-mix(in_srgb,var(--primary)_22%,transparent)]";

/** One track row (TrackRow geometry: number · 48px cover · two lines · duration). */
export function TrackRowSkeleton({ number = true, rank = false }: { number?: boolean; rank?: boolean }) {
	return (
		<div className="flex h-[60px] items-center gap-3 px-2">
			{rank ? <Skeleton className="h-6 w-6 shrink-0 rounded-lg" /> : number && <Skeleton className="ml-3 h-3 w-4 shrink-0 rounded-full" />}
			<Skeleton className="size-12 shrink-0 rounded-lg" />
			<div className="min-w-0 flex-1 space-y-2">
				<Skeleton className="h-3.5 w-[min(60%,280px)] rounded-full" />
				<Skeleton className="h-3 w-[min(40%,180px)] rounded-full" />
			</div>
			<Skeleton className="hidden h-3 w-9 rounded-full sm:block" />
			<Skeleton className="size-8 shrink-0 rounded-full" />
		</div>
	);
}

/** A track list (album / playlist / liked). */
export function TrackListSkeleton({ count = 8, number = true, rank = false }: { count?: number; number?: boolean; rank?: boolean }) {
	return (
		<div className="-mx-2 space-y-0.5">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} style={{ opacity: Math.max(0.25, 1 - i * 0.08) }}>
					<TrackRowSkeleton number={number} rank={rank} />
				</div>
			))}
		</div>
	);
}

/**
 * The `CollectionScaffold` hero: tonal backdrop bleeding under the top bar, a
 * glowing rounded-28 (or circular) cover, eyebrow pill, display title, subtitle
 * chip, stat pills and the action row ending in shuffle + big play.
 */
export function CollectionHeroSkeleton({ circle = false, subtitle = true, actions = 2 }: { circle?: boolean; subtitle?: boolean; actions?: number }) {
	return (
		<div className="relative mx-[calc(50%-50vw)] -mt-[calc(var(--header-h)+24px)] sm:-mt-[calc(var(--header-h)+32px)] px-[calc(50vw-50%)] pt-[calc(var(--header-h)+24px)] sm:pt-[calc(var(--header-h)+32px)]">
			<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
				<div className="bg-tonal-gradient absolute inset-0 opacity-70" />
				<div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--background)_15%,transparent),color-mix(in_srgb,var(--background)_60%,transparent)_50%,var(--background)_96%)]" />
			</div>
			<div className="relative flex flex-col items-center gap-6 pb-4 pt-6 md:flex-row md:items-end md:gap-10 md:pt-12">
				<Skeleton className={cn("size-[min(62vw,260px)] shrink-0 md:size-[232px] lg:size-[264px]", circle ? "rounded-full" : "rounded-[28px]", glow)} />
				<div className="flex w-full min-w-0 flex-1 flex-col items-start">
					<Skeleton className="h-6 w-24 rounded-full" />
					<Skeleton className="mt-4 h-10 w-[78%] rounded-2xl sm:h-14 lg:h-16" />
					{subtitle && <Skeleton className="mt-4 h-[38px] w-40 rounded-full" />}
					<div className="mt-3 flex gap-2">
						<Skeleton className="h-8 w-24 rounded-full" />
						<Skeleton className="h-8 w-20 rounded-full" />
						<Skeleton className="hidden h-8 w-20 rounded-full sm:block" />
					</div>
					<div className="mt-5 flex w-full items-center gap-2">
						{Array.from({ length: actions }).map((_, i) => (
							<Skeleton key={i} className="size-11 rounded-full" />
						))}
						<div className="flex-1" />
						<Skeleton className="size-[52px] rounded-full" />
						<Skeleton className="m-1 size-16 rounded-full" />
					</div>
				</div>
			</div>
		</div>
	);
}

/** Section heading placeholder (SectionTitle geometry). */
function TitleSkeleton({ eyebrow = false, className }: { eyebrow?: boolean; className?: string }) {
	return (
		<div className={cn("mb-3 mt-10 space-y-2", className)}>
			{eyebrow && <Skeleton className="h-2.5 w-20 rounded-full" />}
			<Skeleton className="h-6 w-44 rounded-full" />
		</div>
	);
}

/** A grid/carousel card (MediaCard geometry). */
export function GridCardSkeleton({ round = false }: { round?: boolean }) {
	return (
		<div className="p-1.5">
			<Skeleton className={cn("aspect-square w-full", round ? "rounded-full" : "rounded-xl")} />
			<Skeleton className={cn("mt-2.5 h-3.5 w-3/4 rounded-full", round && "mx-auto")} />
			<Skeleton className={cn("mt-1.5 h-3 w-1/2 rounded-full", round && "mx-auto")} />
		</div>
	);
}

/** A row of cards, clipped like CardCarousel. */
export function CardRowSkeleton({ count = 7, round = false }: { count?: number; round?: boolean }) {
	return (
		<div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className={cn("shrink-0", round ? "w-[128px] sm:w-[152px]" : "w-[152px] sm:w-[176px] lg:w-[188px]")}>
					<GridCardSkeleton round={round} />
				</div>
			))}
		</div>
	);
}

/** Album detail page. */
export function AlbumDetailSkeleton() {
	return (
		<div>
			<CollectionHeroSkeleton />
			<div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
				<TrackListSkeleton count={10} />
				<Skeleton className="hidden h-40 rounded-[20px] lg:block" />
			</div>
		</div>
	);
}

/** Header-only variant kept for callers that render their own list. */
export function AlbumHeaderSkeleton() {
	return <CollectionHeroSkeleton />;
}

/** Artist page: circular art, ranked top tracks, release pills + carousel. */
export function ArtistDetailSkeleton() {
	return (
		<div>
			<CollectionHeroSkeleton circle subtitle={false} actions={1} />
			<TitleSkeleton eyebrow />
			<TrackListSkeleton count={6} number={false} rank />
			<TitleSkeleton eyebrow />
			<div className="mb-3 flex gap-2">
				{[72, 88, 76, 64].map((w, i) => (
					<Skeleton key={i} className="h-10 rounded-full" style={{ width: w }} />
				))}
			</div>
			<CardRowSkeleton />
		</div>
	);
}

/** Playlist detail page (Deezer and user playlists). */
export function PlaylistDetailSkeleton() {
	return (
		<div>
			<CollectionHeroSkeleton />
			<div className="mt-6">
				<TrackListSkeleton count={10} number={false} />
			</div>
		</div>
	);
}

/** Card grid (MediaCard / CardGrid geometry). */
export function HomeGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="-mx-1.5 grid grid-cols-2 gap-x-1 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
			{Array.from({ length: count }).map((_, i) => (
				<GridCardSkeleton key={i} />
			))}
		</div>
	);
}

/**
 * Home: filter pills, the greeting hero banner, quick tiles, then the
 * "Recently played" multi-browse carousel and a card row.
 */
export function HomeSkeleton() {
	return (
		<div>
			<div className="mb-4 flex gap-2 py-2">
				{[64, 92, 96, 104, 84].map((w, i) => (
					<Skeleton key={i} className="h-10 shrink-0 rounded-full" style={{ width: w }} />
				))}
			</div>
			<div className="relative h-[340px] overflow-hidden rounded-[32px] sm:h-[320px] lg:h-[300px]">
				<Skeleton className="absolute inset-0 rounded-[32px]" />
				<div className="bg-tonal-gradient absolute inset-0 opacity-40" />
				<div className="absolute bottom-6 left-6 right-6 space-y-3 sm:bottom-8 sm:left-8 lg:bottom-10 lg:left-10">
					<Skeleton className="h-3 w-20 rounded-full" />
					<Skeleton className="h-10 w-[min(70%,420px)] rounded-2xl sm:h-12" />
					<div className="flex gap-2 pt-2">
						<Skeleton className="h-8 w-24 rounded-full" />
						<Skeleton className="h-8 w-28 rounded-full" />
						<Skeleton className="h-8 w-28 rounded-full" />
					</div>
					<div className="flex gap-2 pt-2">
						<Skeleton className="h-11 w-32 rounded-full" />
						<Skeleton className="h-11 w-28 rounded-full" />
					</div>
				</div>
			</div>
			<div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex h-[60px] items-center gap-3 overflow-hidden rounded-2xl bg-surface-high">
						<Skeleton className="size-[60px] shrink-0 rounded-none" />
						<Skeleton className="h-3.5 w-1/2 rounded-full" />
					</div>
				))}
			</div>
			<TitleSkeleton eyebrow />
			<div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
				{[1.6, 0.82, 0.82, 0.82, 0.82, 0.82].map((m, i) => (
					<Skeleton key={i} className="h-[200px] shrink-0 rounded-[28px] lg:h-[240px]" style={{ width: `calc(${m} * 200px)` }} />
				))}
			</div>
			<TitleSkeleton />
			<CardRowSkeleton />
		</div>
	);
}

/** Search results: filter pills + rows. */
export function SearchResultsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{[64, 92, 96, 92, 104].map((w, i) => (
					<Skeleton key={i} className="h-10 shrink-0 rounded-full" style={{ width: w }} />
				))}
			</div>
			<TrackListSkeleton count={10} number={false} />
		</div>
	);
}

/** My playlists grid. */
export function PlaylistGridSkeleton({ count = 6 }: { count?: number }) {
	return <HomeGridSkeleton count={count} />;
}
