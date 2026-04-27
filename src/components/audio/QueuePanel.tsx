"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { Reorder } from "motion/react";
import { GripVertical, X, Trash2, ListMusic } from "lucide-react";
import { PlaybackIndicator } from "./PlaybackIndicator";
import { cn } from "@/lib/utils";

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
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="z-[70] flex flex-col p-0 sm:max-w-md w-full"
				showCloseButton={false}
			>
				<SheetHeader className="flex-row items-center justify-between gap-2 border-b-[3px] border-foreground bg-card px-4 py-3 space-y-0">
					<div className="flex items-center gap-2 min-w-0">
						<ListMusic className="h-4 w-4 shrink-0 text-foreground" />
						<div className="min-w-0">
							<SheetTitle className="text-sm">Up Next</SheetTitle>
							{subtitle && (
								<p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
									{subtitle}
								</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						{queue.length > 1 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearQueue}
								className="h-7 px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive"
								aria-label="Clear queue"
							>
								<Trash2 className="h-3 w-3 mr-1" />
								Clear
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							aria-label="Close queue"
							className="h-7 w-7"
							onClick={() => setOpen(false)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1">
					<div className="px-3 py-4 space-y-5">
						{/* Now Playing */}
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

						{/* Up Next */}
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

						{/* Played */}
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

						{queue.length === 0 && (
							<div className="text-center py-16 text-sm text-muted-foreground">
								<ListMusic className="h-8 w-8 mx-auto mb-3 opacity-30" />
								<p className="font-bold uppercase tracking-wider text-[11px]">
									Queue is empty
								</p>
								<p className="mt-1 text-[11px]">
									Play a track to start your queue.
								</p>
							</div>
						)}
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
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
