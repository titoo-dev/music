import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for a single track row (used in album/playlist detail pages) */
export function TrackRowSkeleton() {
	return (
		<div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 border-b-[2px] border-foreground last:border-b-0">
			<Skeleton className="size-7 shrink-0" />
			<Skeleton className="size-9 sm:size-10 shrink-0" />
			<div className="flex-1 min-w-0 space-y-1.5">
				<Skeleton className="h-3.5 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
			</div>
			<Skeleton className="hidden sm:block h-3 w-10" />
		</div>
	);
}

/** Skeleton for a track list (album/playlist detail) */
export function TrackListSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div className="space-y-1">
			{Array.from({ length: count }).map((_, i) => (
				<TrackRowSkeleton key={i} />
			))}
		</div>
	);
}

/** Skeleton for album detail page header */
export function AlbumHeaderSkeleton() {
	return (
		<div className="flex flex-col md:flex-row gap-8">
			<div className="flex items-start gap-3">
				<Skeleton className="size-9 shrink-0" />
				<Skeleton className="w-32 h-32 sm:w-48 sm:h-48 shrink-0" />
			</div>
			<div className="flex flex-col justify-end gap-3">
				<Skeleton className="h-5 w-16" />
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-32" />
				<div className="flex gap-2 mt-1">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-28" />
				</div>
			</div>
		</div>
	);
}

/** Skeleton for album detail page */
export function AlbumDetailSkeleton() {
	return (
		<div className="space-y-8">
			<AlbumHeaderSkeleton />
			<div className="h-[2px] bg-foreground/10" />
			<div>
				<Skeleton className="h-4 w-24 mb-4" />
				<TrackListSkeleton count={10} />
			</div>
		</div>
	);
}

/** Skeleton for playlist detail page */
export function PlaylistDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Skeleton className="size-9 shrink-0" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-3 w-24" />
				</div>
			</div>
			<TrackListSkeleton count={8} />
		</div>
	);
}

/** Skeleton for a grid card (album/playlist on home page) */
export function GridCardSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="aspect-square w-full" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-3 w-1/2" />
		</div>
	);
}

/** Skeleton for the home page grid */
export function HomeGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			{Array.from({ length: count }).map((_, i) => (
				<GridCardSkeleton key={i} />
			))}
		</div>
	);
}

/** Skeleton for the home page */
export function HomeSkeleton() {
	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<Skeleton className="h-6 w-32" />
				<HomeGridSkeleton count={5} />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-6 w-32" />
				<HomeGridSkeleton count={5} />
			</div>
		</div>
	);
}

/** Skeleton for search results */
export function SearchResultsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-8 w-20" />
				))}
			</div>
			<TrackListSkeleton count={10} />
		</div>
	);
}

/** Skeleton for my-playlists grid */
export function PlaylistGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="space-y-2">
					<Skeleton className="aspect-square w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-1/3" />
				</div>
			))}
		</div>
	);
}

/** Skeleton for download history */
export function DownloadHistorySkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-6 w-40" />
			{Array.from({ length: 10 }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 py-2 border-b-[2px] border-foreground last:border-b-0">
					<Skeleton className="size-10 shrink-0" />
					<div className="flex-1 space-y-1.5">
						<Skeleton className="h-3.5 w-2/3" />
						<Skeleton className="h-3 w-1/3" />
					</div>
					<Skeleton className="h-5 w-16" />
				</div>
			))}
		</div>
	);
}
