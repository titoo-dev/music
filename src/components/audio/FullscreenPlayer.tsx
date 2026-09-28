"use client";

import { memo, useEffect, useRef, useMemo, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { CoverImage } from "@/components/ui/cover-image";
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
import { WaveSeek } from "./WaveSeek";
import { ImmersiveBackdrop } from "./ImmersiveBackdrop";
import { motion, AnimatePresence, useDragControls, useTransform, type MotionValue } from "motion/react";
import {
	PlayPauseIcon,
	Spinner,
	ShuffleGlyph,
	RepeatGlyph,
	SkipGlyph,
	VolumeGlyph,
	SlideSwap,
} from "@/components/motion/icons";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { PlayerTrack } from "@/stores/usePlayerStore";

function seek(time: number) {
	usePlayerStore.getState().seek(time);
}

const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const iconBtn =
	"inline-flex items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30";

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
		<Carousel opts={carouselOpts} setApi={onCarouselApi} className="w-full">
			<CarouselContent className="-ml-0">
				{queue.map((track) => (
					<CarouselItem key={track.trackId} className="pl-0">
						<CoverImage
							src={track.cover}
							className="aspect-square w-full rounded-3xl ring-1 ring-foreground/10"
						/>
					</CarouselItem>
				))}
			</CarouselContent>
		</Carousel>
	);
});

/* ─── Cover Stage ─── */
/* The artwork "breathes": it settles back when paused, pulses gently with the
   bass while playing, and casts a coloured glow of itself underneath. */
function CoverStage({ queue, level }: { queue: PlayerTrack[]; level: MotionValue<number> }) {
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const cover = usePlayerStore((s) => s.currentTrack?.cover);
	const pulse = useTransform(level, [0, 1], [1, 1.03]);
	const glowOpacity = useTransform(level, [0, 1], [0.5, 0.95]);
	const glowScale = useTransform(level, [0, 1], [0.92, 1.06]);

	return (
		<div className="flex min-h-0 flex-1 items-center justify-center px-8 py-4 md:px-0">
			<motion.div
				data-testid="cover-stage"
				data-playing={isPlaying || undefined}
				className="relative w-full max-w-[min(360px,42vh)] md:max-w-[min(500px,62vh)]"
				initial={false}
				animate={{ scale: isPlaying ? 1 : 0.86, opacity: isPlaying ? 1 : 0.92 }}
				transition={{ type: "spring", stiffness: 180, damping: 22 }}
			>
				{cover && (
					<motion.div
						aria-hidden
						className="absolute inset-x-[6%] top-[10%] -bottom-[4%] -z-10 rounded-[32px] bg-cover bg-center blur-2xl saturate-150"
						style={{ backgroundImage: `url("${cover}")`, opacity: glowOpacity, scale: glowScale }}
					/>
				)}
				<motion.div
					style={{ scale: pulse }}
					className="rounded-3xl shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]"
				>
					<CoverCarousel queue={queue} />
				</motion.div>
			</motion.div>
		</div>
	);
}

/* ─── Track Info ─── */
function TrackInfo() {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const openSheet = useTrackActionStore((s) => s.openSheet);
	const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);

	const openActions = useCallback(() => {
		if (!currentTrack) return;
		openSheet({
			id: currentTrack.trackId,
			title: currentTrack.title,
			artist: currentTrack.artist,
			cover: currentTrack.cover,
			duration: currentTrack.duration,
		});
	}, [currentTrack, openSheet]);

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		openActions();
	}, [openActions]);

	if (!currentTrack) return null;
	return (
		<div className="flex shrink-0 items-end gap-3 px-8 pb-5 md:px-0" onContextMenu={handleContextMenu}>
			<div className="relative min-w-0 flex-1">
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.div
						key={currentTrack.trackId}
						initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
						transition={{ duration: 0.45, ease: EASE_OUT }}
					>
						<p className="truncate text-2xl font-semibold tracking-tight text-balance md:text-4xl">
							{currentTrack.title}
						</p>
						<p className="mt-1 truncate text-base text-foreground/60 md:text-lg">
							{currentTrack.artistId ? (
								<Link
									href={`/artist?id=${currentTrack.artistId}`}
									onClick={() => setFullscreenOpen(false)}
									className="transition-colors hover:text-foreground hover:underline"
								>
									{currentTrack.artist}
								</Link>
							) : (
								currentTrack.artist
							)}
						</p>
					</motion.div>
				</AnimatePresence>
			</div>
			<button type="button" aria-label="Track actions" onClick={openActions} className={cn(iconBtn, "size-10 shrink-0")}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
					<circle cx="5" cy="12" r="1.8" />
					<circle cx="12" cy="12" r="1.8" />
					<circle cx="19" cy="12" r="1.8" />
				</svg>
			</button>
		</div>
	);
}

/* ─── Seek Section ─── */
function SeekSection() {
	const currentTime = usePlayerStore((s) => s.currentTime);
	const duration = usePlayerStore((s) => s.duration);
	const buffered = usePlayerStore((s) => s.buffered);
	const playing = usePlayerStore((s) => s.isPlaying && !s.isBuffering);
	return (
		<div className="shrink-0 px-8 md:px-0">
			<WaveSeek currentTime={currentTime} duration={duration} buffered={buffered} playing={playing} onSeek={seek} />
		</div>
	);
}

/* ─── Controls ─── */
function ToggleDot({ on }: { on: boolean }) {
	return (
		<motion.span
			aria-hidden
			className="absolute bottom-1 size-1 rounded-full bg-highlight"
			initial={false}
			animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
			transition={SPRING}
		/>
	);
}

function Controls({ level }: { level: MotionValue<number> }) {
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

	// The halo behind the play button swells with the music.
	const haloScale = useTransform(level, [0, 1], [1, 1.45]);
	const haloOpacity = useTransform(level, [0, 0.15, 1], [0, 0.25, 0.55]);

	return (
		<div className="flex shrink-0 items-center justify-between px-6 pt-4 pb-5 md:px-0">
			<motion.button
				type="button"
				aria-label="Shuffle"
				aria-pressed={shuffle}
				disabled={!hasQueue}
				whileTap={{ scale: 0.85 }}
				onClick={toggleShuffle}
				className={cn(iconBtn, "relative size-12 disabled:pointer-events-none disabled:opacity-30", shuffle && "text-highlight hover:text-highlight")}
			>
				<ShuffleGlyph active={shuffle} />
				<ToggleDot on={shuffle} />
			</motion.button>

			<motion.button
				type="button"
				aria-label="Previous track"
				whileTap={{ scale: 0.85, x: -4 }}
				onClick={prevTrack}
				className={cn(iconBtn, "size-14 text-foreground")}
			>
				<SkipGlyph dir="prev" className="size-7" />
			</motion.button>

			<div className="relative">
				<motion.span
					aria-hidden
					data-testid="play-halo"
					className="absolute inset-0 rounded-full bg-foreground"
					style={{ scale: haloScale, opacity: haloOpacity }}
				/>
				<motion.button
					type="button"
					aria-label={isPlaying ? "Pause" : "Play"}
					whileHover={{ scale: 1.04 }}
					whileTap={{ scale: 0.92 }}
					transition={SPRING}
					onClick={toggle}
					className="relative inline-flex size-[76px] items-center justify-center rounded-full bg-foreground text-background shadow-[0_12px_40px_-8px_rgb(0_0_0/0.5)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
				>
					{isPlaying && isBuffering ? (
						<Spinner size={28} />
					) : (
						<PlayPauseIcon playing={isPlaying} className="size-8" />
					)}
				</motion.button>
			</div>

			<motion.button
				type="button"
				aria-label="Next track"
				whileTap={{ scale: 0.85, x: 4 }}
				onClick={next}
				className={cn(iconBtn, "size-14 text-foreground")}
			>
				<SkipGlyph dir="next" className="size-7" />
			</motion.button>

			<motion.button
				type="button"
				aria-label={`Repeat ${repeat}`}
				aria-pressed={repeat !== "off"}
				disabled={!hasQueue}
				whileTap={{ scale: 0.85 }}
				onClick={toggleRepeat}
				className={cn(iconBtn, "relative size-12 disabled:pointer-events-none disabled:opacity-30", repeat !== "off" && "text-highlight hover:text-highlight")}
			>
				<RepeatGlyph mode={repeat} />
				<ToggleDot on={repeat !== "off"} />
			</motion.button>
		</div>
	);
}

/* ─── Volume + audio settings ─── */
function VolumeSection() {
	const volume = usePlayerStore((s) => s.volume);
	const setVolume = usePlayerStore((s) => s.setVolume);
	const toggleMute = usePlayerStore((s) => s.toggleMute);
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2">
			<button
				type="button"
				onClick={toggleMute}
				aria-label={volume === 0 ? "Unmute" : "Mute"}
				aria-pressed={volume === 0}
				className={cn(iconBtn, "size-9 shrink-0")}
			>
				<VolumeGlyph volume={volume} />
			</button>
			<div className="group/vol relative flex h-6 flex-1 items-center">
				<div className="relative h-1 w-full overflow-hidden rounded-full bg-foreground/15 transition-[height] duration-150 group-hover/vol:h-1.5">
					<div className="absolute inset-y-0 left-0 rounded-full bg-foreground/80" style={{ width: `${volume}%` }} />
				</div>
				<span
					aria-hidden
					className="pointer-events-none absolute size-3 -translate-x-1/2 scale-0 rounded-full bg-foreground shadow-sm transition-transform duration-150 group-hover/vol:scale-100"
					style={{ left: `${volume}%` }}
				/>
				<input
					type="range"
					min={0}
					max={100}
					value={volume}
					aria-label="Volume"
					onChange={(e) => setVolume(parseInt(e.target.value))}
					className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				/>
			</div>
		</div>
	);
}

function ExtraControls() {
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger aria-label="Audio settings" className={cn(iconBtn, "size-9 shrink-0")}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
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
				<DropdownMenuCheckboxItem checked={normalizationEnabled} onClick={toggleNormalization}>
					Loudness norm
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
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
	const audible = usePlayerStore((s) => s.isPlaying && !s.isBuffering);
	const dragControls = useDragControls();
	const lyricsVisible = useLyricsStore((s) => s.visible);
	const toggleLyrics = useLyricsStore((s) => s.toggleVisible);
	const setLyricsVisible = useLyricsStore((s) => s.setVisible);
	const fetchLyrics = useLyricsStore((s) => s.fetchLyrics);
	const level = useAudioLevel(fullscreenOpen && audible);

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
		_: unknown,
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
					className="fixed inset-0 z-[70] isolate flex flex-col overflow-hidden text-foreground"
				>
					<ImmersiveBackdrop cover={currentTrack.cover} level={level} />

					{/* Drag handle */}
					<div
						className="flex shrink-0 cursor-grab items-center justify-center pt-3 pb-1 active:cursor-grabbing"
						onPointerDown={(e) => dragControls.start(e)}
						role="button"
						aria-label="Drag down to close"
					>
						<motion.div
							className="h-1 w-10 rounded-full bg-foreground/25"
							animate={{ scaleX: [1, 1.15, 1] }}
							transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
						/>
					</div>

					{/* Header */}
					<div className="mx-auto flex w-full max-w-6xl shrink-0 items-center px-3 py-1 md:px-8">
						<button
							type="button"
							aria-label="Close fullscreen player"
							onClick={() => setFullscreenOpen(false)}
							className={cn(iconBtn, "size-11")}
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</button>
						<span className="flex flex-1 justify-center text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55">
							<SlideSwap id={lyricsVisible ? "lyrics" : "playing"}>{lyricsVisible ? "Lyrics" : "Now Playing"}</SlideSwap>
						</span>
						<div className="flex items-center gap-0.5">
							<KaraokeToggle className="h-11 w-11 px-0" iconSize={18} />
							{hasQueue && (
								<button
									type="button"
									aria-label="Open queue"
									className={cn(iconBtn, "size-11")}
									onClick={() => {
										setFullscreenOpen(false);
										if (lyricsVisible) setLyricsVisible(false);
										setQueuePanelOpen(true);
									}}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
										<line x1="8" y1="6" x2="21" y2="6" />
										<line x1="8" y1="12" x2="21" y2="12" />
										<line x1="8" y1="18" x2="21" y2="18" />
										<circle cx="3.5" cy="6" r="1.2" fill="currentColor" />
										<circle cx="3.5" cy="12" r="1.2" fill="currentColor" />
										<circle cx="3.5" cy="18" r="1.2" fill="currentColor" />
									</svg>
								</button>
							)}
							<button
								type="button"
								aria-label="Toggle lyrics"
								aria-pressed={lyricsVisible}
								className={cn(iconBtn, "size-11", lyricsVisible && "bg-foreground/10 text-foreground")}
								onClick={toggleLyrics}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
									<path d="M9 18V5l12-2v13" />
									<circle cx="6" cy="18" r="3" />
									<circle cx="18" cy="16" r="3" />
								</svg>
							</button>
						</div>
					</div>

					{/* Body — stacked on mobile, artwork | controls side by side on desktop */}
					<div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 md:px-12 md:pb-10 lg:gap-20 lg:px-16">
						<div className="flex min-h-0 flex-1 flex-col md:h-full">
							<AnimatePresence mode="wait" initial={false}>
								<motion.div
									key={lyricsVisible ? "lyrics" : "cover"}
									initial={{ opacity: 0, scale: 0.97 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.97 }}
									transition={{ duration: 0.25, ease: EASE_OUT }}
									className="flex min-h-0 flex-1 flex-col"
								>
									{lyricsVisible ? <LyricsDisplay compact /> : <CoverStage queue={queue} level={level} />}
								</motion.div>
							</AnimatePresence>
						</div>

						<div className="flex shrink-0 flex-col md:self-center">
							<TrackInfo />
							<div className="mb-3 h-9 shrink-0 px-8 md:px-0">
								<AudioVisualizer barCount={48} className="h-full text-foreground/70" />
							</div>
							<SeekSection />
							<Controls level={level} />
							<div className="flex shrink-0 items-center gap-2 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-0 md:pb-0">
								<VolumeSection />
								<ExtraControls />
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
