"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverImageProps {
	src?: string | null;
	alt?: string;
	className?: string;
	iconClassName?: string;
	loading?: "lazy" | "eager";
}

export function CoverImage({
	src,
	alt = "",
	className,
	iconClassName,
	loading,
}: CoverImageProps) {
	const [error, setError] = useState(false);

	if (!src || error) {
		return (
			<div
				className={cn(
					"flex items-center justify-center border-[1.5px] sm:border-2 border-foreground bg-muted text-muted-foreground",
					className
				)}
			>
				<Music className={cn("h-1/3 w-1/3 opacity-40", iconClassName)} />
			</div>
		);
	}

	// Upgrade Deezer cover URLs to higher resolution
	const hiRes = src.replace(/\/\d+x\d+-/, "/1000x1000-");

	return (
		<img
			src={hiRes}
			alt={alt}
			loading={loading}
			className={cn("object-cover border-[1.5px] sm:border-2 border-foreground", className)}
			onError={() => setError(true)}
		/>
	);
}
