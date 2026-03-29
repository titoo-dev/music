import { SearchResultsSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-7 w-64" />
			<SearchResultsSkeleton />
		</div>
	);
}
