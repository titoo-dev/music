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
	DropdownMenuGroup,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { AudioVisualizer } from "./AudioVisualizer";
import { LyricsDisplay } from "./LyricsDisplay";
import { KaraokeToggle } from "./KaraokeToggle";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { PlayPauseIcon, Spinner } from "@/components/motion/icons";
import { formatTime } from "@/utils/format-time";
import Link from "next/link";
import type { PlayerTrack } from "@/stores/usePlayerStore";

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
		<div className="flex-1 flex items-center justify-center min-h-0 px-6 py-6">
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
								className="aspect-square w-full rounded-2xl shadow-float"
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

	const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);

	if (!currentTrack) return null;
	return (
		<div className="shrink-0 px-8 pb-3" onContextMenu={handleContextMenu}>
			<p className="truncate text-xl font-semibold tracking-tight">{currentTrack.title}</p>
			<p className="mt-0.5 truncate text-sm text-muted-foreground">
				{currentTrack.artistId ? (
					<Link
						href={`/artist?id=${currentTrack.artistId}`}
						onClick={() => setFullscreenOpen(false)}
						className="hover:underline hover:text-foreground transition-colors"
					>
						{currentTrack.artist}
					</Link>
				) : (
					currentTrack.artist
				)}
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
		<div className="shrink-0 px-8">
			<SeekBar
				currentTime={currentTime}
				duration={duration}
				buffered={buffered}
				onSeek={seek}
				variant="large"
			/>
			<div className="flex justify-between -mt-1">
				<span className="font-mono text-[11px] tabular-nums text-muted-foreground">
					{formatTime(currentTime)}
				</span>
				<span className="font-mono text-[11px] tabular-nums text-muted-foreground">
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
		<div className="flex shrink-0 items-center justify-between px-8 pt-4 pb-10">
			<Button
				variant="ghost"
				size="icon"
				aria-label="Shuffle"
				aria-pressed={shuffle}
				className={`h-12 w-12 rounded-full ${
					!hasQueue ? "opacity-30 pointer-events-none" : ""
				} ${shuffle ? "text-highlight hover:text-highlight" : "text-muted-foreground"}`}
				onClick={toggleShuffle}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="16 3 21 3 21 8" />
					<line x1="4" y1="20" x2="21" y2="3" />
					<polyline points="21 16 21 21 16 21" />
					<line x1="15" y1="15" x2="21" y2="21" />
					<line x1="4" y1="4" x2="9" y2="9" />
				</svg>
			</Button>

			<Button variant="ghost" size="icon" aria-label="Previous track" className="h-14 w-14 rounded-full text-foreground hover:text-foreground" onClick={prevTrack}>
				<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" strokeLinejoin="round">
					<rect x="3" y="5" width="2.5" height="14" rx="1.25" />
					<path d="M20 5.5v13a1 1 0 0 1-1.53.85L8.5 13a1.2 1.2 0 0 1 0-2l9.97-6.35A1 1 0 0 1 20 5.5Z" />
				</svg>
			</Button>

			<Button variant="default" size="icon" aria-label={isPlaying ? "Pause" : "Play"} className="h-[72px] w-[72px] rounded-full shadow-float hover:bg-primary active:scale-95" onClick={toggle}>
				{isPlaying && isBuffering ? (
					<Spinner size={28} />
				) : (
					<PlayPauseIcon playing={isPlaying} className="size-8" />
				)}
			</Button>

			<Button variant="ghost" size="icon" aria-label="Next track" className="h-14 w-14 rounded-full text-foreground hover:text-foreground" onClick={next}>
				<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" strokeLinejoin="round">
					<rect x="18.5" y="5" width="2.5" height="14" rx="1.25" />
					<path d="M4 5.5v13a1 1 0 0 0 1.53.85L15.5 13a1.2 1.2 0 0 0 0-2L5.53 4.65A1 1 0 0 0 4 5.5Z" />
				</svg>
			</Button>

			<Button
				variant="ghost"
				size="icon"
				aria-label={`Repeat ${repeat}`}
				aria-pressed={repeat !== "off"}
				className={`h-12 w-12 relative rounded-full ${
					!hasQueue ? "opacity-30 pointer-events-none" : ""
				} ${repeat !== "off" ? "text-highlight hover:text-highlight" : "text-muted-foreground"}`}
				onClick={toggleRepeat}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="17 1 21 5 17 9" />
					<path d="M3 11V9a4 4 0 0 1 4-4h14" />
					<polyline points="7 23 3 19 7 15" />
					<path d="M21 13v2a4 4 0 0 1-4 4H3" />
				</svg>
				{repeat === "one" && (
					<span className="absolute text-[9px] font-semibold">1</span>
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
				className="shrink-0 rounded-md p-1 -ml-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
			<div className="group/vol relative flex h-6 flex-1 items-center">
				<div className="relative h-1 w-full overflow-hidden rounded-full bg-border transition-[height] duration-150 group-hover/vol:h-1.5">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-foreground"
						style={{ width: `${volume}%` }}
					/>
				</div>
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
			<span className="w-7 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
				{volume}
			</span>
		</div>
	);
}

/* ─── Extra Controls (crossfade + loudness norm) ─── */
function ExtraControls() {
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);

	return (
		<div className="shrink-0 flex items-center justify-end px-8 pb-2">
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Audio settings"
					className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
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
								className={crossfadeDuration === s ? "font-medium text-foreground" : "text-muted-foreground"}
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
	const setLyricsVisible = useLyricsStore((s) => s.setVisible);
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
					className="fixed inset-0 z-[70] isolate flex flex-col overflow-hidden bg-background md:[&>*:not([aria-hidden])]:mx-auto md:[&>*:not([aria-hidden])]:w-full md:[&>*:not([aria-hidden])]:max-w-xl"
				>
					{/* Ambient backdrop — blurred copy of the cover, crossfades per track */}
					<div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
						<AnimatePresence initial={false}>
							{currentTrack.cover && (
								<motion.div
									key={currentTrack.cover}
									initial={{ opacity: 0 }}
									animate={{ opacity: 0.45 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.8, ease: "easeOut" }}
									className="absolute -inset-[20%] scale-110 bg-cover bg-center blur-3xl saturate-150"
									style={{ backgroundImage: `url("${currentTrack.cover}")` }}
								/>
							)}
						</AnimatePresence>
						<div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
					</div>

					{/* Drag handle */}
					<div
						className="flex shrink-0 items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
						onPointerDown={(e) => dragControls.start(e)}
						role="button"
						aria-label="Drag down to close"
					>
						<motion.div
							className="h-1 w-10 rounded-full bg-foreground/20"
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
					<div className="flex shrink-0 items-center px-3 py-1">
						<Button
							variant="ghost"
							size="icon-touch"
							aria-label="Close fullscreen player"
							onClick={() => setFullscreenOpen(false)}
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</Button>
						<span className="flex-1 text-center text-xs font-medium text-muted-foreground">
							{lyricsVisible ? "Lyrics" : "Now Playing"}
						</span>
						<div className="flex items-center gap-0.5">
							<KaraokeToggle className="h-11 w-11 px-0" iconSize={18} />
							{hasQueue && (
								<Button
									variant="ghost"
									size="icon-touch"
									aria-label="Open queue"
									className="text-muted-foreground"
									onClick={() => {
										setFullscreenOpen(false);
										if (lyricsVisible) setLyricsVisible(false);
										setQueuePanelOpen(true);
									}}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
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
								size="icon-touch"
								aria-label="Toggle lyrics"
								aria-pressed={lyricsVisible}
								className={lyricsVisible ? "bg-accent text-foreground" : "text-muted-foreground"}
								onClick={toggleLyrics}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
								<AudioVisualizer barCount={32} className="w-full h-full text-foreground/60" />
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
