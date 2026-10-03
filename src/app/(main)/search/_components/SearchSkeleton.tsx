import { Skeleton } from "@/components/ui/skeleton";

/** Matches the idle Search screen: title, bar, spotlight, genre tiles. */
export function SearchSkeleton() {
	return (
		<div aria-busy="true" aria-label="Loading search">
			<div className="pb-1 pt-3 sm:pt-6">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="mt-2 h-9 w-40 sm:h-12 sm:w-52 lg:h-14 lg:w-64" />
			</div>
			<div className="pb-2 pt-2.5">
				<Skeleton className="h-[60px] rounded-full" />
			</div>
			<div className="pt-2">
				<Skeleton className="h-[196px] rounded-[28px] sm:h-[240px] lg:h-[280px]" />
				<Skeleton className="mb-3 mt-10 h-6 w-32" />
				<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
					{Array.from({ length: 12 }, (_, i) => (
						<Skeleton key={i} className="h-[108px] rounded-[20px] lg:h-[124px]" />
					))}
				</div>
			</div>
		</div>
	);
}
