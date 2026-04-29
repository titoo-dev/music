"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { GripVertical, X, Trash2, ListMusic } from "lucide-react";
import { PlaybackIndicator } from "./PlaybackIndicator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function QueuePanel() {
	const open = usePlayerStore((s) => s.queuePanelOpen);
	const setOpen = usePlayerStore((s) => s.setQueuePanelOpen);
	const queue = usePlayerStore((s) => s.queue);
	const queueIndex = usePlayerStore((s) => s.queueIndex);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const shuffle = usePlayerStore((s) => s.shuffle);
	const jumpToIndex = usePlayerStore((s) => s.jumpToIndex);
	const moveInQueue = usePlayerStore((s) => s.moveInQueue);
	const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
	const clearQueue = usePlayerStore((s) => s.clearQueue);
	const currentTrack = usePlayerStore((s) => s.currentTrack);

	const [isDesktop, setIsDesktop] = useState(() =>
		typeof window !== "undefined" &&
		window.matchMedia("(min-width: 768px)").matches
	);
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Close on Escape — match LyricsPanel ergonomics
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, setOpen]);

	if (!currentTrack) return null;

	const current = queueIndex >= 0 ? queue[queueIndex] : null;
	const played = queueIndex > 0 ? queue.slice(0, queueIndex) : [];
	const upNext = queueIndex >= 0 ? queue.slice(queueIndex + 1) : [];

	// Reorder.Group passes us the new order of trackIds. Diff against the
	// previous order to find the moved item, then call moveInQueue with
	// absolute indices (the panel only reorders the "Up Next" slice).
	const handleReorder = (newIds: string[]) => {
		const oldIds = upNext.map((t) => t.trackId);
		for (let i = 0; i < newIds.length; i++) {
			if (oldIds[i] !== newIds[i]) {
				const movedId = oldIds[i];
				const newPos = newIds.indexOf(movedId);
				if (newPos >= 0 && newPos !== i) {
					moveInQueue(queueIndex + 1 + i, queueIndex + 1 + newPos);
				}
				break;
			}
		}
	};

	const totalCount = queue.length;
	const subtitle =
		totalCount === 0
			? ""
			: totalCount === 1
				? "1 TRACK"
				: `${totalCount} TRACKS`;

	return (
		<AnimatePresence>
			{open && (
				<motion.aside
					key="queue-panel"
					initial={isDesktop ? { x: 440, opacity: 0 } : { y: "100%", opacity: 0 }}
					animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
					exit={isDesktop ? { x: 440, opacity: 0 } : { y: "100%", opacity: 0 }}
					transition={{ type: "spring", damping: 28, stiffness: 280 }}
					role="region"
					aria-label="Queue"
					className="fixed z-40 flex flex-col bg-card border-foreground shadow-[-8px_0_0_rgba(13,13,13,0.06)]
						inset-x-0 bottom-[96px] top-[calc(env(safe-area-inset-top,0px)+4px)] border-l-0 border-t-[3px]
						md:inset-auto md:top-0 md:right-0 md:bottom-[96px] md:w-[420px] md:border-l-[3px] md:border-t-0"
				>
					{/* Header */}
					<div className="flex items-center gap-3 px-[18px] py-3.5 border-b-[3px] border-foreground bg-background">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground bg-primary text-white">
							<ListMusic className="h-5 w-5" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">
								UP NEXT · QUEUE
							</p>
							<p className="text-[14px] font-extrabold tracking-[-0.01em] truncate leading-tight mt-0.5">
								{currentTrack.title}
							</p>
							<p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
								{currentTrack.artist}
							</p>
						</div>
						<button
							onClick={() => setOpen(false)}
							aria-label="Close queue"
							className="w-8 h-8 border-2 border-foreground bg-card hover:bg-accent flex items-center justify-center font-mono text-base font-extrabold leading-none shrink-0 transition-colors"
						>
							×
						</button>
					</div>

					{/* Stats strip — matches LyricsPanel "progress strip" */}
					<div className="flex justify-between items-center px-[18px] py-2 border-b-2 border-foreground bg-card font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
						<span>
							{subtitle}
							{shuffle && " · SHUFFLED"}
						</span>
						{queue.length > 1 && (
							<button
								type="button"
								onClick={() => {
									const removed = queue.length - 1;
									clearQueue();
									toast.success(
										`Cleared ${removed} ${removed === 1 ? "track" : "tracks"} from queue`,
										{ duration: 3000 }
									);
								}}
								className="flex items-center gap-1 hover:text-destructive transition-colors"
								aria-label="Clear queue"
							>
								<Trash2 className="h-3 w-3" />
								CLEAR
							</button>
						)}
					</div>

					{/* Body */}
					<ScrollArea className="flex-1 min-h-0 bg-card">
						<div className="px-3 py-4 space-y-5">
							{current && (
								<section>
									<SectionLabel>Now Playing</SectionLabel>
									<QueueRow
										track={current}
										active
										isPlaying={isPlaying}
									/>
								</section>
							)}

							{upNext.length > 0 && (
								<section>
									<SectionLabel>
										Up Next
										{shuffle && (
											<span className="ml-2 text-[9px] text-muted-foreground tracking-normal normal-case font-normal">
												· playback in shuffled order
											</span>
										)}
									</SectionLabel>
									<Reorder.Group
										axis="y"
										values={upNext.map((t) => t.trackId)}
										onReorder={handleReorder}
										className="flex flex-col gap-1"
									>
										{upNext.map((track, i) => (
											<Reorder.Item
												key={track.trackId}
												value={track.trackId}
												className="cursor-grab active:cursor-grabbing"
											>
												<QueueRow
													track={track}
													onJump={() => jumpToIndex(queueIndex + 1 + i)}
													onRemove={() => removeFromQueue(queueIndex + 1 + i)}
													showHandle
												/>
											</Reorder.Item>
										))}
									</Reorder.Group>
								</section>
							)}

							{played.length > 0 && (
								<section>
									<SectionLabel className="text-muted-foreground">
										Played
									</SectionLabel>
									<div className="flex flex-col gap-1">
										{played.map((track, i) => (
											<QueueRow
												key={`played-${i}-${track.trackId}`}
												track={track}
												onJump={() => jumpToIndex(i)}
												muted
											/>
										))}
									</div>
								</section>
							)}

							{queue.length <= 1 && (
								<div className="text-center py-12 text-sm text-muted-foreground">
									<ListMusic className="h-8 w-8 mx-auto mb-3 opacity-30" />
									<p className="font-bold uppercase tracking-wider text-[11px]">
										Nothing up next
									</p>
									<p className="mt-1 text-[11px]">
										Add tracks to fill your queue.
									</p>
								</div>
							)}
						</div>
					</ScrollArea>

					{/* Footer — mirrors LyricsPanel */}
					<div className="px-[18px] py-2.5 border-t-2 border-foreground bg-foreground text-background flex justify-between items-center font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
						<span>
							{upNext.length} UP · {played.length} PLAYED
						</span>
						<span className="opacity-70">DRAG TO REORDER</span>
					</div>
				</motion.aside>
			)}
		</AnimatePresence>
	);
}

function SectionLabel({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<h3
			className={cn(
				"mb-2 px-2 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-foreground",
				className
			)}
		>
			{children}
		</h3>
	);
}

interface QueueRowProps {
	track: PlayerTrack;
	active?: boolean;
	isPlaying?: boolean;
	muted?: boolean;
	showHandle?: boolean;
	onJump?: () => void;
	onRemove?: () => void;
}

function QueueRow({
	track,
	active,
	isPlaying,
	muted,
	showHandle,
	onJump,
	onRemove,
}: QueueRowProps) {
	const interactive = !!onJump;
	return (
		<div
			role={interactive ? "button" : undefined}
			tabIndex={interactive ? 0 : undefined}
			onClick={interactive ? onJump : undefined}
			onKeyDown={
				interactive
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onJump?.();
							}
						}
					: undefined
			}
			className={cn(
				"group flex items-center gap-2 rounded-sm px-2 py-2 transition-colors select-none",
				active
					? "bg-accent border-2 border-foreground shadow-[var(--shadow-brutal-sm)]"
					: "border-2 border-transparent hover:bg-accent/50",
				muted && "opacity-60",
				interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			)}
		>
			{showHandle && (
				<div
					className="text-muted-foreground/40 group-hover:text-muted-foreground touch-none shrink-0"
					aria-hidden
				>
					<GripVertical className="h-4 w-4" />
				</div>
			)}

			<div className="relative shrink-0">
				<CoverImage
					src={track.cover}
					className="h-10 w-10 border-2 border-foreground"
				/>
				{active && (
					<div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
						<PlaybackIndicator paused={!isPlaying} />
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate text-[13px] font-bold leading-tight",
						active && "text-primary"
					)}
				>
					{track.title}
				</p>
				<p className="truncate text-[11px] text-muted-foreground leading-tight font-medium mt-0.5">
					{track.artist}
				</p>
			</div>

			{onRemove && (
				<Button
					variant="ghost"
					size="icon"
					aria-label={`Remove ${track.title} from queue`}
					className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			)}
		</div>
	);
}
