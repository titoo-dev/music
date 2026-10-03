"use client";

import { Suspense } from "react";
import { SearchScreen } from "./_components/SearchScreen";
import { SearchSkeleton } from "./_components/SearchSkeleton";

export default function SearchPage() {
	return (
		<Suspense fallback={<SearchSkeleton />}>
			<SearchScreen />
		</Suspense>
	);
}
