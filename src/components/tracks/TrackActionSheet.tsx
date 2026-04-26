"use client";

import { useState, useEffect, useCallback } from "react";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { useQueueStore } from "@/stores/useQueueStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { useShareStore } from "@/stores/useShareStore";
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
	ArrowLeft,
	Plus,
	Check,
	Share2,
	Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

function formatDuration(seconds?: number | null) {
	if (!seconds) return null;
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function DownloadStatusIcon({ trackId }: { trackId: string }) {
	const queueItem = useQueueStore((s) => {
		const items = Object.values(s.queue);
		return items.find((item) => String(item.id) === trackId) || null;
	});
	const status = queueItem?.status;
	const progress = queueItem?.progress ?? 0;

	if (status === "completed")
		return <CheckCircle2 className="size-4 text-foreground" />;
	if (status === "downloading")
		return (
			<span className="text-xs font-mono font-bold text-primary">
				{Math.round(progress)}%
			</span>
		);
	if (status === "inQueue")
		return <Clock className="size-4 text-muted-foreground animate-pulse" />;
	if (status === "failed")
		return <AlertTriangle className="size-4 text-destructive" />;
	if (status === "withErrors")
		return <AlertTriangle className="size-4 text-primary" />;
	if (status === "cancelling")
		return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
	return <Download className="size-4" />;
}

function DownloadStatusLabel({ trackId }: { trackId: string }) {
	const queueItem = useQueueStore((s) => {
		const items = Object.values(s.queue);
		return items.find((item) => String(item.id) === trackId) || null;
	});
	const status = queueItem?.status;

	if (status === "completed") return "Downloaded";
	if (status === "downloading") return "Downloading...";
	if (status === "inQueue") return "In queue";
	if (status === "failed") return "Failed — tap to retry";
	if (status === "withErrors") return "Done with errors";
	if (status === "cancelling") return "Cancelling...";
	return "Download";
}

interface Playlist {
	id: string;
	title: string;
	_count?: { tracks: number };
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
				const res = await fetch("/api/v1/playlists", {
					credentials: "include",
				});
				const json = await res.json();
				if (json.success) {
					setPlaylists(
						(json.data as Playlist[]).filter((p) => p.title !== "Downloads")
					);
				}
			} catch {
				// ignore
			}
			setLoading(false);
		}
		load();
	}, []);

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
				className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-muted-foreground active:bg-accent/20"
			>
				<ArrowLeft className="size-4" />
				Back
			</button>

			<div className="border-t-[2px] border-foreground">
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				) : playlists.length === 0 && !creating ? (
					<div className="px-4 py-8 text-center">
						<p className="text-sm text-muted-foreground font-bold">
							No playlists yet
						</p>
					</div>
				) : (
					<div className="max-h-[40vh] overflow-y-auto">
						{playlists.map((p) => (
							<button
								key={p.id}
								onClick={() => handleAdd(p.id)}
								className="flex items-center justify-between w-full px-4 py-3 text-left active:bg-accent/20 border-b border-foreground/10 last:border-b-0"
							>
								<div className="min-w-0">
									<p className="text-sm font-bold truncate">{p.title}</p>
									{p._count?.tracks != null && (
										<p className="text-[11px] text-muted-foreground font-mono">
											{p._count.tracks} tracks
										</p>
									)}
								</div>
								{addedTo.has(p.id) && (
									<Check className="size-4 text-foreground shrink-0" />
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
						className="flex items-center gap-2 px-4 py-3 border-t-[2px] border-foreground"
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
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								"Create"
							)}
						</Button>
					</form>
				) : (
					<button
						onClick={() => setCreating(true)}
						className="flex items-center gap-2 w-full px-4 py-3 text-sm font-bold text-muted-foreground active:bg-accent/20 border-t-[2px] border-foreground"
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

	const handleDownload = useCallback(() => {
		callbacks.onDownload?.();
		closeSheet();
	}, [callbacks, closeSheet]);

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
				className="pb-[env(safe-area-inset-bottom)] max-h-[85vh] md:hidden"
			>
				{/* Track Header */}
				<SheetHeader className="border-b-[2px] border-foreground">
					<div className="flex items-center gap-3">
						<CoverImage
							src={track.cover}
							className="size-12 shrink-0 rounded-sm"
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
					<div className="flex flex-col pb-2">
						{/* Preview */}
						{track.previewUrl && (
							<ActionRow
								icon={
									isPreviewActive ? (
										<Pause className="size-4" />
									) : (
										<Play className="size-4" />
									)
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

						{/* Download */}
						<ActionRow
							icon={<DownloadStatusIcon trackId={track.id} />}
							label={<DownloadStatusLabel trackId={track.id} />}
							onClick={handleDownload}
						/>

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
										<LinkIcon className="size-4 text-primary" />
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
			className={`flex items-center gap-3 px-4 py-3.5 w-full text-left active:bg-accent/20 transition-colors ${
				destructive ? "text-destructive" : "text-foreground"
			}`}
		>
			<span className="shrink-0">{icon}</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold truncate">{label}</p>
				{sublabel && (
					<p className="text-[11px] text-muted-foreground truncate">
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
					strokeWidth="2"
					className="shrink-0 text-muted-foreground"
				>
					<polyline points="9 18 15 12 9 6" />
				</svg>
			)}
		</button>
	);
}
