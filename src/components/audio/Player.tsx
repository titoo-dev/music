"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Captions, Maximize2, MoreHorizontal, SlidersHorizontal, X } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { useDownloadStore } from "@/stores/useDownloadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { CoverImage } from "@/components/ui/cover-image";
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
import { DownloadGlyph, Equalizer, PlayPauseIcon, SlideSwap } from "@/components/motion/icons";
import { SeekRing } from "./SeekRing";
import { formatTime } from "@/utils/format-time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Tip({ label, trigger, children }: { label: string; trigger: ReactElement; children: React.ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger render={trigger}>{children}</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

const ctl =
	"inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

function PrevGlyph() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
			<rect x="4" y="5" width="2.2" height="14" rx="1.1" />
			<path d="M19 5.8v12.4a1 1 0 0 1-1.52.85L8.5 13.2a1.4 1.4 0 0 1 0-2.4l8.98-5.85A1 1 0 0 1 19 5.8z" />
		</svg>
	);
}

function NextGlyph() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
			<rect x="17.8" y="5" width="2.2" height="14" rx="1.1" />
			<path d="M5 5.8v12.4a1 1 0 0 0 1.52.85l8.98-5.85a1.4 1.4 0 0 0 0-2.4L6.52 4.95A1 1 0 0 0 5 5.8z" />
		</svg>
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
	const enqueueDownload = useDownloadStore((s) => s.enqueue);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const lyricsVisible = useLyricsStore((s) => s.visible);
	const toggleLyrics = useLyricsStore((s) => s.toggleVisible);
	const setLyricsVisible = useLyricsStore((s) => s.setVisible);

	const hasQueue = queue.length > 1;

	// Queue and lyrics share the same floating slot on the right.
	const handleToggleQueue = () => {
		const nextOpen = !queuePanelOpen;
		setQueuePanelOpen(nextOpen);
		if (nextOpen && lyricsVisible) setLyricsVisible(false);
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

	const handleDownload = () => {
		if (!currentTrack) return;
		if (!isAuthenticated) {
			toast("Sign in to download");
			return;
		}
		const n = enqueueDownload([
			{
				trackId: currentTrack.trackId,
				title: currentTrack.title,
				artist: currentTrack.artist,
				cover: currentTrack.cover,
				duration: currentTrack.duration,
			},
		]);
		toast(n ? `Downloading “${currentTrack.title}”` : "Already downloading");
	};

	const seek = usePlayerStore((s) => s.seek);

	return (
		<AnimatePresence>
			{currentTrack && (
				<motion.div
					key="player"
					role="region"
					aria-label="Player controls"
					initial={{ y: 120, opacity: 0, scale: 0.96 }}
					animate={{ y: 0, opacity: 1, scale: 1 }}
					exit={{ y: 120, opacity: 0, scale: 0.96 }}
					transition={{ type: "spring", damping: 30, stiffness: 320 }}
					className="fixed inset-x-0 bottom-[var(--player-offset)] z-[45] mx-auto w-[min(760px,calc(100%-24px))]"
				>
					<SeekRing
						currentTime={currentTime}
						duration={duration}
						buffered={buffered}
						loading={isPlaying && isBuffering}
						onSeek={seek}
						className="glass flex h-[var(--player-h)] items-center gap-2 rounded-2xl border border-border pl-2 pr-2 shadow-float sm:gap-3 sm:pr-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
					>

						{/* Track */}
						<div className="flex min-w-0 flex-1 items-center gap-3" onContextMenu={handleContextMenu}>
							<button
								type="button"
								aria-label="Open fullscreen player"
								onClick={() => setFullscreenOpen(true)}
								className="group/cover relative size-12 shrink-0 overflow-hidden rounded-lg"
							>
								<AnimatePresence mode="popLayout" initial={false}>
									<motion.div
										key={currentTrack.trackId}
										initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
										animate={{ opacity: 1, scale: 1, rotate: 0 }}
										exit={{ opacity: 0, scale: 0.8, rotate: 6 }}
										transition={{ type: "spring", stiffness: 380, damping: 28 }}
										className="absolute inset-0"
									>
										<CoverImage src={currentTrack.cover} className="size-12 rounded-lg" />
									</motion.div>
								</AnimatePresence>
								<span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover/cover:opacity-100">
									<Maximize2 className="size-4" />
								</span>
							</button>
							<div className="min-w-0 flex-1">
								<SlideSwap id={currentTrack.trackId} className="block w-full">
									<span className="block truncate text-sm font-medium leading-tight text-foreground">{currentTrack.title}</span>
								</SlideSwap>
								<p className="mt-0.5 flex items-center gap-1.5 truncate text-xs leading-tight text-muted-foreground">
									{isPlaying && !isBuffering && <Equalizer playing className="h-2.5 shrink-0 text-highlight" />}
									{currentTrack.artistId ? (
										<Link href={`/artist?id=${currentTrack.artistId}`} className="truncate hover:text-foreground hover:underline">
											{currentTrack.artist}
										</Link>
									) : (
										<span className="truncate">{currentTrack.artist}</span>
									)}
								</p>
							</div>
						</div>

						{/* Transport */}
						<div className="flex shrink-0 items-center justify-center gap-0.5 sm:gap-1">
							{hasQueue && (
								<Tip
									label={shuffle ? "Shuffle on" : "Shuffle"}
									trigger={
										<button
											type="button"
											aria-label="Shuffle"
											aria-pressed={shuffle}
											className={cn(ctl, "relative hidden size-8 sm:inline-flex", shuffle && "text-foreground")}
											onClick={toggleShuffle}
										/>
									}
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="size-3.5">
										<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
									</svg>
									{shuffle && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-0.5 size-1 rounded-full bg-highlight" />}
								</Tip>
							)}
							<Tip label="Previous track" trigger={<button type="button" aria-label="Previous track" className={cn(ctl, "hidden size-9 text-foreground sm:inline-flex")} onClick={prev} />}>
								<PrevGlyph />
							</Tip>
							<Tip
								label={isPlaying ? "Pause" : "Play"}
								trigger={
									<motion.button
										type="button"
										aria-label={isPlaying ? "Pause" : "Play"}
										whileTap={{ scale: 0.9 }}
										className="relative inline-flex size-11 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/85"
										onClick={toggle}
									/>
								}
							>
								<PlayPauseIcon playing={isPlaying} className="size-[18px]" />
							</Tip>
							<Tip label="Next track" trigger={<button type="button" aria-label="Next track" className={cn(ctl, "size-9 text-foreground")} onClick={next} />}>
								<NextGlyph />
							</Tip>
							{hasQueue && (
								<Tip
									label={repeat === "off" ? "Repeat" : repeat === "all" ? "Repeat all" : "Repeat one"}
									trigger={
										<button
											type="button"
											aria-label={`Repeat ${repeat}`}
											aria-pressed={repeat !== "off"}
											className={cn(ctl, "relative hidden size-8 sm:inline-flex", repeat !== "off" && "text-foreground")}
											onClick={toggleRepeat}
										/>
									}
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
										<path d="m17 2 4 4-4 4M3 11V10a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
									</svg>
									{repeat === "one" && <span className="absolute right-1 top-1 text-[8px] font-semibold text-highlight">1</span>}
									{repeat !== "off" && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-0.5 size-1 rounded-full bg-highlight" />}
								</Tip>
							)}
						</div>

						{/* Secondary */}
						<div className="hidden min-w-0 items-center justify-end gap-0.5 md:flex">
							<span className="mr-1.5 hidden shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground lg:inline">
								{formatTime(currentTime)}
								<span className="text-muted-foreground/50"> / {formatTime(duration)}</span>
							</span>

							<Tip
								label={queuePanelOpen ? "Close queue" : `Queue (${queue.length})`}
								trigger={
									<button
										type="button"
										aria-label={queuePanelOpen ? "Close queue" : "Open queue"}
										aria-pressed={queuePanelOpen}
										className={cn(ctl, "relative size-8", queuePanelOpen && "bg-accent text-foreground")}
										onClick={handleToggleQueue}
									/>
								}
							>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="size-4">
									<path d="M8 6h13M8 12h13M8 18h9" />
									<circle cx="3.5" cy="6" r="1" fill="currentColor" />
									<circle cx="3.5" cy="12" r="1" fill="currentColor" />
									<circle cx="3.5" cy="18" r="1" fill="currentColor" />
								</svg>
								{queue.length > 1 && (
									<span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-foreground px-1 font-mono text-[8px] leading-none text-background tabular-nums">
										{queue.length > 99 ? "99+" : queue.length}
									</span>
								)}
							</Tip>

							<KaraokeToggle />

							<Tip
								label={lyricsVisible ? "Hide lyrics" : "Show lyrics"}
								trigger={
									<button
										type="button"
										aria-label="Toggle lyrics"
										aria-pressed={lyricsVisible}
										className={cn(ctl, "size-8", lyricsVisible && "bg-accent text-foreground")}
										onClick={handleToggleLyrics}
									/>
								}
							>
								<Captions className="size-4" />
							</Tip>

							{/* Volume — slider pops above the button instead of widening the pill */}
							<div className="group/vol relative">
								<Tip
									label={volume === 0 ? "Unmute" : "Mute"}
									trigger={
										<button
											type="button"
											onClick={toggleMute}
											aria-label={volume === 0 ? "Unmute" : "Mute"}
											aria-pressed={volume === 0}
											className={cn(ctl, "size-8")}
										/>
									}
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-4">
										<path d="M11 5 6 9H2v6h4l5 4V5z" />
										<motion.path d="M15.5 8.5a5 5 0 0 1 0 7" initial={false} animate={{ pathLength: volume > 0 ? 1 : 0, opacity: volume > 0 ? 1 : 0 }} />
										<motion.path d="M19 5a10 10 0 0 1 0 14" initial={false} animate={{ pathLength: volume > 50 ? 1 : 0, opacity: volume > 50 ? 1 : 0 }} />
										<motion.path d="m17 9 6 6M23 9l-6 6" initial={false} animate={{ pathLength: volume === 0 ? 1 : 0, opacity: volume === 0 ? 1 : 0 }} />
									</svg>
								</Tip>
								{/* pb-3 bridges the gap so the pointer can travel from button to slider. */}
								<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 translate-y-1 pb-3 opacity-0 transition-all duration-150 group-hover/vol:pointer-events-auto group-hover/vol:translate-y-0 group-hover/vol:opacity-100 group-focus-within/vol:pointer-events-auto group-focus-within/vol:translate-y-0 group-focus-within/vol:opacity-100">
									<div className="glass flex items-center gap-2 rounded-full border border-border px-3 py-2 shadow-popover">
										<div className="relative h-1 w-24 rounded-full bg-border">
											<div className="absolute inset-y-0 left-0 rounded-full bg-foreground" style={{ width: `${volume}%` }} />
											<input
												type="range"
												min={0}
												max={100}
												value={volume}
												aria-label="Volume"
												onChange={(e) => setVolume(parseInt(e.target.value))}
												className="absolute -inset-y-2 inset-x-0 h-5 w-full cursor-pointer opacity-0"
											/>
										</div>
										<span className="w-6 text-right font-mono text-[10px] tabular-nums text-muted-foreground">{volume}</span>
									</div>
								</div>
							</div>

							{/* Less-used actions. Native title: nested Tooltip + Menu triggers swallow clicks. */}
							<DropdownMenu>
								<DropdownMenuTrigger aria-label="More player options" title="More" className={cn(ctl, "size-8")}>
									<MoreHorizontal className="size-4" />
								</DropdownMenuTrigger>
								<DropdownMenuContent side="top" align="end" sideOffset={14} className="w-52">
									<DropdownMenuItem onClick={handleDownload} className="gap-2">
										<DownloadGlyph />
										Download track
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuGroup>
										<DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
											<SlidersHorizontal className="size-3.5" />
											Crossfade
										</DropdownMenuLabel>
										<div className="flex gap-1 px-2 pb-1.5">
											{([0, 1, 2, 3, 5, 8] as const).map((s) => (
												<button
													key={s}
													type="button"
													aria-pressed={crossfadeDuration === s}
													onClick={() => setCrossfadeDuration(s)}
													className={cn(
														"h-7 flex-1 rounded-md font-mono text-[11px] tabular-nums transition-colors",
														crossfadeDuration === s ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"
													)}
												>
													{s === 0 ? "off" : `${s}s`}
												</button>
											))}
										</div>
									</DropdownMenuGroup>
									<DropdownMenuCheckboxItem checked={normalizationEnabled} onClick={toggleNormalization}>
										Loudness normalization
									</DropdownMenuCheckboxItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={stop} variant="destructive" className="gap-2">
										<X className="size-4" />
										Close player
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Mobile: fullscreen affordance (progress lives on the rim) */}
						<button
							type="button"
							aria-label="Open fullscreen player"
							onClick={() => setFullscreenOpen(true)}
							className={cn(ctl, "size-9 md:hidden")}
						>
							<Maximize2 className="size-4" />
						</button>
					</SeekRing>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
