"use client";

import { memo, useEffect, useRef, useMemo, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Button } from "@/components/ui/button";
import { SeekBar } from "./SeekBar";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";
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
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { Loader2 } from "lucide-react";
import { formatTime } from "@/utils/format-time";
import type { PlayerTrack } from "@/stores/usePlayerStore";

const SPEED_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

function formatRate(rate: number): string {
	return rate === 1 ? "1×" : `${rate}×`;
}

function seek(time: number) {
	usePlayerStore.getState().seek(time);
}


/* ─── Cover Carousel ─── */
/* Only re-renders when queue changes — immune to currentTime updates */
const CoverCarousel = memo(function CoverCarousel({
	queue,
}: {
	queue: PlayerTrack[];
}) {
	const carouselApiRef = useRef<CarouselApi>(undefined);
	const cleanupRef = useRef<(() => void) | undefined>(undefined);
	const carouselOpts = useMemo(() => ({ watchDrag: true }), []);

	const onCarouselApi = (api: CarouselApi) => {
		cleanupRef.current?.();
		carouselApiRef.current = api;
		if (!api) return;

		api.scrollTo(usePlayerStore.getState().queueIndex, true);

		const onSelect = () => {
			const selected = api.selectedScrollSnap();
			const storeIdx = usePlayerStore.getState().queueIndex;
			if (selected === storeIdx) return;

			if (selected > storeIdx) {
				usePlayerStore.getState().next();
			} else {
				usePlayerStore.getState().prevTrack();
			}

			const newIdx = usePlayerStore.getState().queueIndex;
			if (selected !== newIdx) {
				api.scrollTo(newIdx);
			}
		};

		api.on("select", onSelect);
		cleanupRef.current = () => api.off("select", onSelect);
	};

	// Sync carousel when queueIndex changes externally (buttons, etc.)
	useEffect(() => {
		return usePlayerStore.subscribe((state, prev) => {
			if (state.queueIndex === prev.queueIndex) return;
			const api = carouselApiRef.current;
			if (!api) return;
			if (api.selectedScrollSnap() !== state.queueIndex) {
				api.scrollTo(state.queueIndex);
			}
		});
	}, []);

	// Jump to correct slide when fullscreen opens
	useEffect(() => {
		return usePlayerStore.subscribe((state, prev) => {
			if (state.fullscreenOpen && !prev.fullscreenOpen) {
				carouselApiRef.current?.scrollTo(state.queueIndex, true);
			}
		});
	}, []);

	useEffect(() => () => cleanupRef.current?.(), []);

	return (
		<div className="flex-1 flex items-center justify-center min-h-0 px-4 py-6">
			<Carousel
				opts={carouselOpts}
				setApi={onCarouselApi}
				className="w-full max-w-[340px]"
			>
				<CarouselContent className="-ml-0">
					{queue.map((track) => (
						<CarouselItem key={track.trackId} className="pl-0">
							<CoverImage
								src={track.cover}
								className="aspect-square w-full border-[3px] border-foreground shadow-[var(--shadow-brutal)]"
							/>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</div>
	);
});

/* ─── Track Info ─── */
function TrackInfo() {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const openSheet = useTrackActionStore((s) => s.openSheet);

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		if (!currentTrack) return;
		openSheet({
			id: currentTrack.trackId,
			title: currentTrack.title,
			artist: currentTrack.artist,
			cover: currentTrack.cover,
			duration: currentTrack.duration,
		});
	}, [currentTrack, openSheet]);

	if (!currentTrack) return null;
	return (
		<div className="shrink-0 px-8 pb-3" onContextMenu={handleContextMenu}>
			<p className="truncate text-brutal-md">{currentTrack.title}</p>
			<p className="truncate text-sm font-bold uppercase tracking-wide text-muted-foreground">
				{currentTrack.artist}
			</p>
		</div>
	);
}

/* ─── Seek Section ─── */
function SeekSection() {
	const currentTime = usePlayerStore((s) => s.currentTime);
	const duration = usePlayerStore((s) => s.duration);
	const buffered = usePlayerStore((s) => s.buffered);
	return (
		<div className="shrink-0 px-8 group/seekbar">
			<SeekBar
				currentTime={currentTime}
				duration={duration}
				buffered={buffered}
				onSeek={seek}
				variant="large"
			/>
			<div className="flex justify-between -mt-1">
				<span className="brutal-label text-muted-foreground tabular-nums">
					{formatTime(currentTime)}
				</span>
				<span className="brutal-label text-muted-foreground tabular-nums">
					{formatTime(duration)}
				</span>
			</div>
		</div>
	);
}

/* ─── Controls ─── */
function Controls() {
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const isBuffering = usePlayerStore((s) => s.isBuffering);
	const shuffle = usePlayerStore((s) => s.shuffle);
	const repeat = usePlayerStore((s) => s.repeat);
	const hasQueue = usePlayerStore((s) => s.queue.length > 1);

	const toggle = usePlayerStore((s) => s.toggle);
	const next = usePlayerStore((s) => s.next);
	const prevTrack = usePlayerStore((s) => s.prevTrack);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
	const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);

	return (
		<div className="flex shrink-0 items-center justify-between px-8 py-6 pb-10">
			<Button
				variant="ghost"
				size="icon"
				aria-label="Shuffle"
				aria-pressed={shuffle}
				className={`h-12 w-12 ${
					!hasQueue ? "opacity-30 pointer-events-none" : ""
				} ${shuffle ? "text-primary" : "text-muted-foreground"}`}
				onClick={toggleShuffle}
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
					<polyline points="16 3 21 3 21 8" />
					<line x1="4" y1="20" x2="21" y2="3" />
					<polyline points="21 16 21 21 16 21" />
					<line x1="15" y1="15" x2="21" y2="21" />
					<line x1="4" y1="4" x2="9" y2="9" />
				</svg>
			</Button>

			<Button variant="ghost" size="icon" aria-label="Previous track" className="h-14 w-14 text-foreground" onClick={prevTrack}>
				<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
					<rect x="2" y="4" width="3" height="16" rx="0" />
					<path d="M22 4L9 12L22 20V4Z" />
				</svg>
			</Button>

			<Button variant="secondary" size="icon" aria-label={isPlaying ? "Pause" : "Play"} className="h-[72px] w-[72px] border-[3px]" onClick={toggle}>
				{isPlaying && isBuffering ? (
					<Loader2 className="h-8 w-8 animate-spin" />
				) : isPlaying ? (
					<svg width="30" height="30" viewBox="0 0 12 12" fill="currentColor">
						<rect x="1" y="1" width="3.5" height="10" rx="0" />
						<rect x="7.5" y="1" width="3.5" height="10" rx="0" />
					</svg>
				) : (
					<svg width="30" height="30" viewBox="0 0 12 12" fill="currentColor">
						<path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
					</svg>
				)}
			</Button>

			<Button variant="ghost" size="icon" aria-label="Next track" className="h-14 w-14 text-foreground" onClick={next}>
				<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
					<rect x="19" y="4" width="3" height="16" rx="0" />
					<path d="M2 4L15 12L2 20V4Z" />
				</svg>
			</Button>

			<Button
				variant="ghost"
				size="icon"
				aria-label={`Repeat ${repeat}`}
				aria-pressed={repeat !== "off"}
				className={`h-12 w-12 relative ${
					!hasQueue ? "opacity-30 pointer-events-none" : ""
				} ${repeat !== "off" ? "text-primary" : "text-muted-foreground"}`}
				onClick={toggleRepeat}
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
					<polyline points="17 1 21 5 17 9" />
					<path d="M3 11V9a4 4 0 0 1 4-4h14" />
					<polyline points="7 23 3 19 7 15" />
					<path d="M21 13v2a4 4 0 0 1-4 4H3" />
				</svg>
				{repeat === "one" && (
					<span className="absolute text-[9px] font-black">1</span>
				)}
			</Button>
		</div>
	);
}

/* ─── Volume Section (with mute toggle) ─── */
function VolumeSection() {
	const volume = usePlayerStore((s) => s.volume);
	const setVolume = usePlayerStore((s) => s.setVolume);
	const toggleMute = usePlayerStore((s) => s.toggleMute);
	return (
		<div className="shrink-0 flex items-center gap-3 px-8 pb-3">
			<button
				type="button"
				onClick={toggleMute}
				aria-label={volume === 0 ? "Unmute" : "Mute"}
				aria-pressed={volume === 0}
				className="shrink-0 text-foreground hover:text-primary p-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
			</button>
			<div className="relative flex-1 h-2.5 border-2 border-foreground bg-background">
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
			<span className="text-[10px] font-mono font-bold tabular-nums text-muted-foreground tracking-wider w-7 text-right">
				{volume}
			</span>
		</div>
	);
}

/* ─── Extra Controls (speed + sleep timer + crossfade) ─── */
function ExtraControls() {
	const playbackRate = usePlayerStore((s) => s.playbackRate);
	const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
	const sleepTimerEnd = usePlayerStore((s) => s.sleepTimerEnd);
	const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);

	const sleepActive = sleepTimerEnd !== null;

	function cycleSpeed() {
		const idx = SPEED_STEPS.indexOf(playbackRate);
		const next = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
		setPlaybackRate(next);
	}

	return (
		<div className="shrink-0 flex items-center justify-between px-8 pb-2">
			{/* Speed */}
			<Button
				variant="ghost"
				size="sm"
				aria-label={`Playback speed ${formatRate(playbackRate)}`}
				className="h-9 px-3 text-sm font-mono text-muted-foreground hover:text-foreground"
				onClick={cycleSpeed}
			>
				{formatRate(playbackRate)}
			</Button>

			{/* Sleep timer + crossfade dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Sleep timer and crossfade settings"
					className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${sleepActive ? "text-foreground" : "text-muted-foreground"} hover:bg-accent hover:text-foreground`}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
		</div>
	);
}

/* ─── Shell ─── */
/* Only subscribes to fullscreenOpen + currentTrack (for mount/unmount) */
export function FullscreenPlayer() {
	const fullscreenOpen = usePlayerStore((s) => s.fullscreenOpen);
	const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);
	const setQueuePanelOpen = usePlayerStore((s) => s.setQueuePanelOpen);
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const queue = usePlayerStore((s) => s.queue);
	const dragControls = useDragControls();
	const lyricsVisible = useLyricsStore((s) => s.visible);
	const toggleLyrics = useLyricsStore((s) => s.toggleVisible);
	const fetchLyrics = useLyricsStore((s) => s.fetchLyrics);

	const hasQueue = queue.length > 1;

	useEffect(() => {
		if (fullscreenOpen) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [fullscreenOpen]);

	useEffect(() => {
		if (!currentTrack && fullscreenOpen) {
			setFullscreenOpen(false);
		}
	}, [currentTrack, fullscreenOpen, setFullscreenOpen]);

	// Auto-fetch lyrics when visible and track changes
	useEffect(() => {
		if (lyricsVisible && currentTrack) {
			fetchLyrics(currentTrack.trackId, currentTrack.duration);
		}
	}, [lyricsVisible, currentTrack, fetchLyrics]);

	const handleDragEnd = (
		_: any,
		info: { offset: { y: number }; velocity: { y: number } }
	) => {
		if (info.offset.y > 100 || info.velocity.y > 500) {
			setFullscreenOpen(false);
		}
	};

	return (
		<AnimatePresence>
			{fullscreenOpen && currentTrack && (
				<motion.div
					key="fullscreen-player"
					initial={{ y: "100%" }}
					animate={{ y: 0 }}
					exit={{ y: "100%" }}
					transition={{ type: "spring", damping: 30, stiffness: 300 }}
					drag="y"
					dragControls={dragControls}
					dragListener={false}
					dragConstraints={{ top: 0, bottom: 0 }}
					dragElastic={{ top: 0, bottom: 0.4 }}
					onDragEnd={handleDragEnd}
					role="dialog"
					aria-label="Now playing"
					className="fixed inset-0 z-[60] flex flex-col bg-background md:hidden"
				>
					{/* Drag handle */}
					<div
						className="flex shrink-0 items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
						onPointerDown={(e) => dragControls.start(e)}
						role="button"
						aria-label="Drag down to close"
					>
						<motion.div
							className="h-1.5 w-12 bg-foreground rounded-sm"
							animate={{ scaleX: [1, 1.15, 1] }}
							transition={{
								duration: 1.6,
								repeat: Infinity,
								repeatDelay: 1.4,
								ease: "easeInOut",
							}}
						/>
					</div>

					{/* Header */}
					<div className="flex shrink-0 items-center border-b-2 border-foreground px-4 py-2">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Close fullscreen player"
							className="h-9 w-9"
							onClick={() => setFullscreenOpen(false)}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</Button>
						<span className="brutal-label flex-1 text-center text-muted-foreground">
							{lyricsVisible ? "Lyrics" : "Now Playing"}
						</span>
						<div className="flex items-center gap-1">
							{hasQueue && (
								<Button
									variant="ghost"
									size="icon"
									aria-label="Open queue"
									className="h-9 w-9 text-muted-foreground"
									onClick={() => {
										setFullscreenOpen(false);
										setQueuePanelOpen(true);
									}}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
										<line x1="8" y1="6" x2="21" y2="6" />
										<line x1="8" y1="12" x2="21" y2="12" />
										<line x1="8" y1="18" x2="21" y2="18" />
										<circle cx="3.5" cy="6" r="1.2" fill="currentColor" />
										<circle cx="3.5" cy="12" r="1.2" fill="currentColor" />
										<circle cx="3.5" cy="18" r="1.2" fill="currentColor" />
									</svg>
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								aria-label="Toggle lyrics"
								aria-pressed={lyricsVisible}
								className={`h-9 w-9 ${lyricsVisible ? "text-primary" : "text-muted-foreground"}`}
								onClick={toggleLyrics}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
									<path d="M9 18V5l12-2v13" />
									<circle cx="6" cy="18" r="3" />
									<circle cx="18" cy="16" r="3" />
								</svg>
							</Button>
						</div>
					</div>

					{lyricsVisible ? (
						<>
							<TrackInfo />
							<LyricsDisplay compact />
						</>
					) : (
						<>
							<CoverCarousel queue={queue} />
							<TrackInfo />
							<div className="shrink-0 h-8 px-8 overflow-hidden">
								<AudioVisualizer barCount={32} className="w-full h-full text-foreground" />
							</div>
						</>
					)}
					<SeekSection />
					<VolumeSection />
					<ExtraControls />
					<Controls />
				</motion.div>
			)}
		</AnimatePresence>
	);
}
