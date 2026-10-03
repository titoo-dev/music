"use client";

import { motion, AnimatePresence, type Transition } from "motion/react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { LOGO_BG, LOGO_GRADIENT, LOGO_VIEWBOX, waveletPath } from "@/lib/logo";

// ─────────────────────────────────────────────────────────────────────────────
// Motion-driven SVG primitives. Every icon here animates its own geometry
// (path morphs, pathLength draws, bar heights) instead of cross-fading two
// static glyphs — that is the visual signature of the redesign.
// ─────────────────────────────────────────────────────────────────────────────

const SPRING: Transition = { type: "spring", stiffness: 420, damping: 32 };
// Critically damped: a spring that overshoots a path morph pushes the
// vertices past their target and the glyph visibly wobbles.
const MORPH: Transition = { type: "spring", stiffness: 520, damping: 46 };

// Both states share the same point count so `d` interpolates cleanly:
// the play triangle is split in two quads that fold into the pause bars.
// They live in ONE path: two sibling paths sharing an edge leave an
// anti-aliased hairline down the middle of the triangle.
const PLAY = "M7 4.5 L12.5 7.8 L12.5 16.2 L7 19.5 Z M12.5 7.8 L19 12 L19 12 L12.5 16.2 Z";
const PAUSE = "M6.5 4.5 L10.5 4.5 L10.5 19.5 L6.5 19.5 Z M13.5 4.5 L17.5 4.5 L17.5 19.5 L13.5 19.5 Z";

export function PlayPauseIcon({
	playing,
	className,
}: {
	playing: boolean;
	className?: string;
}) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cn("size-4", className)}>
			<motion.path initial={false} animate={{ d: playing ? PAUSE : PLAY }} transition={MORPH} />
		</svg>
	);
}

/** Circular progress. `value` is 0..1. Pass `indeterminate` for a spinning arc. */
export function ProgressRing({
	value = 0,
	size = 40,
	stroke = 2,
	indeterminate = false,
	className,
	trackClassName = "text-border",
	children,
}: {
	value?: number;
	size?: number;
	stroke?: number;
	indeterminate?: boolean;
	className?: string;
	trackClassName?: string;
	children?: React.ReactNode;
}) {
	const r = (size - stroke) / 2;
	const clamped = Math.max(0, Math.min(1, value));
	return (
		<span className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
				<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={trackClassName} />
				{indeterminate ? (
					<motion.circle
						cx={size / 2}
						cy={size / 2}
						r={r}
						fill="none"
						stroke="currentColor"
						strokeWidth={stroke}
						strokeLinecap="round"
						initial={{ pathLength: 0.25, rotate: 0 }}
						animate={{ rotate: 360 }}
						transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
						style={{ originX: "50%", originY: "50%" }}
					/>
				) : (
					<motion.circle
						cx={size / 2}
						cy={size / 2}
						r={r}
						fill="none"
						stroke="currentColor"
						strokeWidth={stroke}
						strokeLinecap="round"
						initial={false}
						// A round cap draws a dot even at pathLength 0 — hide the arc there.
						animate={{ pathLength: clamped, opacity: clamped > 0 ? 1 : 0 }}
						transition={{ pathLength: { type: "spring", stiffness: 120, damping: 24 }, opacity: { duration: 0.15 } }}
					/>
				)}
			</svg>
			{children && <span className="relative">{children}</span>}
		</span>
	);
}

export function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
	return <ProgressRing indeterminate size={size} stroke={Math.max(1.5, size / 10)} className={className} trackClassName="text-current opacity-15" />;
}

/** Check mark that draws itself. */
export function DrawCheck({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-4", className)}>
			<motion.path
				d="M5 12.5 L10 17.5 L19 7"
				initial={{ pathLength: 0, opacity: 0 }}
				animate={{ pathLength: 1, opacity: 1 }}
				transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
			/>
		</svg>
	);
}

/** Download arrow — the stem draws down and the tray settles when `active`. */
export function DownloadGlyph({ active = false, className }: { active?: boolean; className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-4", className)}>
			<motion.g
				animate={active ? { y: [0, 3, 0] } : { y: 0 }}
				transition={active ? { repeat: Infinity, duration: 1.1, ease: "easeInOut" } : SPRING}
			>
				<path d="M12 4 V14" />
				<path d="M7.5 10 L12 14.5 L16.5 10" />
			</motion.g>
			<path d="M5 19 H19" />
		</svg>
	);
}

/** Audio equalizer bars. Pauses gracefully to a resting shape. */
export function Equalizer({
	playing,
	bars = 3,
	className,
	barClassName = "bg-current",
}: {
	playing: boolean;
	bars?: number;
	className?: string;
	barClassName?: string;
}) {
	return (
		<span className={cn("inline-flex h-3 items-end gap-[2px]", className)} aria-hidden>
			{Array.from({ length: bars }).map((_, i) => (
				// A CSS loop (`playback-eq` in globals.css): Motion skips mount animations
				// under `initial={false}` — the element's own or an ancestor AnimatePresence's —
				// which froze the bars into three dots on rows and in the floating player.
				<span
					key={i}
					className={cn("w-[3px] rounded-full transition-[height] duration-300 motion-reduce:animate-none", barClassName)}
					style={
						playing
							? {
									height: "35%",
									animationName: "playback-eq",
									animationDuration: `${0.9 + i * 0.17}s`,
									animationDelay: `${-i * 0.12}s`,
									animationTimingFunction: "ease-in-out",
									animationIterationCount: "infinite",
								}
							: { height: "35%" }
					}
				/>
			))}
		</span>
	);
}

/** One carrier cycle of the travelling wavelet, sampled for the `d` keyframes. */
const LOGO_FRAMES = Array.from({ length: 17 }, (_, i) => waveletPath({ phase: (i / 16) * 2 * Math.PI }));

/**
 * The wavelet mark: a gradient wavelet stroke on a dark squircle. It draws
 * itself in on mount; `animated` makes the carrier travel under its envelope.
 */
export function LogoMark({ animated = false, className }: { animated?: boolean; className?: string }) {
	const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
	const [g0, g1, g2] = LOGO_GRADIENT;
	const [b0, b1] = LOGO_BG;
	return (
		<svg viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`} aria-hidden className={cn("size-6", className)}>
			<defs>
				<linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={b0} />
					<stop offset="1" stopColor={b1} />
				</linearGradient>
				<linearGradient id={`${uid}-wave`} gradientUnits="userSpaceOnUse" x1="9" y1="0" x2="55" y2="0">
					<stop offset="0" stopColor={g0} />
					<stop offset="0.5" stopColor={g1} />
					<stop offset="1" stopColor={g2} />
				</linearGradient>
			</defs>
			<rect x="1" y="1" width="62" height="62" rx="15" fill={`url(#${uid}-bg)`} />
			<rect x="1.5" y="1.5" width="61" height="61" rx="14.5" fill="none" stroke="#fff" strokeOpacity={0.09} />
			<motion.path
				d={LOGO_FRAMES[0]}
				fill="none"
				stroke={`url(#${uid}-wave)`}
				strokeWidth={5.5}
				strokeLinecap="round"
				strokeLinejoin="round"
				initial={{ pathLength: 0, d: LOGO_FRAMES[0] }}
				animate={animated ? { pathLength: 1, d: LOGO_FRAMES } : { pathLength: 1, d: LOGO_FRAMES[0] }}
				transition={{
					pathLength: { duration: 0.7, ease: "easeOut" },
					d: animated ? { repeat: Infinity, duration: 1.6, ease: "linear" } : { duration: 0.4 },
				}}
			/>
		</svg>
	);
}

/** Search glyph whose lens scales in while the palette is loading. */
export function SearchGlyph({ busy = false, className }: { busy?: boolean; className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden className={cn("size-4", className)}>
			<motion.circle
				cx="11"
				cy="11"
				r="6.5"
				animate={busy ? { pathLength: [0.2, 1, 0.2], rotate: [0, 180, 360] } : { pathLength: 1, rotate: 0 }}
				transition={busy ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : { duration: 0.3 }}
				style={{ originX: "50%", originY: "50%" }}
			/>
			<motion.path d="M16 16 L20 20" initial={false} animate={{ opacity: busy ? 0.3 : 1 }} />
		</svg>
	);
}

/** Heart that fills with a spring pop. */
export function HeartGlyph({ filled, className }: { filled: boolean; className?: string }) {
	return (
		<svg viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-4", className)}>
			{/* currentColor can't be interpolated — keep it as the fill and fade its opacity. */}
			<motion.path
				d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"
				stroke="currentColor"
				fill="currentColor"
				initial={false}
				animate={{ fillOpacity: filled ? 1 : 0, scale: filled ? [1, 1.25, 1] : 1 }}
				transition={{ fillOpacity: { duration: 0.2 }, scale: { duration: 0.35, ease: [0.2, 0, 0, 1] } }}
			/>
		</svg>
	);
}

/**
 * Keyframes of the travelling wave: one carrier cycle in 16 steps. Linear
 * `d` interpolation between two phases far apart (0 → π) cancels the wave
 * out mid-way, so the steps stay small and the first equals the last.
 */
export function waveLineFrames(amplitude: number, steps = 16): string[] {
	return Array.from({ length: steps + 1 }, (_, i) => {
		const phase = (i / steps) * Math.PI * 2;
		const pts: string[] = [];
		for (let x = 0; x <= 200; x += 10) {
			const y = 20 + Math.sin((x / 200) * Math.PI * 4 - phase) * amplitude * Math.sin((x / 200) * Math.PI);
			pts.push(`${x === 0 ? "M" : "L"}${x} ${y.toFixed(2)}`);
		}
		return pts.join(" ");
	});
}

/** A soft looping waveform line — used for empty states and the hero. */
export function WaveLine({ className, amplitude = 8, playing = true }: { className?: string; amplitude?: number; playing?: boolean }) {
	const frames = waveLineFrames(amplitude);
	return (
		<svg viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" aria-hidden className={cn("w-full", className)}>
			<motion.path
				initial={{ pathLength: 0, d: frames[0] }}
				animate={playing ? { pathLength: 1, d: frames } : { pathLength: 1, d: frames[0] }}
				transition={{
					pathLength: { duration: 1.2, ease: "easeOut" },
					d: playing ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.6, ease: "easeOut" },
				}}
			/>
		</svg>
	);
}

/** Empty state: a vinyl that draws itself, then spins slowly. */
export function EmptyState({
	title,
	description,
	action,
	className,
}: {
	title: string;
	description?: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center", className)}>
			<motion.svg
				viewBox="0 0 64 64"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.25}
				className="size-14 text-muted-foreground"
				animate={{ rotate: 360 }}
				transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
				aria-hidden
			>
				{[28, 20, 13].map((r, i) => (
					<motion.circle
						key={r}
						cx="32"
						cy="32"
						r={r}
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{ duration: 0.9, delay: i * 0.15, ease: "easeOut" }}
					/>
				))}
				<motion.circle cx="32" cy="32" r="3" fill="currentColor" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, ...SPRING }} />
				<motion.path d="M32 4 A28 28 0 0 1 56 18" strokeWidth={2} className="text-foreground" stroke="currentColor" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
			</motion.svg>
			<div className="space-y-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				{description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
			</div>
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}

/** Swaps children with a vertical slide — for counters and status labels. */
export function SlideSwap({ id, children, className }: { id: string | number; children: React.ReactNode; className?: string }) {
	return (
		<span className={cn("relative inline-flex overflow-hidden", className)}>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span
					key={id}
					initial={{ y: "100%", opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: "-100%", opacity: 0 }}
					transition={{ type: "spring", stiffness: 500, damping: 40 }}
					className="inline-block"
				>
					{children}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}

/** Shuffle arrows — the crossing strands redraw themselves when toggled. */
export function ShuffleGlyph({ active, className }: { active: boolean; className?: string }) {
	// Redraw only when switched on — not on mount, not when switched off.
	const [prev, setPrev] = useState(active);
	const [draws, setDraws] = useState(0);
	if (active !== prev) {
		setPrev(active);
		if (active) setDraws((n) => n + 1);
	}
	const from = draws === 0 ? false : { pathLength: 0 };
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-5", className)}>
			<g key={draws}>
				<motion.path d="M3 7h3.5c2.4 0 3.9 1.3 5.1 3.3l.8 1.4c1.2 2 2.7 3.3 5.1 3.3H21" initial={from} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: "easeOut" }} />
				<motion.path d="M3 17h3.5c1.6 0 2.8-.6 3.8-1.6M13.7 8.6c1-1 2.2-1.6 3.8-1.6H21" initial={from} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }} />
			</g>
			<path d="M18 4l3 3-3 3M18 14l3 3-3 3" />
		</svg>
	);
}

/** Repeat loop — spins half a turn forward on every mode change; "1" pops in for repeat-one. */
export function RepeatGlyph({ mode, className }: { mode: "off" | "all" | "one"; className?: string }) {
	const [prev, setPrev] = useState(mode);
	const [turns, setTurns] = useState(0);
	if (mode !== prev) {
		setPrev(mode);
		setTurns((t) => t + 180);
	}
	return (
		<span className={cn("relative inline-flex size-5", className)}>
			<motion.svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.75}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden
				className="size-full"
				initial={false}
				animate={{ rotate: turns }}
				transition={SPRING}
			>
				<path d="M17 2l3 3-3 3" />
				<path d="M4 11V9a4 4 0 0 1 4-4h12" />
				<path d="M7 22l-3-3 3-3" />
				<path d="M20 13v2a4 4 0 0 1-4 4H4" />
			</motion.svg>
			<AnimatePresence>
				{mode === "one" && (
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
						transition={SPRING}
						className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold leading-none"
					>
						1
					</motion.span>
				)}
			</AnimatePresence>
		</span>
	);
}

/** Skip glyph — triangle + bar; `dir` mirrors it for previous. */
export function SkipGlyph({ dir, className }: { dir: "prev" | "next"; className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cn("size-6", dir === "prev" && "-scale-x-100", className)}>
			<path d="M3.5 6.2v11.6a1 1 0 0 0 1.52.85l8.9-5.8a1 1 0 0 0 0-1.7l-8.9-5.8A1 1 0 0 0 3.5 6.2Z" />
			<rect x="16.5" y="5" width="2.6" height="14" rx="1.3" />
		</svg>
	);
}

/** Speaker whose sound waves draw in and out with the volume level. */
export function VolumeGlyph({ volume, className }: { volume: number; className?: string }) {
	const muted = volume === 0;
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-[18px]", className)}>
			<path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" fillOpacity={0.15} />
			<motion.path d="M15.5 8.5a5 5 0 0 1 0 7" initial={false} animate={{ pathLength: muted ? 0 : 1, opacity: muted ? 0 : 1 }} transition={SPRING} />
			<motion.path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" initial={false} animate={{ pathLength: volume > 50 ? 1 : 0, opacity: volume > 50 ? 1 : 0 }} transition={SPRING} />
			<motion.path d="M16.5 9.5l5 5M21.5 9.5l-5 5" initial={false} animate={{ pathLength: muted ? 1 : 0, opacity: muted ? 1 : 0 }} transition={SPRING} />
		</svg>
	);
}
