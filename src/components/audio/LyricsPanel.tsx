"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { CoverImage } from "@/components/ui/cover-image";
import { LyricsDisplay } from "./LyricsDisplay";
import { formatTime } from "@/utils/format-time";
import { ArrowUpRight, X } from "lucide-react";
import { CoverTheme } from "@/components/expressive";
import { floatingPanel } from "./QueuePanel";
import { cn } from "@/lib/utils";

export function LyricsPanel() {
	const visible = useLyricsStore((s) => s.visible);
	const setVisible = useLyricsStore((s) => s.setVisible);
	const fetchLyrics = useLyricsStore((s) => s.fetchLyrics);
	const source = useLyricsStore((s) => s.source);
	const syncedLines = useLyricsStore((s) => s.syncedLines);
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const duration = usePlayerStore((s) => s.duration);
	// Now Playing shows the lyrics on its own stage — the floating panel stays out of the way.
	const fullscreenOpen = usePlayerStore((s) => s.fullscreenOpen);

	const [currentTime, setCurrentTime] = useState(usePlayerStore.getState().currentTime);
	useEffect(() => {
		const unsub = usePlayerStore.subscribe((state) => setCurrentTime(state.currentTime));
		return unsub;
	}, []);

	useEffect(() => {
		if (visible && currentTrack) {
			fetchLyrics(currentTrack.trackId, currentTrack.duration);
		}
	}, [visible, currentTrack, fetchLyrics]);

	const [isDesktop, setIsDesktop] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		setIsDesktop(mq.matches);
		const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Mobile drag-to-dismiss — mirrors QueuePanel / FullscreenPlayer.
	const dragControls = useDragControls();
	const handleDragEnd = (
		_: unknown,
		info: { offset: { y: number }; velocity: { y: number } }
	) => {
		if (info.offset.y > 120 || info.velocity.y > 500) {
			setVisible(false);
		}
	};

	if (!currentTrack) return null;

	const isSynced = syncedLines.length > 0;

	return (
		<AnimatePresence>
			{visible && !fullscreenOpen && (
				<motion.aside
					key="lyrics-panel"
					initial={isDesktop ? { x: 24, opacity: 0, scale: 0.98 } : { y: "100%", opacity: 0 }}
					animate={isDesktop ? { x: 0, opacity: 1, scale: 1 } : { y: 0, opacity: 1 }}
					exit={isDesktop ? { x: 24, opacity: 0, scale: 0.98 } : { y: "100%", opacity: 0 }}
					transition={{ type: "spring", damping: 32, stiffness: 360 }}
					style={{ transformOrigin: "right center" }}
					drag={isDesktop ? false : "y"}
					dragControls={dragControls}
					dragListener={false}
					dragConstraints={{ top: 0, bottom: 0 }}
					dragElastic={{ top: 0, bottom: 0.4 }}
					onDragEnd={handleDragEnd}
					role="region"
					aria-label="Lyrics"
					className={cn(floatingPanel, "bottom-[calc(var(--player-h)+var(--player-offset)+8px)]")}
				>
					<CoverTheme src={currentTrack.cover} className="flex min-h-0 flex-1 flex-col">
					{/* Drag handle (mobile only) */}
					{!isDesktop && (
						<div
							onPointerDown={(e) => dragControls.start(e)}
							role="button"
							aria-label="Drag down to close lyrics"
							className="flex shrink-0 cursor-grab touch-none items-center justify-center pb-1 pt-2.5 active:cursor-grabbing"
						>
							<div className="h-1 w-9 rounded-full bg-foreground/20" />
						</div>
					)}

					{/* Header */}
					<div className="px-3 pt-3 md:pt-3">
						<div className="flex items-center gap-3 rounded-[24px] bg-[linear-gradient(135deg,var(--m3-primary-container),var(--m3-tertiary-container))] p-2.5 pr-2 text-on-primary-container">
							<CoverImage src={currentTrack.cover} className="size-12 shrink-0 rounded-[14px] shadow-[0_4px_12px_-2px_rgb(0_0_0/0.3)]" />
							<div className="min-w-0 flex-1">
								<p className="type-eyebrow text-primary">Lyrics</p>
								<p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em]">{currentTrack.title}</p>
								<p className="truncate text-xs text-on-primary-container/75">{currentTrack.artist}</p>
							</div>
							<button
								type="button"
								onClick={() => setVisible(false)}
								aria-label="Close lyrics"
								className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-on-primary-container/10 transition-colors hover:bg-on-primary-container/20 active:scale-90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
							>
								<X className="size-[18px]" />
							</button>
						</div>
					</div>

					{/* Progress strip */}
					<div className="flex items-center justify-between px-5 pb-1 pt-3 text-xs text-muted-foreground">
						<span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface-high px-2.5 font-semibold">
							<span className={cn("size-1.5 rounded-full", isSynced ? "bg-primary" : "bg-muted-foreground/40")} aria-hidden />
							{isSynced ? "Synced" : "Plain text"}
						</span>
						<span className="font-semibold tabular-nums">
							{formatTime(currentTime)} / {formatTime(duration || currentTrack.duration || 0)}
						</span>
					</div>

					{/* Lyrics body */}
					<div className="flex-1 flex flex-col min-h-0">
						<LyricsDisplay compact />
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between gap-2 px-5 pb-4 pt-2 text-xs text-muted-foreground">
						<span className="truncate">{source ? `Source · ${source}` : "No source"}</span>
						<button
							onClick={() => useLyricsStore.getState().setImmersiveOpen(true)}
							className="-mr-2 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-[13px] font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
						>
							<ArrowUpRight className="size-4" />
							Theatre mode
						</button>
					</div>
					</CoverTheme>
				</motion.aside>
			)}
		</AnimatePresence>
	);
}
