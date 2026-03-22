"use client";

import { memo, useEffect, useRef, useMemo } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Button } from "@/components/ui/button";
import { SeekBar } from "./SeekBar";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import type { PlayerTrack } from "@/stores/usePlayerStore";

function formatTime(seconds: number) {
	if (!seconds || !isFinite(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function seek(time: number) {
	(window as any).__deemixAudioSeek?.(time);
}

function hiRes(url: string | null | undefined) {
	return url?.replace(/\/\d+x\d+-/, "/1000x1000-") ?? null;
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
								src={hiRes(track.cover)}
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
	if (!currentTrack) return null;
	return (
		<div className="shrink-0 px-8 pb-3">
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
	return (
		<div className="shrink-0 px-8 group/seekbar">
			<SeekBar
				currentTime={currentTime}
				duration={duration}
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

			<Button variant="ghost" size="icon" className="h-14 w-14 text-foreground" onClick={prevTrack}>
				<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
					<rect x="2" y="4" width="3" height="16" rx="0" />
					<path d="M22 4L9 12L22 20V4Z" />
				</svg>
			</Button>

			<Button variant="secondary" size="icon" className="h-[72px] w-[72px] border-[3px]" onClick={toggle}>
				{isPlaying ? (
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

			<Button variant="ghost" size="icon" className="h-14 w-14 text-foreground" onClick={next}>
				<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
					<rect x="19" y="4" width="3" height="16" rx="0" />
					<path d="M2 4L15 12L2 20V4Z" />
				</svg>
			</Button>

			<Button
				variant="ghost"
				size="icon"
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

/* ─── Shell ─── */
/* Only subscribes to fullscreenOpen + currentTrack (for mount/unmount) */
export function FullscreenPlayer() {
	const fullscreenOpen = usePlayerStore((s) => s.fullscreenOpen);
	const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const queue = usePlayerStore((s) => s.queue);
	const dragControls = useDragControls();

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
					className="fixed inset-0 z-[60] flex flex-col bg-background md:hidden"
				>
					{/* Drag handle */}
					<div
						className="flex shrink-0 items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
						onPointerDown={(e) => dragControls.start(e)}
					>
						<div className="h-1.5 w-12 bg-foreground" />
					</div>

					{/* Header */}
					<div className="flex shrink-0 items-center border-b-2 border-foreground px-4 py-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9"
							onClick={() => setFullscreenOpen(false)}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</Button>
						<span className="brutal-label flex-1 text-center text-muted-foreground">
							Now Playing
						</span>
						<div className="w-9" />
					</div>

					<CoverCarousel queue={queue} />
					<TrackInfo />
					<SeekSection />
					<Controls />
				</motion.div>
			)}
		</AnimatePresence>
	);
}
