"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { sizedCover } from "@/lib/cover-palette";
import { Equalizer } from "@/components/motion/icons";
import { EASE } from "./motion";

/** Scroll position flags for a horizontal scroller + a pager. */
function useScroller() {
	const ref = useRef<HTMLDivElement>(null);
	const [edges, setEdges] = useState({ start: true, end: true });
	const update = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
	}, []);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		update();
		el.addEventListener("scroll", update, { passive: true });
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => {
			el.removeEventListener("scroll", update);
			ro.disconnect();
		};
	}, [update]);
	const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
	return { ref, edges, page };
}

function PagerButton({ dir, hidden, onClick }: { dir: 1 | -1; hidden: boolean; onClick: () => void }) {
	const Icon = dir === 1 ? ChevronRight : ChevronLeft;
	return (
		<button
			type="button"
			aria-label={dir === 1 ? "Scroll right" : "Scroll left"}
			tabIndex={-1}
			onClick={onClick}
			className={cn(
				"absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-highest/90 text-foreground shadow-float backdrop-blur transition-all duration-200 hover:scale-105 md:flex",
				dir === 1 ? "-right-3" : "-left-3",
				hidden ? "pointer-events-none scale-75 opacity-0" : "opacity-0 group-hover/carousel:opacity-100"
			)}
		>
			<Icon className="size-5" />
		</button>
	);
}

/** Horizontally scrolling row of cards, with pager buttons on hover (desktop). */
export function CardCarousel({ children, className, itemClassName = "w-[152px] sm:w-[176px] lg:w-[188px]" }: { children: ReactNode[]; className?: string; itemClassName?: string }) {
	const { ref, edges, page } = useScroller();
	return (
		<div className={cn("group/carousel relative", className)}>
			<div ref={ref} className="scrollbar-hide -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8">
				{children.map((c, i) => (
					<div key={i} className={cn("shrink-0 snap-start", itemClassName)}>
						{c}
					</div>
				))}
			</div>
			<PagerButton dir={-1} hidden={edges.start} onClick={() => page(-1)} />
			<PagerButton dir={1} hidden={edges.end} onClick={() => page(1)} />
		</div>
	);
}

export interface ArtItem {
	key: string;
	title: string;
	subtitle?: string | null;
	image?: string | null;
	/** Shows a now-playing badge. */
	current?: boolean;
	playing?: boolean;
	badge?: ReactNode;
}

/**
 * Multi-browse carousel of full-bleed artwork (M3 expressive): a large lead
 * tile, then followers; captions ride a dark gradient. Tiles lift on hover.
 */
export function ArtCarousel({
	items,
	onSelect,
	height = 200,
	lead = 1.6,
	className,
	label,
}: {
	items: ArtItem[];
	onSelect: (index: number) => void;
	/** Tile height in px (desktop grows by 20%). */
	height?: number;
	/** Width of the lead tile, as a multiple of the height. */
	lead?: number;
	className?: string;
	label?: string;
}) {
	const { ref, edges, page } = useScroller();
	return (
		<div className={cn("group/carousel relative", className)} style={{ ["--art-h" as string]: `${height}px` }}>
			<div
				ref={ref}
				aria-label={label}
				className="scrollbar-hide -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [--art-h-r:var(--art-h)] lg:[--art-h-r:calc(var(--art-h)*1.2)]"
			>
				{items.map((item, i) => (
					<motion.button
						key={item.key}
						type="button"
						onClick={() => onSelect(i)}
						initial={{ opacity: 0, x: 24 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.05, ease: EASE.decelerate }}
						whileTap={{ scale: 0.97 }}
						aria-label={item.subtitle ? `${item.title} · ${item.subtitle}` : item.title}
						className="group/art relative shrink-0 snap-start overflow-hidden rounded-[28px] bg-surface-highest text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
						style={{
							height: "var(--art-h-r)",
							width: i === 0 ? `calc(var(--art-h-r) * ${lead})` : "calc(var(--art-h-r) * 0.82)",
						}}
					>
						{item.image ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={sizedCover(item.image, 500)}
								alt=""
								loading={i < 4 ? "eager" : "lazy"}
								className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover/art:scale-[1.06]"
							/>
						) : (
							<span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
								<Music className="size-10" />
							</span>
						)}
						<span className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,rgb(0_0_0/0.85))]" />
						<span className="absolute inset-x-4 bottom-3.5">
							<span className={cn("block truncate font-semibold text-white", i === 0 ? "text-lg sm:text-xl" : "text-base")}>{item.title}</span>
							{item.subtitle && <span className="block truncate text-xs text-white/80 sm:text-sm">{item.subtitle}</span>}
						</span>
						{item.current && (
							<span className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
								<Equalizer playing={!!item.playing} className="h-3.5" />
							</span>
						)}
						{item.badge && <span className="absolute right-3 top-3">{item.badge}</span>}
					</motion.button>
				))}
			</div>
			<PagerButton dir={-1} hidden={edges.start} onClick={() => page(-1)} />
			<PagerButton dir={1} hidden={edges.end} onClick={() => page(1)} />
		</div>
	);
}
