"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Button } from "@/components/ui/button";
import { SeekBar } from "./SeekBar";
import { KaraokeToggle } from "./KaraokeToggle";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuGroup,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Captions } from "lucide-react";
import { formatTime } from "@/utils/format-time";
import Link from "next/link";
import type { ReactElement } from "react";

function seek(time: number) {
	usePlayerStore.getState().seek(time);
}

/** Wraps a button-like trigger so every icon control gets a hover tooltip
 *  without repeating the Tooltip/TooltipTrigger boilerplate at every site. */
function Tip({ label, trigger, children }: { label: string; trigger: ReactElement; children: React.ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger render={trigger}>{children}</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

export function Player() {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const isBuffering = usePlayerStore((s) => s.isBuffering);
	const volume = usePlayerStore((s) => s.volume);
	const currentTime = usePlayerStore((s) => s.currentTime);
	const duration = usePlayerStore((s) => s.duration);
	const buffered = usePlayerStore((s) => s.buffered);
	const shuffle = usePlayerStore((s) => s.shuffle);
	const repeat = usePlayerStore((s) => s.repeat);
	const queue = usePlayerStore((s) => s.queue);

	const toggle = usePlayerStore((s) => s.toggle);
	const stop = usePlayerStore((s) => s.stop);
	const next = usePlayerStore((s) => s.next);
	const prev = usePlayerStore((s) => s.prev);
	const setVolume = usePlayerStore((s) => s.setVolume);
	const toggleMute = usePlayerStore((s) => s.toggleMute);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
	const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);

	const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);
	const queuePanelOpen = usePlayerStore((s) => s.queuePanelOpen);
	const setQueuePanelOpen = usePlayerStore((s) => s.setQueuePanelOpen);
	const openSheet = useTrackActionStore((s) => s.openSheet);

	const lyricsVisible = useLyricsStore((s) => s.visible);
	const toggleLyrics = useLyricsStore((s) => s.toggleVisible);
	const setLyricsVisible = useLyricsStore((s) => s.setVisible);

	const hasQueue = queue.length > 1;

	// Queue and lyrics share the same floating slot on the right — keep them
	// mutually exclusive so they don't overlap.
	const handleToggleQueue = () => {
		const next = !queuePanelOpen;
		setQueuePanelOpen(next);
		if (next && lyricsVisible) setLyricsVisible(false);
	};
	const handleToggleLyrics = () => {
		if (!lyricsVisible && queuePanelOpen) setQueuePanelOpen(false);
		toggleLyrics();
	};

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
					className="fixed bottom-0 left-0 right-0 z-50 border-t-[3px] border-foreground bg-card md:left-60 pb-[env(safe-area-inset-bottom)]"
				>

					{/* Progress bar (touch-friendly) — flush with top border */}
					<div className="group/seekbar absolute -top-4 left-0 right-0">
						<SeekBar
							currentTime={currentTime}
							duration={duration}
							buffered={buffered}
							onSeek={seek}
							variant="thin"
						/>
					</div>

					<div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3">
						{/* Track info — tap opens fullscreen on mobile */}
						<div
							className="flex items-center gap-3 min-w-0 w-[30%] cursor-pointer md:cursor-default"
							onClick={() => setFullscreenOpen(true)}
							onContextMenu={handleContextMenu}
						>
							<CoverImage
								src={currentTrack.cover}
								className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 border-2 border-foreground"
							/>
							<div className="min-w-0">
								<p className="truncate text-[13px] font-extrabold leading-tight tracking-[-0.01em]">
									{currentTrack.title}
								</p>
								<p className="truncate text-[11px] text-muted-foreground leading-tight font-medium mt-0.5">
									{currentTrack.artistId ? (
										<Link
											href={`/artist?id=${currentTrack.artistId}`}
											onClick={(e) => e.stopPropagation()}
											className="hover:underline hover:text-foreground transition-colors"
										>
											{currentTrack.artist}
										</Link>
									) : (
										currentTrack.artist
									)}
								</p>
							</div>
						</div>

						{/* Controls */}
						<div className="flex items-center justify-center gap-1 flex-1">
							{/* Shuffle */}
							{hasQueue && (
								<Tip
									label={shuffle ? "Shuffle on" : "Shuffle"}
									trigger={
										<Button
											variant="ghost"
											size="icon"
											aria-label="Shuffle"
											aria-pressed={shuffle}
											className={`h-7 w-7 sm:h-8 sm:w-8 ${shuffle ? "text-foreground" : "text-muted-foreground"}`}
											onClick={toggleShuffle}
										/>
									}
								>
									<svg width="12" height="12" className="sm:w-[14px] sm:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<polyline points="16 3 21 3 21 8" />
										<line x1="4" y1="20" x2="21" y2="3" />
										<polyline points="21 16 21 21 16 21" />
										<line x1="15" y1="15" x2="21" y2="21" />
										<line x1="4" y1="4" x2="9" y2="9" />
									</svg>
								</Tip>
							)}

							{/* Prev */}
							<Tip
								label="Previous track"
								trigger={
									<Button
										variant="ghost"
										size="icon"
										aria-label="Previous track"
										className="h-8 w-8 text-foreground hover:bg-accent border-[2px] border-transparent hover:border-foreground"
										onClick={prev}
									/>
								}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
									<rect x="2" y="4" width="3" height="16" rx="1" />
									<path d="M22 4L9 12L22 20V4Z" />
								</svg>
							</Tip>

							{/* Play/Pause */}
							<Tip
								label={isPlaying ? "Pause" : "Play"}
								trigger={
									<Button
										variant="ghost"
										size="icon"
										aria-label={isPlaying ? "Pause" : "Play"}
										className="h-10 w-10 border-[2px] border-foreground bg-primary text-white hover:bg-primary/90 shadow-[var(--shadow-brutal-sm)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
										onClick={toggle}
									/>
								}
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
							</Tip>

							{/* Next */}
							<Tip
								label="Next track"
								trigger={
									<Button
										variant="ghost"
										size="icon"
										aria-label="Next track"
										className="h-8 w-8 text-foreground hover:bg-accent border-[2px] border-transparent hover:border-foreground"
										onClick={next}
									/>
								}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
									<rect x="19" y="4" width="3" height="16" rx="1" />
									<path d="M2 4L15 12L2 20V4Z" />
								</svg>
							</Tip>

							{/* Repeat */}
							{hasQueue && (
								<Tip
									label={repeat === "off" ? "Repeat" : repeat === "all" ? "Repeat all" : "Repeat one"}
									trigger={
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Repeat ${repeat}`}
											aria-pressed={repeat !== "off"}
											className={`h-7 w-7 sm:h-8 sm:w-8 relative ${repeat !== "off" ? "text-foreground" : "text-muted-foreground"}`}
											onClick={toggleRepeat}
										/>
									}
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
								</Tip>
							)}
						</div>

						{/* Time + secondary controls */}
						<div className="flex items-center gap-1.5 sm:gap-2 justify-end w-[30%]">
							<span className="text-[10px] sm:text-[11px] font-mono font-bold text-muted-foreground tabular-nums tracking-[0.05em] mr-0.5">
								{formatTime(currentTime)}<span className="hidden sm:inline"> / {formatTime(duration)}</span>
							</span>

							{/* Queue panel toggle */}
							<Tip
								label={queuePanelOpen ? "Close queue" : `Queue (${queue.length})`}
								trigger={
									<Button
										variant="ghost"
										size="icon"
										aria-label={queuePanelOpen ? "Close queue" : "Open queue"}
										aria-pressed={queuePanelOpen}
										className={`relative h-7 w-7 sm:h-8 sm:w-8 border-[2px] ${queuePanelOpen ? "bg-accent text-foreground border-foreground" : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"}`}
										onClick={handleToggleQueue}
									/>
								}
							>
								<svg width="13" height="13" className="sm:w-[14px] sm:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
									<line x1="8" y1="6" x2="21" y2="6" />
									<line x1="8" y1="12" x2="21" y2="12" />
									<line x1="8" y1="18" x2="21" y2="18" />
									<circle cx="3.5" cy="6" r="1.2" fill="currentColor" />
									<circle cx="3.5" cy="12" r="1.2" fill="currentColor" />
									<circle cx="3.5" cy="18" r="1.2" fill="currentColor" />
								</svg>
								{queue.length > 1 && (
									<span
										aria-hidden
										className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[3px] flex items-center justify-center border-[1.5px] border-foreground bg-primary text-[8px] font-black leading-none text-white tabular-nums"
									>
										{queue.length > 99 ? "99+" : queue.length}
									</span>
								)}
							</Tip>

							{/* Karaoke toggle (icon-only with tooltip; expands during prepare/retry) */}
							<KaraokeToggle />

							{/* Lyrics toggle */}
							<Tip
								label={lyricsVisible ? "Hide lyrics" : "Show lyrics"}
								trigger={
									<Button
										variant="ghost"
										size="icon"
										aria-label="Toggle lyrics"
										aria-pressed={lyricsVisible}
										className={`hidden md:inline-flex h-7 w-7 border-[2px] ${lyricsVisible ? "bg-accent text-foreground border-foreground" : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"}`}
										onClick={handleToggleLyrics}
									/>
								}
							>
								<Captions className="h-3.5 w-3.5" />
							</Tip>

							{/* Volume — brutal bar */}
							<div className="hidden md:flex items-center gap-1.5">
								<Tip
									label={volume === 0 ? "Unmute" : "Mute"}
									trigger={
										<button
											type="button"
											onClick={toggleMute}
											aria-label={volume === 0 ? "Unmute" : "Mute"}
											aria-pressed={volume === 0}
											className="shrink-0 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm p-0.5"
										/>
									}
								>
									<svg
										width="13"
										height="13"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<path d="M11 5L6 9H2v6h4l5 4V5z" />
										{volume === 0 ? (
											<>
												<line x1="23" y1="9" x2="17" y2="15" />
												<line x1="17" y1="9" x2="23" y2="15" />
											</>
										) : (
											<>
												{volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
												{volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
											</>
										)}
									</svg>
								</Tip>
								<div className="relative w-16 h-2 border-[2px] border-foreground bg-background">
									<div
										className="absolute inset-y-0 left-0 bg-foreground"
										style={{ width: `${volume}%` }}
									/>
									<input
										type="range"
										min={0}
										max={100}
										value={volume}
										aria-label="Volume"
										onChange={(e) => setVolume(parseInt(e.target.value))}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
									/>
								</div>
							</div>

							{/* Crossfade + loudness settings — native title; can't nest base-ui Tooltip and Menu triggers on the same button without the click being swallowed */}
							<DropdownMenu>
								<DropdownMenuTrigger
									aria-label="Audio settings"
									title="Audio settings"
									className="hidden md:inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
								>
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<line x1="4" y1="21" x2="4" y2="14" />
										<line x1="4" y1="10" x2="4" y2="3" />
										<line x1="12" y1="21" x2="12" y2="12" />
										<line x1="12" y1="8" x2="12" y2="3" />
										<line x1="20" y1="21" x2="20" y2="16" />
										<line x1="20" y1="12" x2="20" y2="3" />
										<line x1="1" y1="14" x2="7" y2="14" />
										<line x1="9" y1="8" x2="15" y2="8" />
										<line x1="17" y1="16" x2="23" y2="16" />
									</svg>
								</DropdownMenuTrigger>
								<DropdownMenuContent side="top" align="end">
									<DropdownMenuGroup>
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
									</DropdownMenuGroup>
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
							<Tip
								label="Close player"
								trigger={
									<Button
										variant="ghost"
										size="icon"
										aria-label="Close player"
										className="h-7 w-7 text-muted-foreground hover:text-foreground"
										onClick={stop}
									/>
								}
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
							</Tip>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
