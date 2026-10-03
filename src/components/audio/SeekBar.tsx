"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/format-time";

interface SeekBarProps {
	currentTime: number;
	duration: number;
	/** Buffered end position in seconds (from audio.buffered). */
	buffered: number;
	/** Track is loading / buffering — a sheen sweeps across the track. */
	loading?: boolean;
	onSeek: (time: number) => void;
	/** Elapsed / total labels on each side of the bar. */
	showTimes?: boolean;
	className?: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Horizontal seek bar. Dragging only previews the position; the seek is sent
 * once, on release — every seek on the live stream costs a reload, so
 * scrubbing must not fire one per pointermove.
 */
export function SeekBar({ currentTime, duration, buffered, loading = false, onSeek, showTimes = false, className }: SeekBarProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<number | null>(null);
	const [drag, setDrag] = useState<number | null>(null);

	const disabled = duration <= 0;
	const pct = disabled ? 0 : clamp01(currentTime / duration);
	const bufPct = disabled ? 0 : clamp01(buffered / duration);
	const shown = drag ?? pct;
	const active = drag !== null || hover !== null;

	const ratioAt = (clientX: number) => {
		const rect = trackRef.current?.getBoundingClientRect();
		if (!rect || rect.width <= 0) return 0;
		return clamp01((clientX - rect.left) / rect.width);
	};

	const step = (e: React.KeyboardEvent) => {
		if (disabled) return;
		const by = e.shiftKey ? 15 : 5;
		const to =
			e.key === "ArrowRight" || e.key === "ArrowUp"
				? Math.min(duration, currentTime + by)
				: e.key === "ArrowLeft" || e.key === "ArrowDown"
					? Math.max(0, currentTime - by)
					: e.key === "Home"
						? 0
						: e.key === "End"
							? duration
							: null;
		if (to === null) return;
		e.preventDefault();
		e.stopPropagation();
		onSeek(to);
	};

	const labelTime = drag !== null ? drag * duration : currentTime;

	return (
		<div className={cn("flex w-full items-center gap-2.5", className)}>
			{showTimes && (
				<span className={cn("w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground transition-colors", drag !== null && "font-semibold text-primary")} data-testid="seek-elapsed">
					{formatTime(labelTime)}
				</span>
			)}

			<div
				role="slider"
				tabIndex={disabled ? -1 : 0}
				aria-label="Seek"
				aria-orientation="horizontal"
				aria-valuemin={0}
				aria-valuemax={Math.round(duration)}
				aria-valuenow={Math.round(labelTime)}
				aria-valuetext={`${formatTime(labelTime)} of ${formatTime(duration)}`}
				aria-disabled={disabled || undefined}
				aria-busy={loading || undefined}
				data-active={active || undefined}
				className={cn(
					"group/seek relative flex h-4 min-w-0 flex-1 touch-none select-none items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
					disabled ? "pointer-events-none opacity-40" : "cursor-pointer"
				)}
				onKeyDown={step}
				onPointerDown={(e) => {
					if (disabled || e.button > 0) return;
					e.currentTarget.setPointerCapture?.(e.pointerId);
					setDrag(ratioAt(e.clientX));
				}}
				onPointerMove={(e) => {
					const r = ratioAt(e.clientX);
					if (drag !== null) setDrag(r);
					else if (e.pointerType === "mouse") setHover(r);
				}}
				onPointerUp={(e) => {
					if (drag === null) return;
					const r = ratioAt(e.clientX);
					setDrag(null);
					onSeek(r * duration);
				}}
				onPointerCancel={() => setDrag(null)}
				onPointerLeave={() => setHover(null)}
			>
				{/* Track */}
				<div
					ref={trackRef}
					className="relative h-1 w-full overflow-hidden rounded-full bg-primary/15 transition-[height] duration-150 ease-out group-hover/seek:h-1.5 group-data-[active]/seek:h-1.5"
				>
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary/20 transition-[width] duration-300"
						style={{ width: `${bufPct * 100}%` }}
						data-testid="seek-buffered"
					/>
					{hover !== null && drag === null && hover > pct && (
						<div
							className="absolute inset-y-0 left-0 rounded-full bg-primary/30"
							style={{ width: `${hover * 100}%` }}
							data-testid="seek-hover"
						/>
					)}
					<div
						className={cn(
							"absolute inset-y-0 left-0 rounded-full bg-primary",
							drag === null && "transition-[width] duration-200 ease-linear",
							loading && "opacity-50"
						)}
						style={{ width: `${shown * 100}%` }}
						data-testid="seek-progress"
					/>
					<AnimatePresence>
						{loading && (
							<motion.div
								key="sheen"
								data-testid="seek-loading"
								className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
								initial={{ left: "-35%", opacity: 0 }}
								animate={{ left: ["-35%", "100%"], opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ left: { repeat: Infinity, duration: 1.1, ease: "easeInOut" }, opacity: { duration: 0.2 } }}
							/>
						)}
					</AnimatePresence>
				</div>

				{/* Thumb */}
				{!disabled && (
					<span
						aria-hidden
						className={cn(
							"pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_2px_8px_color-mix(in_oklch,var(--primary)_55%,transparent)] transition-[scale,opacity] duration-150",
							active ? "scale-100 opacity-100" : "scale-50 opacity-0 group-focus-visible/seek:scale-100 group-focus-visible/seek:opacity-100"
						)}
						style={{ left: `${shown * 100}%` }}
					/>
				)}

				{/* Time bubble */}
				<AnimatePresence>
					{active && !disabled && (
						<motion.span
							key="bubble"
							initial={{ opacity: 0, y: 4, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 4, scale: 0.95 }}
							transition={{ duration: 0.12 }}
							className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary-foreground shadow-float"
							style={{ left: `${(drag ?? hover ?? 0) * 100}%` }}
							data-testid="seek-bubble"
						>
							{formatTime((drag ?? hover ?? 0) * duration)}
						</motion.span>
					)}
				</AnimatePresence>
			</div>

			{showTimes && (
				<span className="w-9 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground" data-testid="seek-total">
					{formatTime(duration)}
				</span>
			)}
		</div>
	);
}
