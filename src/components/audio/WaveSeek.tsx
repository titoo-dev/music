"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/format-time";
import { wavePath } from "@/lib/wave";

const H = 28;
const AMPLITUDE = 3.5;
const WAVELENGTH = 30;
/** Radians per second the crests travel. */
const SPEED = 5;

interface WaveSeekProps {
	currentTime: number;
	duration: number;
	buffered: number;
	/** Music is audibly playing — the played part ripples. Paused → flat. */
	playing: boolean;
	onSeek: (time: number) => void;
	className?: string;
	/** Bar height in px (the wave oscillates around its middle). */
	height?: number;
	/** Stroke width of the line and the wave. */
	stroke?: number;
	/** Peak deviation of the wave while playing, in px. */
	amplitude?: number;
	/** Distance between two crests, in px. */
	wavelength?: number;
	/** Elapsed / remaining labels under the bar. */
	showTimes?: boolean;
	/** The pill playhead. */
	thumb?: boolean;
	/** `primary` paints the played part and the playhead in the accent colour. */
	tone?: "foreground" | "primary";
	/** Colour class for the unplayed line (defaults to a faint tone of the played colour). */
	trackClassName?: string;
}

function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
	const [w, setW] = useState(0);
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => setW(el.offsetWidth);
		measure();
		if (typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [ref]);
	return w;
}

/**
 * Seek bar whose played section is a living sine wave (the "squiggly"
 * progress of modern mobile players). The wave is redrawn straight into the
 * DOM from an animation frame, so React never re-renders per frame.
 */
export function WaveSeek({
	currentTime,
	duration,
	buffered,
	playing,
	onSeek,
	className,
	height = H,
	stroke = 3,
	amplitude = AMPLITUDE,
	wavelength = WAVELENGTH,
	showTimes = true,
	thumb = true,
	tone = "foreground",
	trackClassName,
}: WaveSeekProps) {
	const ref = useRef<HTMLDivElement>(null);
	const waveRef = useRef<SVGPathElement>(null);
	const w = useWidth(ref);
	const reduced = useReducedMotion();
	const [drag, setDrag] = useState<number | null>(null);
	const [hover, setHover] = useState(false);
	const mid = height / 2;
	const primary = tone === "primary";

	const pct = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
	const bufPct = duration > 0 ? Math.min(1, Math.max(0, buffered / duration)) : 0;
	const shown = drag ?? pct;
	const x = shown * w;
	const active = drag !== null || hover;

	// Animation state lives in a ref — read and written only from the frame loop.
	const anim = useRef({ phase: 0, amp: 0 });
	const target = playing && !reduced && drag === null ? amplitude : 0;

	useAnimationFrame((_, delta) => {
		const a = anim.current;
		const dt = Math.min(0.05, delta / 1000);
		const settled = Math.abs(a.amp - target) < 0.01;
		a.amp = settled ? target : a.amp + (target - a.amp) * Math.min(1, dt * 6);
		if (a.amp > 0) a.phase = (a.phase + dt * SPEED) % (Math.PI * 2);
		waveRef.current?.setAttribute("d", wavePath({ x0: 0, x1: x, mid, amplitude: a.amp, wavelength, phase: a.phase }));
	});

	const ratioFromEvent = (e: React.PointerEvent) => {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect || rect.width === 0) return 0;
		return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
	};

	const commit = (r: number) => {
		if (duration > 0) onSeek(r * duration);
	};

	// The playhead pill scales with the stroke so thick bars keep a chunky thumb.
	const thumbW = Math.max(5, stroke + 1);

	return (
		<div className={cn("select-none", className)}>
			<div
				ref={ref}
				role="slider"
				tabIndex={0}
				aria-label="Seek"
				aria-valuemin={0}
				aria-valuemax={Math.round(duration)}
				aria-valuenow={Math.round(currentTime)}
				aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
				data-testid="wave-seek"
				data-playing={target > 0 || undefined}
				className="relative cursor-pointer touch-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
				style={{ height }}
				onPointerEnter={() => setHover(true)}
				onPointerLeave={() => setHover(false)}
				onPointerDown={(e) => {
					(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
					setDrag(ratioFromEvent(e));
				}}
				onPointerMove={(e) => {
					if (drag !== null) setDrag(ratioFromEvent(e));
				}}
				onPointerUp={(e) => {
					if (drag === null) return;
					commit(ratioFromEvent(e));
					setDrag(null);
				}}
				onPointerCancel={() => setDrag(null)}
				onKeyDown={(e) => {
					if (duration <= 0) return;
					const step = e.shiftKey ? 15 : 5;
					const keys: Record<string, number> = {
						ArrowRight: Math.min(duration, currentTime + step),
						ArrowUp: Math.min(duration, currentTime + step),
						ArrowLeft: Math.max(0, currentTime - step),
						ArrowDown: Math.max(0, currentTime - step),
						Home: 0,
						End: duration,
					};
					if (e.key in keys) {
						e.preventDefault();
						onSeek(keys[e.key]);
					}
				}}
			>
				{w > 0 && (
					<svg aria-hidden width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="absolute inset-0 overflow-visible">
						{/* Unplayed track */}
						<line
							x1={x}
							y1={mid}
							x2={w}
							y2={mid}
							stroke="currentColor"
							strokeWidth={stroke}
							strokeLinecap="round"
							className={trackClassName ?? (primary ? "text-primary/20" : "text-foreground/15")}
						/>
						{/* Buffered ahead of the playhead */}
						{bufPct > shown && (
							<line
								x1={x}
								y1={mid}
								x2={bufPct * w}
								y2={mid}
								stroke="currentColor"
								strokeWidth={stroke}
								strokeLinecap="round"
								className={primary ? "text-primary/35" : "text-foreground/25"}
								data-testid="wave-buffered"
							/>
						)}
						{/* Played — the living wave */}
						<path
							ref={waveRef}
							d={wavePath({ x0: 0, x1: x, mid, amplitude: 0, wavelength, phase: 0 })}
							fill="none"
							stroke="currentColor"
							strokeWidth={stroke}
							strokeLinecap="round"
							strokeLinejoin="round"
							className={primary ? "text-primary" : "text-foreground"}
							data-testid="wave-played"
						/>
						{/* Playhead — a pill that stretches while you grab it */}
						{thumb && (
							<motion.rect
								x={x - thumbW / 2}
								width={thumbW}
								rx={thumbW / 2}
								className={primary ? "fill-primary" : "fill-foreground"}
								initial={false}
								animate={{ height: active ? height * 0.8 : height / 2, y: active ? mid - height * 0.4 : mid - height / 4 }}
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
							/>
						)}
					</svg>
				)}
			</div>
			{showTimes && (
				<div className="mt-1.5 flex justify-between text-xs font-semibold tabular-nums text-muted-foreground">
					<span className={cn("transition-colors duration-150", drag !== null && "font-semibold text-primary")}>{formatTime(shown * duration)}</span>
					<span>-{formatTime(Math.max(0, duration - shown * duration))}</span>
				</div>
			)}
		</div>
	);
}
