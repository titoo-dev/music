"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/format-time";
import { pointAtRatio, ratioAtPoint, roundedRectPath, type RoundedRect } from "@/lib/perimeter";

// Room around the pill for the hit area, glow and thumb to overflow into.
const PAD = 10;

interface SeekRingProps {
	currentTime: number;
	duration: number;
	buffered: number;
	/** Track is loading / buffering — a comet runs around the border. */
	loading: boolean;
	onSeek: (time: number) => void;
	className?: string;
	children: React.ReactNode;
}

function useBox(ref: React.RefObject<HTMLDivElement | null>) {
	const [box, setBox] = useState<RoundedRect>({ w: 0, h: 0, r: 0 });
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => {
			// Layout size, not getBoundingClientRect(): the pill mounts with a
			// scale-in transform, and ResizeObserver never fires for transforms —
			// a transformed measurement would leave the rim ~4% short, with its
			// hit area sitting on top of the right-hand buttons.
			const w = el.offsetWidth;
			const h = el.offsetHeight;
			const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
			setBox((prev) => (prev.w === w && prev.h === h && prev.r === r ? prev : { w, h, r }));
		};
		measure();
		if (typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [ref]);
	return box;
}

/** Push the time label outward, away from whichever edge the point sits on. */
export function tooltipTranslate(p: { x: number; y: number }, box: RoundedRect): string {
	const edges = [
		{ d: p.y, t: "-50% calc(-100% - 12px)" },
		{ d: box.h - p.y, t: "-50% 12px" },
		{ d: p.x, t: "calc(-100% - 12px) -50%" },
		{ d: box.w - p.x, t: "12px -50%" },
	];
	return edges.reduce((a, b) => (b.d < a.d ? b : a)).t;
}

/**
 * Wraps the floating player: its border *is* the seek bar. Progress runs
 * clockwise from 12 o'clock; click or drag anywhere on the rim to seek.
 */
export function SeekRing({ currentTime, duration, buffered, loading, onSeek, className, children }: SeekRingProps) {
	const ref = useRef<HTMLDivElement>(null);
	const box = useBox(ref);
	const [hover, setHover] = useState<number | null>(null);
	const [dragging, setDragging] = useState(false);
	const [focused, setFocused] = useState(false);

	const pct = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
	const bufPct = duration > 0 ? Math.min(1, Math.max(0, buffered / duration)) : 0;

	// The stroke sits on the 1px CSS border's center line.
	const ring: RoundedRect = { w: Math.max(0, box.w - 1), h: Math.max(0, box.h - 1), r: Math.max(0, box.r - 0.5) };
	const d = box.w > 0 ? roundedRectPath(ring, PAD + 0.5) : "";
	// The pill's outer border edge — the loading comet is clipped to it so its
	// glow only falls inward instead of haloing outside the player.
	const clipD = box.w > 0 ? roundedRectPath(box, PAD) : "";
	const clipId = `seek-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
	const active = hover !== null || dragging || focused;

	const ratioFromEvent = useCallback(
		(e: React.PointerEvent) => {
			const rect = ref.current?.getBoundingClientRect();
			if (!rect) return 0;
			// Undo any transform scale so screen px map back to layout px.
			const sx = box.w > 0 && rect.width > 0 ? rect.width / box.w : 1;
			const sy = box.h > 0 && rect.height > 0 ? rect.height / box.h : 1;
			return ratioAtPoint(ring, (e.clientX - rect.left) / sx - 0.5, (e.clientY - rect.top) / sy - 0.5);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ring.w, ring.h, ring.r, box.w, box.h]
	);

	const seekRatio = (r: number) => {
		if (duration > 0) onSeek(r * duration);
	};

	const thumb = pointAtRatio(ring, pct);
	const hoverPt = hover !== null ? pointAtRatio(ring, hover) : null;

	return (
		<div ref={ref} className={cn("relative", className)}>
			{children}
			{d && (
				<svg
					aria-hidden
					className="pointer-events-none absolute overflow-visible"
					style={{ left: -PAD, top: -PAD, width: box.w + PAD * 2, height: box.h + PAD * 2 }}
					data-testid="seek-ring"
				>
					{/* Buffered */}
					<motion.path
						d={d}
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						className="text-muted-foreground/25"
						initial={false}
						animate={{ pathLength: bufPct, opacity: bufPct > 0 && !loading ? 1 : 0 }}
						transition={{ duration: 0.3 }}
					/>
					{/* Played */}
					<motion.path
						d={d}
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						className="text-foreground"
						data-testid="seek-progress"
						initial={false}
						animate={{ pathLength: pct, opacity: pct > 0 ? (loading ? 0.35 : 1) : 0, strokeWidth: active ? 3 : 2 }}
						transition={{ pathLength: dragging ? { duration: 0 } : { duration: 0.25, ease: "linear" }, default: { duration: 0.2 } }}
					/>

					<defs>
						<clipPath id={clipId}>
							<path d={clipD} />
						</clipPath>
					</defs>

					{/* Loading comet — a short, tight segment orbiting the border. */}
					<AnimatePresence>
						{loading && (
							<motion.g
								key="comet"
								data-testid="seek-loading"
								clipPath={`url(#${clipId})`}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.25 }}
								className="text-highlight"
							>
								<motion.path
									d={d}
									fill="none"
									stroke="currentColor"
									strokeWidth={3}
									strokeLinecap="round"
									style={{ filter: "blur(1.5px)" }}
									initial={{ pathLength: 0.1, pathSpacing: 0.9, pathOffset: 0, opacity: 0.5 }}
									animate={{ pathOffset: [0, 1] }}
									transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
								/>
								<motion.path
									d={d}
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									strokeLinecap="round"
									initial={{ pathLength: 0.1, pathSpacing: 0.9, pathOffset: 0 }}
									animate={{ pathOffset: [0, 1] }}
									transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
								/>
								{/* Trailing echo, half a lap behind. */}
								<motion.path
									d={d}
									fill="none"
									stroke="currentColor"
									strokeWidth={1.5}
									strokeLinecap="round"
									initial={{ pathLength: 0.04, pathSpacing: 0.96, pathOffset: 0.5, opacity: 0.4 }}
									animate={{ pathOffset: [0.5, 1.5] }}
									transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
								/>
							</motion.g>
						)}
					</AnimatePresence>

					{/* Thumb at the progress head */}
					<motion.circle
						cx={thumb.x + PAD + 0.5}
						cy={thumb.y + PAD + 0.5}
						className="fill-foreground stroke-background"
						strokeWidth={2}
						initial={false}
						animate={{ r: active && pct > 0 && !loading ? 6 : 0 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
					/>

					{/* Hit area — a fat invisible stroke along the rim. */}
					<path
						d={d}
						fill="none"
						stroke="transparent"
						strokeWidth={14}
						className="pointer-events-[stroke] cursor-pointer"
						style={{ pointerEvents: "stroke" }}
						data-testid="seek-hit"
						onPointerDown={(e) => {
							(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
							setDragging(true);
							seekRatio(ratioFromEvent(e));
						}}
						onPointerMove={(e) => {
							const r = ratioFromEvent(e);
							setHover(r);
							if (dragging) seekRatio(r);
						}}
						onPointerUp={() => setDragging(false)}
						onPointerCancel={() => setDragging(false)}
						onPointerLeave={() => !dragging && setHover(null)}
					/>
				</svg>
			)}

			{/* Accessible slider (the SVG rim is pointer-only). */}
			<div
				role="slider"
				tabIndex={0}
				aria-label="Seek"
				aria-valuemin={0}
				aria-valuemax={Math.round(duration)}
				aria-valuenow={Math.round(currentTime)}
				aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
				aria-busy={loading || undefined}
				onFocus={(e) => e.currentTarget.matches(":focus-visible") && setFocused(true)}
				onBlur={() => setFocused(false)}
				onKeyDown={(e) => {
					if (duration <= 0) return;
					const step = e.shiftKey ? 15 : 5;
					if (e.key === "ArrowRight" || e.key === "ArrowUp") {
						e.preventDefault();
						onSeek(Math.min(duration, currentTime + step));
					} else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
						e.preventDefault();
						onSeek(Math.max(0, currentTime - step));
					} else if (e.key === "Home") {
						e.preventDefault();
						onSeek(0);
					} else if (e.key === "End") {
						e.preventDefault();
						onSeek(duration);
					}
				}}
				className="sr-only"
			/>

			<AnimatePresence>
				{hoverPt && duration > 0 && (
					<motion.span
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.12 }}
						className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground shadow-sm"
						style={{ left: hoverPt.x, top: hoverPt.y, translate: tooltipTranslate(hoverPt, box) }}
					>
						{formatTime((hover ?? 0) * duration)}
					</motion.span>
				)}
			</AnimatePresence>
		</div>
	);
}
