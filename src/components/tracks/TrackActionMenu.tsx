"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { useShareStore } from "@/stores/useShareStore";
import { useSavedTracks } from "@/hooks/useLibrary";
import { ShareDialog } from "./ShareDialog";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	Heart,
	ListEnd,
	ListPlus,
	ListStart,
	Play,
	Pause,
	Trash2,
	Disc3,
	User,
	CheckCircle2,
	Loader2,
	Share2,
	Link as LinkIcon,
	MoreHorizontal,
	ChevronRight,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
	/** Removal callback for context-specific deletes (e.g. remove from a playlist). */
	onDelete?: () => void;
}

interface Playlist {
	id: string;
	title: string;
	_count?: { tracks: number };
	containsTrack?: boolean;
}

function AddToPlaylistSubmenu({
	track,
	onClose,
}: {
	track: TrackActionTrack;
	onClose: () => void;
}) {
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [loading, setLoading] = useState(true);
	const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch(
					`/api/v1/playlists?trackId=${encodeURIComponent(track.id)}`,
					{ credentials: "include" },
				);
				const json = await res.json();
				if (json.success) {
					const data = json.data as Playlist[];
					setPlaylists(data);
					setAddedTo(
						new Set(data.filter((p) => p.containsTrack).map((p) => p.id)),
					);
				}
			} catch {
				// ignore
			}
			setLoading(false);
		})();
	}, [track.id]);

	const addTrackToPlaylist = async (playlistId: string) => {
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
						albumId: track.albumId || null,
						coverUrl: track.cover || null,
						duration: track.duration || null,
					},
				],
			}),
		});
		return res.ok;
	};

	const handleAdd = async (playlistId: string) => {
		if (addedTo.has(playlistId)) return;
		try {
			if (await addTrackToPlaylist(playlistId)) {
				setAddedTo((prev) => new Set(prev).add(playlistId));
				setTimeout(onClose, 600);
			}
		} catch {
			// ignore
		}
	};

	const handleCreate = async () => {
		const name = newName.trim();
		if (!name || submitting) return;
		setSubmitting(true);
		try {
			const res = await fetch("/api/v1/playlists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ title: name }),
			});
			const json = await res.json();
			if (json.success) {
				const created = json.data as Playlist;
				setPlaylists((prev) => [created, ...prev]);
				if (await addTrackToPlaylist(created.id)) {
					setAddedTo((prev) => new Set(prev).add(created.id));
					setTimeout(onClose, 600);
				}
				setNewName("");
				setCreating(false);
			}
		} catch {
			// ignore
		}
		setSubmitting(false);
	};

	return (
		<div className="flex flex-col">
			{loading ? (
				<div className="px-3 py-3 flex items-center justify-center">
					<Loader2 className="size-4 animate-spin text-muted-foreground" />
				</div>
			) : playlists.length === 0 && !creating ? (
				<div className="px-3 py-2 text-[11px] font-mono text-muted-foreground uppercase tracking-[0.05em]">
					No playlists yet
				</div>
			) : (
				<div className="max-h-[40vh] overflow-y-auto">
					{playlists.map((p) => {
						const inPlaylist = addedTo.has(p.id);
						return (
							<DropdownMenuItem
								key={p.id}
								closeOnClick={false}
								onClick={() => handleAdd(p.id)}
								className="flex items-center justify-between gap-3"
							>
								<span className="truncate text-[13px] font-bold">{p.title}</span>
								{inPlaylist ? (
									<CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
								) : (
									<span className="font-mono text-[10px] text-muted-foreground shrink-0">
										{p._count?.tracks ?? 0}
									</span>
								)}
							</DropdownMenuItem>
						);
					})}
				</div>
			)}

			{creating ? (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleCreate();
					}}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
					onKeyDownCapture={(e) => e.stopPropagation()}
					className="flex items-center gap-2 px-2 py-2 border-t-2 border-foreground"
				>
					<Input
						autoFocus
						placeholder="Playlist name"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						onKeyDown={(e) => {
							e.stopPropagation();
							if (e.key === "Escape") {
								e.preventDefault();
								setCreating(false);
								setNewName("");
							}
						}}
						className="flex-1 h-8 text-[13px]"
					/>
					<Button
						type="submit"
						size="sm"
						disabled={!newName.trim() || submitting}
						className="h-8"
					>
						{submitting ? <Loader2 className="size-3.5 animate-spin" /> : "Create"}
					</Button>
				</form>
			) : (
				<DropdownMenuItem
					closeOnClick={false}
					onClick={() => setCreating(true)}
					className="gap-2.5 border-t-2 border-foreground rounded-none"
				>
					<Plus className="size-4" />
					<span className="font-bold">New playlist</span>
				</DropdownMenuItem>
			)}
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

	const { isSaved, save, unsave } = useSavedTracks(
		isAuthenticated ? [track.id] : []
	);
	const saved = isSaved(track.id);

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

	const handleSave = async () => {
		try {
			if (saved) {
				await unsave(track.id);
			} else {
				await save({
					trackId: track.id,
					title: track.title,
					artist: track.artist,
					album: track.albumTitle ?? null,
					albumId: track.albumId ?? null,
					coverUrl: track.cover ?? null,
					duration: track.duration ?? null,
				});
			}
		} catch {
			// optimistic update will revert on its own
		}
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
							{/* Track header */}
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

							{isAuthenticated && (
								<DropdownMenuItem onClick={handleSave} className="gap-2.5">
									<Heart
										className={`size-4 ${saved ? "fill-primary text-primary" : ""}`}
									/>
									{saved ? "Remove from library" : "Save to library"}
								</DropdownMenuItem>
							)}

							{isAuthenticated && (
								<DropdownMenuItem
									className="gap-2.5"
									closeOnClick={false}
									onClick={() => setView("playlists")}
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
