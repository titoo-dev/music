"use client";

import { useCallback, useState } from "react";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_MIN, PLACEHOLDER_SIZE, coverAt, isSizedCover, pickCoverSize } from "@/lib/cover-size";

interface CoverImageProps {
	src?: string | null;
	alt?: string;
	className?: string;
	iconClassName?: string;
	loading?: "lazy" | "eager";
	/** Rendered size in CSS px. Measured from layout when omitted — pass it
	 *  when the box is much bigger than the detail needed (blurred backdrops). */
	size?: number;
}

// Covers already decoded this session: a re-mounted row (virtualized lists)
// shows them sharp at once instead of replaying the blur-in.
const loadedCovers = new Set<string>();

/**
 * Album / track artwork that loads progressively:
 * - Deezer covers are requested at the size they render at (not 1000px);
 * - large ones show a ~1 KB blurred version first;
 * - the real image fades and sharpens in once decoded, lazily by default.
 */
export function CoverImage({ src, alt = "", className, iconClassName, loading = "lazy", size }: CoverImageProps) {
	const [failed, setFailed] = useState<string | null>(null);
	const [measured, setMeasured] = useState(0);
	const [loaded, setLoaded] = useState<string | null>(null);

	// Measure the box once mounted (before paint) and again if it grows —
	// never shrink, so a resize doesn't refetch a smaller variant.
	const measure = useCallback(
		(el: HTMLSpanElement | null) => {
			if (!el || size) return;
			const read = () => {
				const px = Math.max(el.clientWidth, el.clientHeight);
				if (px > 0) setMeasured((prev) => Math.max(prev, px));
			};
			read();
			if (typeof ResizeObserver === "undefined") return;
			const observer = new ResizeObserver(read);
			observer.observe(el);
			return () => observer.disconnect();
		},
		[size]
	);

	if (!src || failed === src) {
		return (
			<div className={cn("flex items-center justify-center rounded-md bg-muted text-muted-foreground", className)}>
				<Music className={cn("h-1/3 w-1/3 opacity-40", iconClassName)} />
			</div>
		);
	}

	const sized = isSizedCover(src);
	const px = size ?? measured;
	const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio;
	const target = pickCoverSize(px, dpr);
	const full = px > 0 ? (sized ? coverAt(src, target) : src) : null;
	// Decoded earlier by another instance: show it as is, no blur, no fade.
	const known = !!full && loaded !== full && loadedCovers.has(full);
	const ready = known || (!!full && loaded === full);
	const placeholder = sized && px > 0 && target >= PLACEHOLDER_MIN && !known;

	return (
		<span ref={measure} data-slot="cover-image" className={cn("relative block aspect-square overflow-hidden rounded-md bg-muted", className)}>
			{placeholder && (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={coverAt(src, PLACEHOLDER_SIZE)}
					alt=""
					aria-hidden
					decoding="async"
					className={cn("absolute inset-0 size-full scale-110 object-cover blur-lg transition-opacity duration-500", ready && "opacity-0")}
				/>
			)}
			{full && (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={full}
					alt={alt}
					loading={loading}
					decoding="async"
					onLoad={() => {
						loadedCovers.add(full);
						setLoaded(full);
					}}
					onError={() => setFailed(src)}
					className={cn(
						"absolute inset-0 size-full object-cover",
						ready ? "opacity-100" : "opacity-0 blur-md",
						loaded === full && "transition-[opacity,filter] duration-500 ease-out"
					)}
				/>
			)}
		</span>
	);
}
