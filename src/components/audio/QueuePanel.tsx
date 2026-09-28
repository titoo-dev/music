"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "motion/react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { GripVertical, X, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/motion/icons";
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

	// Mobile-only drag-to-dismiss: scoped via useDragControls so only the top
	// handle bar starts a drag. Below 120px / 500px·s⁻¹ snaps back to the
	// resting position; above either threshold dismisses the panel.
	const dragControls = useDragControls();
	const handleDragEnd = (
		_: unknown,
		info: { offset: { y: number }; velocity: { y: number } }
	) => {
		if (info.offset.y > 120 || info.velocity.y > 500) {
			setOpen(false);
		}
	};

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
				? "1 track"
				: `${totalCount} tracks`;

	return (
		<AnimatePresence>
			{open && (
				<motion.aside
					key="queue-panel"
					initial={isDesktop ? { x: 24, opacity: 0, scale: 0.98 } : { y: "100%", opacity: 0 }}
					animate={isDesktop ? { x: 0, opacity: 1, scale: 1 } : { y: 0, opacity: 1 }}
					exit={isDesktop ? { x: 24, opacity: 0, scale: 0.98 } : { y: "100%", opacity: 0 }}
					transition={{ type: "spring", damping: 32, stiffness: 360 }}
					style={{ transformOrigin: "right center" }}
					drag={isDesktop ? false : "y"}
					dragControls={dragControls}
					dragListener={false}
					dragConstraints={{ top: 0, bottom: 0 }}
					dragElastic={{ top: 0, bottom: 0.4 }}
					onDragEnd={handleDragEnd}
					role="region"
					aria-label="Queue"
					className="fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-popover/95 glass text-popover-foreground shadow-popover
						inset-x-2 top-[calc(env(safe-area-inset-top,0px)+8px)] bottom-[calc(var(--player-h)+var(--player-offset)+8px)]
						md:inset-x-auto md:right-4 md:top-[calc(var(--header-h)+12px)] md:bottom-[calc(var(--player-h)+var(--player-offset)+12px)] md:w-[360px] md:rounded-xl"
				>
					{/* Drag handle (mobile only) — scoped drag surface, also signals "swipeable" */}
					{!isDesktop && (
						<div
							onPointerDown={(e) => dragControls.start(e)}
							role="button"
							aria-label="Drag down to close queue"
							className="flex shrink-0 items-center justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing touch-none"
						>
							<div className="h-1 w-10 rounded-full bg-foreground/20" />
						</div>
					)}

					{/* Header */}
					<div className="flex items-center gap-2 border-b border-border px-4 py-3">
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold tracking-tight">Queue</p>
							<p className="mt-0.5 truncate text-xs text-muted-foreground">
								{subtitle}
								{shuffle && " · Shuffled"}
							</p>
						</div>
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
								className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
								aria-label="Clear queue"
							>
								<Trash2 className="h-3.5 w-3.5" />
								Clear
							</button>
						)}
						<Button
							variant="ghost"
							size="icon-touch"
							onClick={() => setOpen(false)}
							aria-label="Close queue"
							className="-mr-1.5 rounded-full"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Body */}
					<ScrollArea className="flex-1 min-h-0">
						<div className="px-2 py-3 space-y-5">
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
											<span className="ml-1 font-normal text-muted-foreground/70">
												· playback in shuffled order
											</span>
										)}
									</SectionLabel>
									<Reorder.Group
										axis="y"
										values={upNext.map((t) => t.trackId)}
										onReorder={handleReorder}
										className="flex flex-col gap-0.5"
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
									<SectionLabel>
										Played
									</SectionLabel>
									<div className="flex flex-col gap-0.5">
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
								<EmptyState
									title="Nothing up next"
									description="Add tracks to fill your queue."
									className="mx-2 border-none py-10"
								/>
							)}
						</div>
					</ScrollArea>

					{/* Footer — mirrors LyricsPanel */}
					<div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
						<span className="tabular-nums">
							{upNext.length} up next · {played.length} played
						</span>
						<span className="text-muted-foreground/70">Drag to reorder</span>
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
				"mb-1.5 px-2 text-xs font-medium text-muted-foreground",
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
				"group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors select-none",
				active ? "bg-accent" : "hover:bg-accent/60",
				muted && "opacity-60",
				interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
			)}
		>
			{showHandle && (
				<div
					className="-mx-1 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground touch-none shrink-0"
					aria-hidden
				>
					<GripVertical className="h-4 w-4" />
				</div>
			)}

			<div className="relative shrink-0">
				<CoverImage
					src={track.cover}
					className="h-10 w-10 rounded-md"
				/>
				{active && (
					<div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/45 text-white">
						<PlaybackIndicator paused={!isPlaying} />
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate text-sm font-medium leading-tight",
						active && "text-foreground"
					)}
				>
					{track.title}
				</p>
				<p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
					{track.artist}
				</p>
			</div>

			{onRemove && (
				<Button
					variant="ghost"
					size="icon"
					aria-label={`Remove ${track.title} from queue`}
					className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
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
