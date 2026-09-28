"use client";

import { useState, useEffect, useCallback } from "react";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { useShareStore } from "@/stores/useShareStore";
import { useSavedTracks } from "@/hooks/useLibrary";
import { ShareDialog } from "./ShareDialog";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoverImage } from "@/components/ui/cover-image";
import {
	ListEnd,
	ListPlus,
	ListStart,
	Trash2,
	Disc3,
	User,
	ArrowLeft,
	Plus,
	Share2,
	Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { DrawCheck, HeartGlyph, PlayPauseIcon, Spinner } from "@/components/motion/icons";

function formatDuration(seconds?: number | null) {
	if (!seconds) return null;
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function SaveActionRow({
	track,
	onDone,
}: {
	track: import("@/stores/useTrackActionStore").TrackActionInfo;
	onDone: () => void;
}) {
	const { isSaved, save, unsave } = useSavedTracks([track.id]);
	const saved = isSaved(track.id);

	const handle = async () => {
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
			// optimistic update reverts
		}
		onDone();
	};

	return (
		<ActionRow
			icon={
				<HeartGlyph filled={saved} className={saved ? "text-foreground" : ""} />
			}
			label={saved ? "Remove from library" : "Save to library"}
			onClick={handle}
		/>
	);
}

interface Playlist {
	id: string;
	title: string;
	_count?: { tracks: number };
	containsTrack?: boolean;
}

function PlaylistPicker({
	trackId,
	onBack,
	onDone,
}: {
	trackId: string;
	onBack: () => void;
	onDone: () => void;
}) {
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [loading, setLoading] = useState(true);
	const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const track = useTrackActionStore((s) => s.track);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch(
					`/api/v1/playlists?trackId=${encodeURIComponent(trackId)}`,
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
		}
		load();
	}, [trackId]);

	const handleAdd = async (playlistId: string) => {
		if (!track || addedTo.has(playlistId)) return;
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
				if (navigator.vibrate) navigator.vibrate(30);
			}
		} catch {
			// ignore
		}
	};

	const handleCreate = async () => {
		const name = newName.trim();
		if (!name) return;
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
				const newPlaylist = json.data as Playlist;
				setPlaylists((prev) => [newPlaylist, ...prev]);
				await handleAdd(newPlaylist.id);
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
			<button
				onClick={onBack}
				className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-accent"
			>
				<ArrowLeft className="size-4" />
				Back
			</button>

			<div className="border-t border-border">
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Spinner size={20} className="text-muted-foreground" />
					</div>
				) : playlists.length === 0 && !creating ? (
					<div className="px-4 py-8 text-center">
						<p className="text-sm text-muted-foreground">
							No playlists yet
						</p>
					</div>
				) : (
					<div className="max-h-[40vh] overflow-y-auto px-2 py-1">
						{playlists.map((p) => (
							<button
								key={p.id}
								onClick={() => handleAdd(p.id)}
								className="flex items-center justify-between w-full rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent active:bg-accent"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium truncate">{p.title}</p>
									{p._count?.tracks != null && (
										<p className="text-xs text-muted-foreground tabular-nums">
											{p._count.tracks} tracks
										</p>
									)}
								</div>
								{addedTo.has(p.id) && (
									<DrawCheck className="size-4 text-success shrink-0" />
								)}
							</button>
						))}
					</div>
				)}

				{/* New playlist */}
				{creating ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleCreate();
						}}
						className="flex items-center gap-2 px-4 py-3 border-t border-border"
					>
						<Input
							autoFocus
							placeholder="Playlist name"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="flex-1 h-9"
						/>
						<Button
							type="submit"
							size="sm"
							disabled={!newName.trim() || submitting}
						>
							{submitting ? (
								<Spinner size={14} />
							) : (
								"Create"
							)}
						</Button>
					</form>
				) : (
					<button
						onClick={() => setCreating(true)}
						className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-accent border-t border-border"
					>
						<Plus className="size-4" />
						New playlist
					</button>
				)}
			</div>
		</div>
	);
}

export function TrackActionSheet() {
	const open = useTrackActionStore((s) => s.open);
	const track = useTrackActionStore((s) => s.track);
	const callbacks = useTrackActionStore((s) => s.callbacks);
	const closeSheet = useTrackActionStore((s) => s.closeSheet);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const sharedMap = useShareStore((s) => s.shared);

	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const togglePreview = usePreviewStore((s) => s.toggle);

	const [view, setView] = useState<"actions" | "playlists">("actions");
	const [shareDialogOpen, setShareDialogOpen] = useState(false);

	// Reset view when sheet opens
	useEffect(() => {
		if (open) setView("actions");
	}, [open]);

	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const hasPlayerQueue = usePlayerStore((s) => s.queue.length > 0);

	const isPreviewActive =
		track && previewTrack?.id === track.id && previewPlaying;

	const handlePreview = useCallback(() => {
		if (!track?.previewUrl) return;
		togglePreview({
			id: track.id,
			title: track.title,
			artist: track.artist,
			artistId: track.artistId ?? null,
			cover: track.cover || "",
			previewUrl: track.previewUrl,
		});
	}, [track, togglePreview]);

	const toPlayerTrack = useCallback(() => {
		if (!track) return null;
		return {
			trackId: track.id,
			title: track.title,
			artist: track.artist,
			artistId: track.artistId ?? null,
			cover: track.cover ?? null,
			duration: track.duration ?? null,
		};
	}, [track]);

	const handlePlayNext = useCallback(() => {
		const pt = toPlayerTrack();
		if (!pt) return;
		usePlayerStore.getState().addNext(pt);
		closeSheet();
	}, [toPlayerTrack, closeSheet]);

	const handleAddToQueue = useCallback(() => {
		const pt = toPlayerTrack();
		if (!pt) return;
		usePlayerStore.getState().addToQueue(pt);
		closeSheet();
	}, [toPlayerTrack, closeSheet]);

	const handleDelete = useCallback(() => {
		callbacks.onDelete?.();
		closeSheet();
	}, [callbacks, closeSheet]);

	const isShared = track ? sharedMap.has(track.id) : false;

	const handleShare = useCallback(() => {
		if (!track) return;
		setShareDialogOpen(true);
	}, [track]);

	if (!track) return null;

	const durationStr = formatDuration(track.duration);

	return (
		<>
		<Sheet open={open} onOpenChange={(o) => !o && closeSheet()}>
			<SheetContent
				side="bottom"
				showCloseButton={false}
				className="gap-0 pb-[env(safe-area-inset-bottom)] max-h-[85vh] md:hidden"
			>
				<div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground/15" />
				{/* Track Header */}
				<SheetHeader className="border-b border-border">
					<div className="flex items-center gap-3">
						<CoverImage
							src={track.cover}
							className="size-12 shrink-0 rounded-md"
						/>
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate text-sm">
								{track.title}
							</SheetTitle>
							<SheetDescription className="truncate text-xs">
								{track.artist}
								{durationStr ? ` · ${durationStr}` : ""}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{view === "actions" ? (
					<div className="flex flex-col px-2 py-2">
						{/* Preview */}
						{track.previewUrl && (
							<ActionRow
								icon={
									<PlayPauseIcon playing={!!isPreviewActive} />
								}
								label={isPreviewActive ? "Pause preview" : "Play preview"}
								onClick={handlePreview}
							/>
						)}

						{/* Play Next */}
						{hasPlayerQueue && currentPlayerTrack?.trackId !== track.id && (
							<ActionRow
								icon={<ListStart className="size-4" />}
								label="Play next"
								onClick={handlePlayNext}
							/>
						)}

						{/* Add to Queue */}
						{hasPlayerQueue && currentPlayerTrack?.trackId !== track.id && (
							<ActionRow
								icon={<ListEnd className="size-4" />}
								label="Add to queue"
								onClick={handleAddToQueue}
							/>
						)}

						{/* Save / unsave */}
						{isAuthenticated && (
							<SaveActionRow track={track} onDone={closeSheet} />
						)}

						{/* Add to Playlist */}
						{isAuthenticated && (
							<ActionRow
								icon={<ListPlus className="size-4" />}
								label="Add to playlist"
								onClick={() => setView("playlists")}
								chevron
							/>
						)}

						{/* Share */}
						{isAuthenticated && (
							<ActionRow
								icon={
									isShared ? (
										<LinkIcon className="size-4 text-highlight" />
									) : (
										<Share2 className="size-4" />
									)
								}
								label={isShared ? "Manage share link" : "Share track"}
								onClick={handleShare}
							/>
						)}

						{/* Go to Album */}
						{track.albumId && (
							<Link
								href={`/album?id=${track.albumId}`}
								onClick={closeSheet}
								className="no-underline"
							>
								<ActionRow
									icon={<Disc3 className="size-4" />}
									label={track.albumTitle || "Go to album"}
									sublabel={track.albumTitle ? "Go to album" : undefined}
								/>
							</Link>
						)}

						{/* Go to Artist */}
						{track.artistId && (
							<Link
								href={`/artist?id=${track.artistId}`}
								onClick={closeSheet}
								className="no-underline"
							>
								<ActionRow
									icon={<User className="size-4" />}
									label={track.artist}
									sublabel="Go to artist"
								/>
							</Link>
						)}

						{/* Delete */}
						{callbacks.onDelete && (
							<ActionRow
								icon={<Trash2 className="size-4 text-destructive" />}
								label="Remove from playlist"
								onClick={handleDelete}
								destructive
							/>
						)}
					</div>
				) : (
					<PlaylistPicker
						trackId={track.id}
						onBack={() => setView("actions")}
						onDone={closeSheet}
					/>
				)}
			</SheetContent>
		</Sheet>

		{track && (
			<ShareDialog
				open={shareDialogOpen}
				onOpenChange={setShareDialogOpen}
				trackId={track.id}
				duration={track.duration}
				onShared={closeSheet}
			/>
		)}
		</>
	);
}

function ActionRow({
	icon,
	label,
	sublabel,
	onClick,
	chevron,
	destructive,
}: {
	icon: React.ReactNode;
	label: React.ReactNode;
	sublabel?: string;
	onClick?: () => void;
	chevron?: boolean;
	destructive?: boolean;
}) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-3 rounded-lg px-2.5 py-3 w-full text-left transition-colors hover:bg-accent active:bg-accent ${
				destructive ? "text-destructive hover:bg-destructive/10 active:bg-destructive/10" : "text-foreground"
			}`}
		>
			<span className={`shrink-0 ${destructive ? "" : "text-muted-foreground"}`}>{icon}</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium truncate">{label}</p>
				{sublabel && (
					<p className="text-xs text-muted-foreground truncate">
						{sublabel}
					</p>
				)}
			</div>
			{chevron && (
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="shrink-0 text-muted-foreground"
				>
					<polyline points="9 18 15 12 9 6" />
				</svg>
			)}
		</button>
	);
}
