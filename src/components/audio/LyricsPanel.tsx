"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { CoverImage } from "@/components/ui/cover-image";
import { LyricsDisplay } from "./LyricsDisplay";
import { formatTime } from "@/utils/format-time";

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

	if (!currentTrack) return null;

	const isSynced = syncedLines.length > 0;

	return (
		<AnimatePresence>
			{visible && (
				<motion.aside
					key="lyrics-panel"
					initial={isDesktop ? { x: 440, opacity: 0 } : { y: "100%", opacity: 0 }}
					animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
					exit={isDesktop ? { x: 440, opacity: 0 } : { y: "100%", opacity: 0 }}
					transition={{ type: "spring", damping: 28, stiffness: 280 }}
					role="region"
					aria-label="Lyrics"
					className="fixed z-40 flex flex-col bg-card border-foreground shadow-[-8px_0_0_rgba(13,13,13,0.06)]
						inset-x-0 bottom-[96px] top-[calc(env(safe-area-inset-top,0px)+4px)] border-l-0 border-t-[3px]
						md:inset-auto md:top-0 md:right-0 md:bottom-[96px] md:w-[420px] md:border-l-[3px] md:border-t-0"
				>
					{/* Header */}
					<div className="flex items-center gap-3 px-[18px] py-3.5 border-b-[3px] border-foreground bg-background">
						<CoverImage
							src={currentTrack.cover}
							className="h-11 w-11 shrink-0 border-2 border-foreground"
						/>
						<div className="flex-1 min-w-0">
							<p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">
								NOW PLAYING · LYRICS
							</p>
							<p className="text-[14px] font-extrabold tracking-[-0.01em] truncate leading-tight mt-0.5">
								{currentTrack.title}
							</p>
							<p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
								{currentTrack.artist}
							</p>
						</div>
						<button
							onClick={() => setVisible(false)}
							aria-label="Close lyrics"
							className="w-8 h-8 border-2 border-foreground bg-card hover:bg-accent flex items-center justify-center font-mono text-base font-extrabold leading-none shrink-0 transition-colors"
						>
							×
						</button>
					</div>

					{/* Progress strip */}
					<div className="flex justify-between items-center px-[18px] py-2 border-b-2 border-foreground bg-card font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
						<span>{isSynced ? "SYNCED · LRC" : "PLAIN TEXT"}</span>
						<span>
							{formatTime(currentTime)} / {formatTime(duration || currentTrack.duration || 0)}
						</span>
					</div>

					{/* Lyrics body */}
					<div className="flex-1 flex flex-col min-h-0 bg-card">
						<LyricsDisplay compact />
					</div>

					{/* Footer */}
					<div className="px-[18px] py-2.5 border-t-2 border-foreground bg-foreground text-background flex justify-between items-center font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
						<span>{source ? `SOURCE · ${source.toUpperCase()}` : "NO SOURCE"}</span>
						<button
							onClick={() => useLyricsStore.getState().setImmersiveOpen(true)}
							className="opacity-70 hover:opacity-100 hover:text-accent transition-colors"
						>
							↗ THEATRE MODE
						</button>
					</div>
				</motion.aside>
			)}
		</AnimatePresence>
	);
}
