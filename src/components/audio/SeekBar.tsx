"use client";

import { useState, useRef, useCallback } from "react";
import { formatTime } from "@/utils/format-time";

interface SeekBarProps {
	currentTime: number;
	duration: number;
	onSeek: (time: number) => void;
	/** Buffered end position in seconds (from audio.buffered). */
	buffered?: number;
	variant?: "thin" | "large";
}

export function SeekBar({
	currentTime,
	duration,
	onSeek,
	buffered = 0,
	variant = "thin",
}: SeekBarProps) {
	const barRef = useRef<HTMLDivElement>(null);
	const [dragProgress, setDragProgress] = useState<number | null>(null);
	const isDragging = useRef(false);
	// Use refs for duration/onSeek so mouse event closures always read latest values
	const durationRef = useRef(duration);
	durationRef.current = duration;
	const onSeekRef = useRef(onSeek);
	onSeekRef.current = onSeek;

	const disabled = duration <= 0;

	const computeProgress = useCallback(
		(clientX: number) => {
			if (!barRef.current) return 0;
			const rect = barRef.current.getBoundingClientRect();
			return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		},
		[]
	);

	const commitSeek = useCallback(
		(pct: number) => {
			const d = durationRef.current;
			if (d > 0) {
				// Update store first so the new currentTime is in place when we
				// release the drag overlay — prevents a one-frame visual snap-back.
				onSeekRef.current(pct * d);
			}
			setDragProgress(null);
		},
		[],
	);

	// Touch handlers
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (disabled) return;
			isDragging.current = true;
			const pct = computeProgress(e.touches[0].clientX);
			setDragProgress(pct);
		},
		[computeProgress, disabled]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!isDragging.current) return;
			const pct = computeProgress(e.touches[0].clientX);
			setDragProgress(pct);
		},
		[computeProgress]
	);

	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (!isDragging.current) return;
			isDragging.current = false;
			const lastTouch = e.changedTouches[0];
			const pct = computeProgress(lastTouch.clientX);
			commitSeek(pct);
		},
		[computeProgress, commitSeek],
	);

	// Mouse handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (disabled) return;
			isDragging.current = true;
			const pct = computeProgress(e.clientX);
			setDragProgress(pct);
			let lastPct = pct;

			const handleMouseMove = (ev: MouseEvent) => {
				lastPct = computeProgress(ev.clientX);
				setDragProgress(lastPct);
			};

			const handleMouseUp = () => {
				isDragging.current = false;
				commitSeek(lastPct);
				window.removeEventListener("mousemove", handleMouseMove);
				window.removeEventListener("mouseup", handleMouseUp);
			};

			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		},
		[computeProgress, commitSeek, disabled]
	);

	const baseProgress = duration > 0 ? currentTime / duration : 0;
	const displayProgress = dragProgress ?? baseProgress;
	const bufferProgress = duration > 0 ? Math.min(1, buffered / duration) : 0;
	const isThin = variant === "thin";

	const ariaValueText = duration > 0
		? `${formatTime(dragProgress !== null ? dragProgress * duration : currentTime)} of ${formatTime(duration)}`
		: "0:00";

	return (
		<div
			ref={barRef}
			role="slider"
			aria-label="Track progress"
			aria-orientation="horizontal"
			aria-valuenow={Math.round(dragProgress !== null ? dragProgress * duration : currentTime)}
			aria-valuemin={0}
			aria-valuemax={Math.round(duration)}
			aria-valuetext={ariaValueText}
			aria-disabled={disabled}
			tabIndex={disabled ? -1 : 0}
			className={`relative flex items-center w-full select-none ${
				isThin ? "h-8" : "h-10"
			} ${disabled ? "cursor-default opacity-50 pointer-events-none" : "cursor-pointer"}`}
			style={{ touchAction: "none" }}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onMouseDown={handleMouseDown}
			onKeyDown={(e) => {
				if (disabled) return;
				if (e.key === "ArrowRight") {
					e.stopPropagation();
					onSeekRef.current(Math.min(duration, currentTime + 5));
				} else if (e.key === "ArrowLeft") {
					e.stopPropagation();
					onSeekRef.current(Math.max(0, currentTime - 5));
				}
			}}
		>
			{/* Time tooltip during drag */}
			{dragProgress !== null && (
				<div
					className="absolute -top-9 z-10 border-2 border-foreground bg-foreground px-2 py-0.5 text-xs font-black uppercase tabular-nums text-background shadow-[var(--shadow-brutal-sm)] -translate-x-1/2 pointer-events-none"
					style={{ left: `${displayProgress * 100}%` }}
				>
					{formatTime(displayProgress * duration)}
				</div>
			)}

			{/* Visual track */}
			<div
				className={`relative w-full bg-muted ${
					isThin
						? "h-1 group-hover/seekbar:h-[6px]"
						: "h-2.5 border-2 border-foreground"
				} transition-all`}
			>
				{/* Buffered (behind progress) */}
				{bufferProgress > baseProgress && (
					<div
						className="absolute inset-y-0 left-0 bg-foreground/25"
						style={{ width: `${bufferProgress * 100}%` }}
					/>
				)}
				{/* Progress */}
				<div
					className={`absolute inset-y-0 left-0 bg-foreground transition-[width] ${
						!isThin && dragProgress !== null ? "bg-primary" : ""
					}`}
					style={{
						width: `${displayProgress * 100}%`,
						transitionDuration: dragProgress !== null ? "0ms" : "100ms",
					}}
				/>
			</div>

			{/* Thumb */}
			{!disabled && (
				<div
					className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-foreground border-2 border-foreground transition-opacity ${
						isThin
							? "h-3.5 w-3.5 opacity-0 group-hover/seekbar:opacity-100"
							: "h-5 w-5 shadow-[var(--shadow-brutal-sm)]"
					} ${dragProgress !== null ? "!opacity-100 scale-110 !bg-primary" : ""}`}
					style={{ left: `${displayProgress * 100}%` }}
				/>
			)}
		</div>
	);
}
