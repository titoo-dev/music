"use client";

import { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore, type LyricLine } from "@/stores/useLyricsStore";
import { CoverImage } from "@/components/ui/cover-image";
import { ArtistLink } from "@/components/links/EntityLink";
import { leavePlayer } from "./leave-player";
import { X } from "lucide-react";
import { Spinner } from "@/components/motion/icons";
import { centerLine } from "@/lib/lyrics/scroll";
import { formatTime } from "@/utils/format-time";
import { coverThemeStyle, useCoverSeed } from "@/components/expressive";
import { WaveSeek } from "./WaveSeek";

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
					centerLine(container, el);
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
			className="mx-auto h-full max-w-5xl overflow-y-auto overscroll-contain px-[8vw] py-[35vh] scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] lg:px-12"
		>
			{lines.map((line, i) => (
				<p
					key={i}
					data-state="future"
					data-distance="5"
					onClick={() => handleClick(line)}
					className={`origin-left cursor-pointer py-3 text-balance font-semibold leading-[1.12] tracking-[-0.035em] text-foreground transition-[opacity,scale,filter] duration-500 ease-[cubic-bezier(0.2,0,0,1)]
						scale-[0.92] text-[clamp(2rem,5vw,3.5rem)] opacity-55 hover:opacity-80
						data-[state=past]:opacity-35
						data-[state=active]:scale-100 data-[state=active]:opacity-100
						data-[distance='3']:blur-[1px] data-[distance='4']:blur-[2px] data-[distance='5']:blur-[3px] data-[state=active]:!blur-0
						${line.text === "" ? "h-6 py-0" : ""}
					`}
				>
					{line.text || " "}
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
	const buffered = usePlayerStore((s) => s.buffered);
	const audible = usePlayerStore((s) => s.isPlaying && !s.isBuffering);
	const seed = useCoverSeed(currentTrack?.cover);

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
					className="cover-theme fixed inset-0 z-[71] isolate overflow-clip bg-background text-foreground"
					style={coverThemeStyle(seed)}
				>
					{/* Atmospheric backdrop: the artwork, hugely blurred, settling into the surface */}
					{currentTrack.cover && (
						<>
							<div className="absolute -inset-[10%] opacity-60" aria-hidden>
								<CoverImage src={currentTrack.cover} size={40} loading="eager" className="h-full w-full scale-110 rounded-none blur-[110px] saturate-[1.6]" />
							</div>
							<div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/60 to-background/92" aria-hidden />
						</>
					)}

					{/* Top bar */}
					<div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-4 px-5 py-4 sm:px-8 sm:py-5">
						<CoverImage
							src={currentTrack.cover}
							className="size-12 shrink-0 rounded-[14px] shadow-[0_8px_20px_-6px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
						/>
						<div className="min-w-0 flex-1">
							<p className="type-eyebrow text-primary">Lyrics</p>
							<p className="truncate text-base font-semibold tracking-[-0.01em]">{currentTrack.title}</p>
							<p className="truncate text-sm font-semibold text-muted-foreground">
								<ArtistLink id={currentTrack.artistId} name={currentTrack.artist} onClick={leavePlayer} className="transition-colors hover:text-foreground" />
							</p>
						</div>
						<div className="hidden h-9 items-center rounded-full bg-surface-highest/45 px-3.5 text-xs font-semibold tabular-nums text-foreground/80 backdrop-blur-md sm:flex">
							{formatTime(currentTime)} / {formatTime(totalDuration)}
						</div>
						<button
							onClick={() => setOpen(false)}
							aria-label="Close lyrics"
							className="flex size-11 items-center justify-center rounded-full bg-surface-highest/45 text-foreground backdrop-blur-md transition-[background-color,scale] hover:bg-surface-highest/70 active:scale-90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
						>
							<X className="size-5" />
						</button>
					</div>

					{/* Lyrics column */}
					<div className="absolute inset-x-0 bottom-[104px] top-[88px] overflow-clip">
						{isLoading ? (
							<div className="flex h-full items-center justify-center">
								<span className="flex size-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
									<Spinner size={22} />
								</span>
							</div>
						) : error ? (
							<div className="flex h-full items-center justify-center px-8">
								<p className="text-center text-xl font-semibold text-foreground/80">{error}</p>
							</div>
						) : syncedLines.length > 0 ? (
							<ImmersiveLines lines={syncedLines} />
						) : plainLyrics ? (
							<div className="mx-auto h-full max-w-5xl overflow-y-auto overscroll-contain px-[8vw] py-[20vh] scrollbar-hide lg:px-12">
								<pre className="whitespace-pre-wrap text-balance font-sans text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold leading-relaxed text-foreground/85">
									{plainLyrics}
								</pre>
							</div>
						) : (
							<div className="flex h-full items-center justify-center px-8">
								<p className="text-xl font-semibold text-muted-foreground">No lyrics</p>
							</div>
						)}
					</div>

					{/* Bottom progress — the same living wave as Now Playing */}
					<div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent px-5 pb-5 pt-6 sm:px-8">
						<div className="mx-auto max-w-4xl">
							<div className="mb-2 flex items-center gap-4">
								{source && <span className="text-xs text-muted-foreground">Source · {source}</span>}
								<span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
									<kbd className="kbd">Esc</kbd> to exit
								</span>
							</div>
							<WaveSeek
								currentTime={currentTime}
								duration={totalDuration}
								buffered={buffered}
								playing={audible}
								onSeek={(t) => usePlayerStore.getState().seek(t)}
								height={28}
								stroke={4}
								amplitude={3}
								tone="primary"
								trackClassName="text-foreground/15"
							/>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
