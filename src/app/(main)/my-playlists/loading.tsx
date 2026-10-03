import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/playlists/PlaylistTiles";

export default function PlaylistsLoading() {
	return (
		<div>
			{/* Mirrors the hero: eyebrow, display title, two pills, actions. */}
			<div className="flex min-h-[156px] flex-col gap-5 pb-6 pt-10 sm:min-h-[216px] md:flex-row md:items-end md:justify-between">
				<div>
					<Skeleton className="h-3 w-24 rounded-full" />
					<Skeleton className="mt-3 h-12 w-56 rounded-2xl sm:h-16 sm:w-80" />
					<div className="mt-4 flex gap-2">
						<Skeleton className="h-8 w-28 rounded-full" />
						<Skeleton className="h-8 w-24 rounded-full" />
					</div>
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-11 w-48 rounded-full" />
					<Skeleton className="h-11 w-36 rounded-full" />
				</div>
			</div>
			<CardGridSkeleton count={10} />
		</div>
	);
}
