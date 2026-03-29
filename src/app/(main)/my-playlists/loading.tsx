import { PlaylistGridSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistsLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-4 w-24" />
				</div>
				<Skeleton className="h-8 w-28" />
			</div>
			<PlaylistGridSkeleton count={8} />
		</div>
	);
}
