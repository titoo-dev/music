"use client";

import { useState, useRef, useCallback } from "react";

function formatTime(seconds: number) {
	if (!seconds || !isFinite(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

interface SeekBarProps {
	currentTime: number;
	duration: number;
	onSeek: (time: number) => void;
	variant?: "thin" | "large";
}

export function SeekBar({
	currentTime,
	duration,
	onSeek,
	variant = "thin",
}: SeekBarProps) {
	const barRef = useRef<HTMLDivElement>(null);
	const [dragProgress, setDragProgress] = useState<number | null>(null);
	const isDragging = useRef(false);
	const lastClientXRef = useRef(0);

	const computeProgress = useCallback(
		(clientX: number) => {
			if (!barRef.current) return 0;
			const rect = barRef.current.getBoundingClientRect();
			return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		},
		[]
	);

	// Touch handlers
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			isDragging.current = true;
			lastClientXRef.current = e.touches[0].clientX;
			const pct = computeProgress(e.touches[0].clientX);
			setDragProgress(pct);
		},
		[computeProgress]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!isDragging.current) return;
			lastClientXRef.current = e.touches[0].clientX;
			const pct = computeProgress(e.touches[0].clientX);
			setDragProgress(pct);
		},
		[computeProgress]
	);

	const handleTouchEnd = useCallback(() => {
		if (!isDragging.current) return;
		isDragging.current = false;
		const pct = computeProgress(lastClientXRef.current);
		setDragProgress(null);
		if (duration > 0) {
			onSeek(pct * duration);
		}
	}, [computeProgress, duration, onSeek]);

	// Mouse handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			isDragging.current = true;
			const pct = computeProgress(e.clientX);
			setDragProgress(pct);

			const handleMouseMove = (ev: MouseEvent) => {
				lastClientXRef.current = ev.clientX;
				const p = computeProgress(ev.clientX);
				setDragProgress(p);
			};

			const handleMouseUp = () => {
				isDragging.current = false;
				const pct = computeProgress(lastClientXRef.current);
				setDragProgress(null);
				if (duration > 0) {
					onSeek(pct * duration);
				}
				window.removeEventListener("mousemove", handleMouseMove);
				window.removeEventListener("mouseup", handleMouseUp);
			};

			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		},
		[computeProgress, duration, onSeek]
	);

	const baseProgress = duration > 0 ? currentTime / duration : 0;
	const displayProgress = dragProgress ?? baseProgress;
	const isThin = variant === "thin";

	return (
		<div
			ref={barRef}
			className={`relative flex items-center w-full cursor-pointer select-none ${
				isThin ? "h-8" : "h-10"
			}`}
			style={{ touchAction: "none" }}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onMouseDown={handleMouseDown}
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
			<div
				className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-foreground border-2 border-foreground transition-opacity ${
					isThin
						? "h-3.5 w-3.5 opacity-0 group-hover/seekbar:opacity-100"
						: "h-5 w-5 shadow-[var(--shadow-brutal-sm)]"
				} ${dragProgress !== null ? "!opacity-100 scale-110 !bg-primary" : ""}`}
				style={{ left: `${displayProgress * 100}%` }}
			/>
		</div>
	);
}
