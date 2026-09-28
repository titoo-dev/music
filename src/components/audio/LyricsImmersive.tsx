"use client";

import { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore, type LyricLine } from "@/stores/useLyricsStore";
import { CoverImage } from "@/components/ui/cover-image";
import { X } from "lucide-react";
import { Spinner } from "@/components/motion/icons";
import { formatTime } from "@/utils/format-time";

function getActiveIndex(lines: LyricLine[], time: number): number {
	let idx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].time <= time) idx = i;
		else break;
	}
	return idx;
}

const ImmersiveLines = memo(function ImmersiveLines({ lines }: { lines: LyricLine[] }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const activeIndexRef = useRef(-1);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		activeIndexRef.current = -1;
		for (const el of container.children) {
			(el as HTMLElement).dataset.distance = "5";
			(el as HTMLElement).dataset.state = "future";
		}

		const unsubscribe = usePlayerStore.subscribe((state) => {
			const idx = getActiveIndex(lines, state.currentTime);
			if (idx === activeIndexRef.current) return;
			activeIndexRef.current = idx;

			for (let i = 0; i < container.children.length; i++) {
				const el = container.children[i] as HTMLElement;
				const dist = Math.abs(i - idx);
				const state = i === idx ? "active" : i < idx ? "past" : "future";
				el.dataset.state = state;
				el.dataset.distance = String(Math.min(dist, 5));
				if (i === idx) {
					el.scrollIntoView({ behavior: "smooth", block: "center" });
				}
			}
		});
		return unsubscribe;
	}, [lines]);

	const handleClick = (line: LyricLine) => {
		usePlayerStore.getState().seek(line.time);
	};

	return (
		<div
			ref={containerRef}
			className="h-full overflow-y-auto overscroll-contain scrollbar-hide px-[8vw] py-[35vh] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
		>
			{lines.map((line, i) => (
				<p
					key={i}
					data-state="future"
					data-distance="5"
					onClick={() => handleClick(line)}
					className={`cursor-pointer leading-[1.18] tracking-[-0.03em] py-3 text-balance text-foreground transition-all duration-[380ms] ease-out
						font-semibold text-[clamp(2rem,4.5vw,2.4rem)] opacity-35 hover:opacity-60
						data-[state=past]:opacity-[0.18]
						data-[state=active]:opacity-100 data-[state=active]:text-[clamp(2.6rem,6vw,3.5rem)]
						data-[distance='3']:blur-[1px] data-[distance='4']:blur-[2px] data-[distance='5']:blur-[4px] data-[state=active]:!blur-0
						${line.text === "" ? "h-6 py-0" : ""}
					`}
				>
					{line.text || " "}
				</p>
			))}
		</div>
	);
});

export function LyricsImmersive() {
	const open = useLyricsStore((s) => s.immersiveOpen);
	const setOpen = useLyricsStore((s) => s.setImmersiveOpen);
	const fetchLyrics = useLyricsStore((s) => s.fetchLyrics);
	const isLoading = useLyricsStore((s) => s.isLoading);
	const error = useLyricsStore((s) => s.error);
	const syncedLines = useLyricsStore((s) => s.syncedLines);
	const plainLyrics = useLyricsStore((s) => s.plainLyrics);
	const source = useLyricsStore((s) => s.source);
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const duration = usePlayerStore((s) => s.duration);

	const [currentTime, setCurrentTime] = useState(usePlayerStore.getState().currentTime);
	useEffect(() => {
		if (!open) return;
		const unsub = usePlayerStore.subscribe((state) => setCurrentTime(state.currentTime));
		return unsub;
	}, [open]);

	useEffect(() => {
		if (open && currentTrack) {
			fetchLyrics(currentTrack.trackId, currentTrack.duration);
		}
	}, [open, currentTrack, fetchLyrics]);

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, setOpen]);

	const totalDuration = duration || currentTrack?.duration || 0;
	const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (totalDuration <= 0) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		usePlayerStore.getState().seek(pct * totalDuration);
	};

	return (
		<AnimatePresence>
			{open && currentTrack && (
				<motion.div
					key="lyrics-immersive"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.25 }}
					role="dialog"
					aria-label="Lyrics fullscreen"
					className="fixed inset-0 z-[71] isolate bg-background text-foreground overflow-hidden"
				>
					{/* Atmospheric backdrop */}
					{currentTrack.cover && (
						<>
							<div className="absolute -inset-[10%] opacity-40" aria-hidden>
								<CoverImage
									src={currentTrack.cover}
									className="w-full h-full rounded-none blur-[120px] saturate-150 scale-110"
								/>
							</div>
							<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_85%)]" aria-hidden />
						</>
					)}

					{/* Top bar */}
					<div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-4 px-5 sm:px-8 py-4 sm:py-5">
						<CoverImage
							src={currentTrack.cover}
							className="h-11 w-11 shrink-0 rounded-md shadow-float"
						/>
						<div className="flex-1 min-w-0">
							<p className="truncate text-sm font-semibold tracking-tight">
								{currentTrack.title}
							</p>
							<p className="mt-0.5 truncate text-xs text-muted-foreground">
								{currentTrack.artist}
							</p>
						</div>
						<div className="hidden sm:block rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-xs tabular-nums text-muted-foreground">
							{formatTime(currentTime)} / {formatTime(totalDuration)}
						</div>
						<button
							onClick={() => setOpen(false)}
							aria-label="Close lyrics"
							className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* Lyrics column */}
					<div className="absolute inset-x-0 top-[88px] bottom-[88px] overflow-hidden">
						{isLoading ? (
							<div className="flex h-full items-center justify-center">
								<Spinner size={24} className="text-muted-foreground" />
							</div>
						) : error ? (
							<div className="flex h-full items-center justify-center px-8">
								<p className="text-sm text-muted-foreground text-center">
									{error}
								</p>
							</div>
						) : syncedLines.length > 0 ? (
							<ImmersiveLines lines={syncedLines} />
						) : plainLyrics ? (
							<div className="h-full overflow-y-auto overscroll-contain scrollbar-hide px-[8vw] py-[20vh]">
								<pre className="whitespace-pre-wrap font-sans text-[clamp(1.25rem,2.5vw,1.6rem)] font-medium leading-relaxed text-foreground/80 text-balance">
									{plainLyrics}
								</pre>
							</div>
						) : (
							<div className="flex h-full items-center justify-center px-8">
								<p className="text-sm text-muted-foreground">
									No lyrics
								</p>
							</div>
						)}
					</div>

					{/* Bottom progress */}
					<div className="absolute bottom-0 left-0 right-0 z-10 px-5 sm:px-8 pt-6 pb-5 bg-gradient-to-t from-background via-background/80 to-transparent">
						<div className="flex items-center gap-4 mb-3">
							{source && (
								<span className="text-xs text-muted-foreground">
									Source · {source}
								</span>
							)}
							<span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
								<kbd className="kbd">Esc</kbd> to exit
							</span>
						</div>
						<div
							className="group relative h-1 cursor-pointer rounded-full bg-border transition-[height] hover:h-1.5 before:absolute before:inset-x-0 before:-inset-y-2 before:content-['']"
							onClick={handleSeek}
						>
							<div
								className="absolute top-0 left-0 h-full rounded-full bg-foreground transition-[width] duration-100"
								style={{ width: `${progress}%` }}
							/>
							<div
								className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full bg-foreground shadow-[0_0_0_3px_var(--background)] opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-[opacity,transform]"
								style={{ left: `${progress}%` }}
							/>
						</div>
						<div className="flex justify-between mt-2 font-mono text-[11px] tabular-nums text-muted-foreground">
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(totalDuration)}</span>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
