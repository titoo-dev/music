"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Button } from "@/components/ui/button";
import { SeekBar } from "./SeekBar";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { AudioVisualizer } from "./AudioVisualizer";
import { LyricsDisplay } from "./LyricsDisplay";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { formatTime } from "@/utils/format-time";

const SPEED_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

function formatRate(rate: number): string {
	return rate === 1 ? "1×" : `${rate}×`;
}

function seek(time: number) {
	usePlayerStore.getState().seek(time);
}

export function Player() {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const isBuffering = usePlayerStore((s) => s.isBuffering);
	const volume = usePlayerStore((s) => s.volume);
	const currentTime = usePlayerStore((s) => s.currentTime);
	const duration = usePlayerStore((s) => s.duration);
	const shuffle = usePlayerStore((s) => s.shuffle);
	const repeat = usePlayerStore((s) => s.repeat);
	const queue = usePlayerStore((s) => s.queue);

	const toggle = usePlayerStore((s) => s.toggle);
	const stop = usePlayerStore((s) => s.stop);
	const next = usePlayerStore((s) => s.next);
	const prev = usePlayerStore((s) => s.prev);
	const setVolume = usePlayerStore((s) => s.setVolume);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
	const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
	const playbackRate = usePlayerStore((s) => s.playbackRate);
	const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
	const sleepTimerEnd = usePlayerStore((s) => s.sleepTimerEnd);
	const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);

	const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);
	const openSheet = useTrackActionStore((s) => s.openSheet);

	const lyricsVisible = useLyricsStore((s) => s.visible);
	const toggleLyrics = useLyricsStore((s) => s.toggleVisible);
	const fetchLyrics = useLyricsStore((s) => s.fetchLyrics);

	const error = usePlayerStore((s) => s.error);

	// Auto-fetch lyrics when visible and track changes
	useEffect(() => {
		if (lyricsVisible && currentTrack) {
			fetchLyrics(currentTrack.trackId, currentTrack.duration);
		}
	}, [lyricsVisible, currentTrack, fetchLyrics]);

	const hasQueue = queue.length > 1;

	const [isDesktop, setIsDesktop] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		setIsDesktop(mq.matches);
		const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);
	const sleepActive = sleepTimerEnd !== null;

	function cycleSpeed() {
		const idx = SPEED_STEPS.indexOf(playbackRate);
		const next = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
		setPlaybackRate(next);
	}

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		if (!currentTrack) return;
		openSheet({
			id: currentTrack.trackId,
			title: currentTrack.title,
			artist: currentTrack.artist,
			cover: currentTrack.cover,
			duration: currentTrack.duration,
		});
	};

	return (
		<AnimatePresence>
			{currentTrack && (
				<motion.div
					key="player"
					role="region"
					aria-label="Player controls"
					initial={{ y: 80, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 80, opacity: 0 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl md:left-56 pb-[env(safe-area-inset-bottom)]"
				>
					{/* Lyrics panel */}
					<AnimatePresence>
						{lyricsVisible && (
							<motion.div
								key="lyrics-panel"
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: isDesktop ? "calc(100vh - 90px)" : 380, opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ type: "spring", damping: 25, stiffness: 300 }}
								className="overflow-hidden border-b border-border/40"
							>
								<div className="h-full flex flex-col">
									<LyricsDisplay />
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Error banner */}
					{error && (
						<div className="bg-destructive/10 text-destructive text-xs font-medium text-center py-1 px-4" role="alert">
							{error}
						</div>
					)}

					{/* Frequency visualizer (desktop only) */}
					<div className="hidden md:block h-3.5 overflow-hidden">
						<AudioVisualizer barCount={44} className="text-foreground" />
					</div>

					{/* Progress bar (touch-friendly) */}
					<div className="group/seekbar -mb-3">
						<SeekBar
							currentTime={currentTime}
							duration={duration}
							onSeek={seek}
							variant="thin"
						/>
					</div>

					<div className="flex items-center gap-4 px-4 py-3.5">
						{/* Track info — tap opens fullscreen on mobile */}
						<div
							className="flex items-center gap-3 min-w-0 w-[30%] cursor-pointer md:cursor-default"
							onClick={() => setFullscreenOpen(true)}
							onContextMenu={handleContextMenu}
						>
							<CoverImage
								src={currentTrack.cover}
								className="h-10 w-10 shrink-0 rounded-lg shadow-sm"
							/>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium leading-tight">
									{currentTrack.title}
								</p>
								<p className="truncate text-xs text-muted-foreground leading-tight">
									{currentTrack.artist}
								</p>
							</div>
						</div>

						{/* Controls */}
						<div className="flex items-center justify-center gap-1 flex-1">
							{/* Shuffle */}
							{hasQueue && (
								<Button
									variant="ghost"
									size="icon"
									aria-label="Shuffle"
									aria-pressed={shuffle}
									className={`h-7 w-7 sm:h-8 sm:w-8 ${shuffle ? "text-foreground" : "text-muted-foreground"}`}
									onClick={toggleShuffle}
								>
									<svg width="12" height="12" className="sm:w-[14px] sm:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<polyline points="16 3 21 3 21 8" />
										<line x1="4" y1="20" x2="21" y2="3" />
										<polyline points="21 16 21 21 16 21" />
										<line x1="15" y1="15" x2="21" y2="21" />
										<line x1="4" y1="4" x2="9" y2="9" />
									</svg>
								</Button>
							)}

							{/* Prev */}
							<Button
								variant="ghost"
								size="icon"
								aria-label="Previous track"
								className="h-8 w-8 text-muted-foreground hover:text-foreground"
								onClick={prev}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
									<rect x="2" y="4" width="3" height="16" rx="1" />
									<path d="M22 4L9 12L22 20V4Z" />
								</svg>
							</Button>

							{/* Play/Pause */}
							<Button
								variant="ghost"
								size="icon"
								aria-label={isPlaying ? "Pause" : "Play"}
								className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90"
								onClick={toggle}
							>
								{isPlaying && isBuffering ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : isPlaying ? (
									<svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
										<rect x="1" y="1" width="3.5" height="10" rx="0.5" />
										<rect x="7.5" y="1" width="3.5" height="10" rx="0.5" />
									</svg>
								) : (
									<svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
										<path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
									</svg>
								)}
							</Button>

							{/* Next */}
							<Button
								variant="ghost"
								size="icon"
								aria-label="Next track"
								className="h-8 w-8 text-muted-foreground hover:text-foreground"
								onClick={next}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
									<rect x="19" y="4" width="3" height="16" rx="1" />
									<path d="M2 4L15 12L2 20V4Z" />
								</svg>
							</Button>

							{/* Repeat */}
							{hasQueue && (
								<Button
									variant="ghost"
									size="icon"
									aria-label={`Repeat ${repeat}`}
									aria-pressed={repeat !== "off"}
									className={`h-7 w-7 sm:h-8 sm:w-8 relative ${repeat !== "off" ? "text-foreground" : "text-muted-foreground"}`}
									onClick={toggleRepeat}
								>
									<svg width="12" height="12" className="sm:w-[14px] sm:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<polyline points="17 1 21 5 17 9" />
										<path d="M3 11V9a4 4 0 0 1 4-4h14" />
										<polyline points="7 23 3 19 7 15" />
										<path d="M21 13v2a4 4 0 0 1-4 4H3" />
									</svg>
									{repeat === "one" && (
										<span className="absolute text-[8px] font-bold">1</span>
									)}
								</Button>
							)}
						</div>

						{/* Time + Volume */}
						<div className="flex items-center gap-3 justify-end w-[30%]">
							<span className="text-xs text-muted-foreground tabular-nums">
								{formatTime(currentTime)}<span className="hidden sm:inline"> / {formatTime(duration)}</span>
							</span>

							{/* Volume */}
							<div className="hidden md:flex items-center gap-1.5">
								<svg
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									className="shrink-0 text-muted-foreground"
								>
									<path d="M11 5L6 9H2v6h4l5 4V5z" />
									{volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
									{volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
								</svg>
								<input
									type="range"
									min={0}
									max={100}
									value={volume}
									aria-label="Volume"
									onChange={(e) => setVolume(parseInt(e.target.value))}
									className="w-20 h-1 accent-foreground cursor-pointer"
								/>
							</div>

							{/* Lyrics toggle */}
							<Button
								variant="ghost"
								size="icon"
								aria-label="Toggle lyrics"
								aria-pressed={lyricsVisible}
								className={`hidden md:inline-flex h-7 w-7 ${lyricsVisible ? "text-primary" : "text-muted-foreground"} hover:text-foreground`}
								onClick={toggleLyrics}
							>
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M9 18V5l12-2v13" />
									<circle cx="6" cy="18" r="3" />
									<circle cx="18" cy="16" r="3" />
								</svg>
							</Button>

							{/* Speed control */}
							<Button
								variant="ghost"
								size="sm"
								aria-label={`Playback speed ${formatRate(playbackRate)}`}
								className="hidden md:flex h-7 px-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
								onClick={cycleSpeed}
							>
								{formatRate(playbackRate)}
							</Button>

							{/* Sleep timer + crossfade settings */}
							<DropdownMenu>
								<DropdownMenuTrigger
									aria-label="Sleep timer and crossfade settings"
									className={`hidden md:inline-flex h-7 w-7 items-center justify-center rounded-md ${sleepActive ? "text-foreground" : "text-muted-foreground"} hover:bg-accent hover:text-foreground`}
								>
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
									</svg>
								</DropdownMenuTrigger>
								<DropdownMenuContent side="top" align="end">
									<DropdownMenuLabel>Sleep timer</DropdownMenuLabel>
									{sleepActive && (
										<DropdownMenuItem onClick={() => setSleepTimer(null)}>
											Turn off
										</DropdownMenuItem>
									)}
									{([5, 10, 15, 30, 45, 60] as const).map((m) => (
										<DropdownMenuItem key={m} onClick={() => setSleepTimer(m)}>
											{m} min
										</DropdownMenuItem>
									))}
									<DropdownMenuSeparator />
									<DropdownMenuLabel>Crossfade</DropdownMenuLabel>
									{([0, 1, 2, 3, 5, 8] as const).map((s) => (
										<DropdownMenuItem
											key={s}
											onClick={() => setCrossfadeDuration(s)}
											className={crossfadeDuration === s ? "font-semibold" : ""}
										>
											{s === 0 ? "Off" : `${s}s`}
										</DropdownMenuItem>
									))}
									<DropdownMenuSeparator />
									<DropdownMenuCheckboxItem
										checked={normalizationEnabled}
										onClick={toggleNormalization}
									>
										Loudness norm
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Close */}
							<Button
								variant="ghost"
								size="icon"
								aria-label="Close player"
								className="h-7 w-7 text-muted-foreground hover:text-foreground"
								onClick={stop}
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
								>
									<path d="M18 6L6 18M6 6l12 12" />
								</svg>
							</Button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
