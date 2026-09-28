"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { CoverImage } from "@/components/ui/cover-image";
import { LyricsDisplay } from "./LyricsDisplay";
import { formatTime } from "@/utils/format-time";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, X } from "lucide-react";

export function LyricsPanel() {
	const visible = useLyricsStore((s) => s.visible);
	const setVisible = useLyricsStore((s) => s.setVisible);
	const fetchLyrics = useLyricsStore((s) => s.fetchLyrics);
	const source = useLyricsStore((s) => s.source);
	const syncedLines = useLyricsStore((s) => s.syncedLines);
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const duration = usePlayerStore((s) => s.duration);

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
			{visible && (
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
					className="fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-popover/95 glass text-popover-foreground shadow-popover
						inset-x-2 top-[calc(env(safe-area-inset-top,0px)+8px)] bottom-[calc(var(--player-h)+var(--player-offset)+8px)]
						md:inset-x-auto md:right-4 md:top-[calc(var(--header-h)+12px)] md:bottom-[calc(var(--player-h)+var(--player-offset)+12px)] md:w-[360px] md:rounded-xl"
				>
					{/* Drag handle (mobile only) */}
					{!isDesktop && (
						<div
							onPointerDown={(e) => dragControls.start(e)}
							role="button"
							aria-label="Drag down to close lyrics"
							className="flex shrink-0 items-center justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing touch-none"
						>
							<div className="h-1 w-10 rounded-full bg-foreground/20" />
						</div>
					)}

					{/* Header */}
					<div className="flex items-center gap-3 border-b border-border px-4 py-3">
						<CoverImage
							src={currentTrack.cover}
							className="h-10 w-10 shrink-0 rounded-md"
						/>
						<div className="flex-1 min-w-0">
							<p className="truncate text-sm font-semibold leading-tight tracking-tight">
								{currentTrack.title}
							</p>
							<p className="mt-0.5 truncate text-xs text-muted-foreground">
								{currentTrack.artist}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon-touch"
							onClick={() => setVisible(false)}
							aria-label="Close lyrics"
							className="-mr-1.5 rounded-full"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Progress strip */}
					<div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-1.5">
							<span className={`size-1.5 rounded-full ${isSynced ? "bg-success" : "bg-muted-foreground/40"}`} aria-hidden />
							{isSynced ? "Synced" : "Plain text"}
						</span>
						<span className="font-mono tabular-nums">
							{formatTime(currentTime)} / {formatTime(duration || currentTrack.duration || 0)}
						</span>
					</div>

					{/* Lyrics body */}
					<div className="flex-1 flex flex-col min-h-0">
						<LyricsDisplay compact />
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
						<span className="truncate">{source ? `Source · ${source}` : "No source"}</span>
						<button
							onClick={() => useLyricsStore.getState().setImmersiveOpen(true)}
							className="-mr-2 inline-flex h-7 items-center gap-1 rounded-md px-2 font-medium transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
						>
							<ArrowUpRight className="h-3.5 w-3.5" />
							Theatre mode
						</button>
					</div>
				</motion.aside>
			)}
		</AnimatePresence>
	);
}
