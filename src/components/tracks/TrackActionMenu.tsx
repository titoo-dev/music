"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueueStore } from "@/stores/useQueueStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { useShareStore } from "@/stores/useShareStore";
import { ShareDialog } from "./ShareDialog";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	Download,
	ListEnd,
	ListPlus,
	ListStart,
	Play,
	Pause,
	Trash2,
	Disc3,
	User,
	CheckCircle2,
	Clock,
	Loader2,
	AlertTriangle,
	Share2,
	Link as LinkIcon,
	MoreHorizontal,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";

export interface TrackActionTrack {
	id: string;
	title: string;
	artist: string;
	cover?: string;
	duration?: number;
	albumId?: string;
	albumTitle?: string;
	artistId?: string;
	previewUrl?: string;
}

export interface TrackActionCallbacks {
	onDownload?: () => void;
	onDelete?: () => void;
}

function DownloadStatusIcon({ trackId }: { trackId: string }) {
	const queueItem = useQueueStore((s) => {
		const items = Object.values(s.queue);
		return items.find((item) => String(item.id) === trackId) || null;
	});
	const status = queueItem?.status;
	const progress = queueItem?.progress ?? 0;

	if (status === "completed")
		return <CheckCircle2 className="size-4" />;
	if (status === "downloading")
		return (
			<span className="text-[10px] font-mono font-bold text-primary tabular-nums">
				{Math.round(progress)}%
			</span>
		);
	if (status === "inQueue")
		return <Clock className="size-4 animate-pulse" />;
	if (status === "failed")
		return <AlertTriangle className="size-4 text-destructive" />;
	if (status === "withErrors")
		return <AlertTriangle className="size-4 text-primary" />;
	if (status === "cancelling")
		return <Loader2 className="size-4 animate-spin" />;
	return <Download className="size-4" />;
}

function DownloadStatusLabel({ trackId }: { trackId: string }) {
	const queueItem = useQueueStore((s) => {
		const items = Object.values(s.queue);
		return items.find((item) => String(item.id) === trackId) || null;
	});
	const status = queueItem?.status;
	if (status === "completed") return "Downloaded";
	if (status === "downloading") return "Downloading…";
	if (status === "inQueue") return "In queue";
	if (status === "failed") return "Retry download";
	if (status === "withErrors") return "Done with errors";
	if (status === "cancelling") return "Cancelling…";
	return "Download";
}

interface Playlist {
	id: string;
	title: string;
	_count?: { tracks: number };
}

function AddToPlaylistSubmenu({ track, onClose }: { track: TrackActionTrack; onClose: () => void }) {
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [loading, setLoading] = useState(true);
	const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/v1/playlists", { credentials: "include" });
				const json = await res.json();
				if (json.success) {
					setPlaylists((json.data as Playlist[]).filter((p) => p.title !== "Downloads"));
				}
			} catch {
				// ignore
			}
			setLoading(false);
		})();
	}, []);

	const handleAdd = async (playlistId: string) => {
		if (addedTo.has(playlistId)) return;
		try {
			const res = await fetch(`/api/v1/playlists/${playlistId}/tracks`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					tracks: [
						{
							trackId: track.id,
							title: track.title,
							artist: track.artist,
							album: track.albumTitle || null,
							coverUrl: track.cover || null,
							duration: track.duration || null,
						},
					],
				}),
			});
			if (res.ok) {
				setAddedTo((prev) => new Set(prev).add(playlistId));
				setTimeout(onClose, 600);
			}
		} catch {
			// ignore
		}
	};

	if (loading) {
		return (
			<div className="px-3 py-3 flex items-center justify-center">
				<Loader2 className="size-4 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (playlists.length === 0) {
		return (
			<div className="px-3 py-2 text-[11px] font-mono text-muted-foreground uppercase tracking-[0.05em]">
				No playlists yet
			</div>
		);
	}

	return (
		<div className="max-h-[40vh] overflow-y-auto">
			{playlists.map((p) => (
				<DropdownMenuItem
					key={p.id}
					onClick={() => handleAdd(p.id)}
					className="flex items-center justify-between gap-3"
				>
					<span className="truncate text-[13px] font-bold">{p.title}</span>
					{addedTo.has(p.id) ? (
						<CheckCircle2 className="size-3.5 text-foreground shrink-0" />
					) : (
						<span className="font-mono text-[10px] text-muted-foreground shrink-0">
							{p._count?.tracks ?? 0}
						</span>
					)}
				</DropdownMenuItem>
			))}
		</div>
	);
}

interface TrackActionMenuProps {
	track: TrackActionTrack;
	callbacks?: TrackActionCallbacks;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	className?: string;
}

export function TrackActionMenu({
	track,
	callbacks = {},
	side = "bottom",
	align = "end",
	className = "",
}: TrackActionMenuProps) {
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<"main" | "playlists">("main");
	const [shareDialogOpen, setShareDialogOpen] = useState(false);

	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const sharedMap = useShareStore((s) => s.shared);
	const isShared = sharedMap.has(track.id);

	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const togglePreview = usePreviewStore((s) => s.toggle);
	const isPreviewActive = previewTrack?.id === track.id && previewPlaying;

	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const hasPlayerQueue = usePlayerStore((s) => s.queue.length > 0);

	useEffect(() => {
		if (!open) setView("main");
	}, [open]);

	const close = () => setOpen(false);

	const toPlayerTrack = useCallback(
		() => ({
			trackId: track.id,
			title: track.title,
			artist: track.artist,
			cover: track.cover ?? null,
			duration: track.duration ?? null,
		}),
		[track]
	);

	const handlePreview = () => {
		if (!track.previewUrl) return;
		togglePreview({
			id: track.id,
			title: track.title,
			artist: track.artist,
			cover: track.cover || "",
			previewUrl: track.previewUrl,
		});
		close();
	};

	const handlePlayNext = () => {
		usePlayerStore.getState().addNext(toPlayerTrack());
		close();
	};

	const handleAddToQueue = () => {
		usePlayerStore.getState().addToQueue(toPlayerTrack());
		close();
	};

	const handleDownload = () => {
		callbacks.onDownload?.();
		close();
	};

	const handleDelete = () => {
		callbacks.onDelete?.();
		close();
	};

	const handleShare = () => {
		setShareDialogOpen(true);
		close();
	};

	return (
		<>
			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuTrigger
					render={
						<button
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
							onPointerDown={(e) => e.stopPropagation()}
							aria-label="Track actions"
							className={`shrink-0 inline-flex items-center justify-center w-7 h-7 border-2 border-transparent text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-card transition-colors ${className}`}
						/>
					}
				>
					<MoreHorizontal className="size-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent
					side={side}
					align={align}
					className="w-64"
					onClick={(e) => e.stopPropagation()}
				>
					{view === "main" ? (
						<div>
							{/* Track header — dark brutalist */}
							<div className="px-3 py-3 bg-foreground text-background border-b-2 border-foreground">
								<p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-background/55 mb-1.5">
									TRACK ACTIONS
								</p>
								<p className="text-[13px] font-extrabold tracking-[-0.01em] truncate leading-tight">
									{track.title}
								</p>
								<p className="text-[10px] font-mono text-background/60 truncate uppercase tracking-[0.05em] mt-0.5">
									{track.artist}
								</p>
							</div>

							{track.previewUrl && (
								<DropdownMenuItem onClick={handlePreview} className="gap-2.5">
									{isPreviewActive ? <Pause className="size-4" /> : <Play className="size-4" />}
									{isPreviewActive ? "Pause preview" : "Play preview"}
								</DropdownMenuItem>
							)}

							{hasPlayerQueue && currentPlayerTrack?.trackId !== track.id && (
								<>
									<DropdownMenuItem onClick={handlePlayNext} className="gap-2.5">
										<ListStart className="size-4" />
										Play next
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleAddToQueue} className="gap-2.5">
										<ListEnd className="size-4" />
										Add to queue
									</DropdownMenuItem>
								</>
							)}

							{callbacks.onDownload && (
								<DropdownMenuItem onClick={handleDownload} className="gap-2.5">
									<DownloadStatusIcon trackId={track.id} />
									<DownloadStatusLabel trackId={track.id} />
								</DropdownMenuItem>
							)}

							{isAuthenticated && (
								<DropdownMenuItem
									className="gap-2.5"
									onClick={(e) => {
										e.preventDefault();
										setView("playlists");
									}}
								>
									<ListPlus className="size-4" />
									<span className="flex-1">Add to playlist</span>
									<ChevronRight className="size-3.5 text-muted-foreground" />
								</DropdownMenuItem>
							)}

							{isAuthenticated && (
								<DropdownMenuItem onClick={handleShare} className="gap-2.5">
									{isShared ? <LinkIcon className="size-4 text-primary" /> : <Share2 className="size-4" />}
									{isShared ? "Manage share" : "Share track"}
								</DropdownMenuItem>
							)}

							{(track.albumId || track.artistId) && <DropdownMenuSeparator />}

							{track.albumId && (
								<Link
									href={`/album?id=${track.albumId}`}
									onClick={close}
									className="no-underline"
								>
									<DropdownMenuItem className="gap-2.5">
										<Disc3 className="size-4" />
										<span className="truncate">{track.albumTitle || "Go to album"}</span>
									</DropdownMenuItem>
								</Link>
							)}

							{track.artistId && (
								<Link
									href={`/artist?id=${track.artistId}`}
									onClick={close}
									className="no-underline"
								>
									<DropdownMenuItem className="gap-2.5">
										<User className="size-4" />
										<span className="truncate">{track.artist}</span>
									</DropdownMenuItem>
								</Link>
							)}

							{callbacks.onDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleDelete}
										className="gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
									>
										<Trash2 className="size-4" />
										Remove
									</DropdownMenuItem>
								</>
							)}
						</div>
					) : (
						<div>
							<div className="flex items-center justify-between bg-foreground text-background border-b-2 border-foreground">
								<button
									onClick={(e) => {
										e.preventDefault();
										setView("main");
									}}
									className="flex items-center gap-2 px-3 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-background/70 hover:text-accent transition-colors"
								>
									← BACK
								</button>
								<span className="px-3 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-background/55">
									ADD TO PLAYLIST
								</span>
							</div>
							<AddToPlaylistSubmenu track={track} onClose={close} />
						</div>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<ShareDialog
				open={shareDialogOpen}
				onOpenChange={setShareDialogOpen}
				trackId={track.id}
				duration={track.duration}
			/>
		</>
	);
}
