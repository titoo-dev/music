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
					"flex items-center justify-center bg-muted text-muted-foreground",
					className
				)}
			>
				<Music className={cn("h-1/2 w-1/2 opacity-40", iconClassName)} />
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			loading={loading}
			className={cn("object-cover", className)}
			onError={() => setError(true)}
		/>
	);
}
