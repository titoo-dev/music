"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Disc3, Trash2, Play, Pause, ArrowDownUp } from "lucide-react";
import Link from "next/link";
import { PlayButton } from "@/components/audio/PlayButton";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { longPressHandlers } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { preloadTrack } from "@/components/audio/AudioEngine";
import { useUserPreferences } from "@/hooks/useUserPreferences";

function PlayAllButton({ queue }: { queue: PlayerTrack[] }) {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const play = usePlayerStore((s) => s.play);
	const pause = usePlayerStore((s) => s.pause);
	const resume = usePlayerStore((s) => s.resume);

	const isQueuePlaying = queue.some((t) => t.trackId === currentTrack?.trackId) && isPlaying;
	const isQueuePaused = queue.some((t) => t.trackId === currentTrack?.trackId) && !isPlaying;

	return (
		<Button
			size="sm"
			className="gap-1.5"
			onClick={() => {
				if (isQueuePlaying) {
					pause();
				} else if (isQueuePaused) {
					resume();
				} else {
					play(queue[0], queue);
				}
			}}
		>
			{isQueuePlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
			{isQueuePlaying ? "Pause" : "Play all"}
		</Button>
	);
}

interface AlbumTrack {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	coverUrl: string | null;
	duration: number | null;
	fileSize: number | null;
}

interface AlbumDetail {
	id: string;
	deezerAlbumId: string;
	title: string;
	artist: string;
	coverUrl: string | null;
	trackCount: number;
	downloadedAt: string;
	tracks: AlbumTrack[];
}

export default function AlbumDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [album, setAlbum] = useState<AlbumDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const { prefs, updatePrefs } = useUserPreferences();
	const sortOrder = prefs.albumSortOrder ?? "asc";
	const setSortOrder = (order: "asc" | "desc") => updatePrefs({ albumSortOrder: order });
	const openSheet = useTrackActionStore((s) => s.openSheet);
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);
	const stopPlayer = usePlayerStore((s) => s.stop);

	const handleDelete = async () => {
		if (!album) return;
		// Stop player if it's playing a track from this album
		if (currentPlayerTrack && album.tracks.some((t) => t.trackId === currentPlayerTrack.trackId)) {
			stopPlayer();
		}
		setDeleting(true);
		try {
			const res = await fetch(`/api/v1/albums/${album.id}`, { method: "DELETE" });
			const json = await res.json();
			if (json.success) {
				router.push("/");
			}
		} catch {
			// ignore
		}
		setDeleting(false);
		setDeleteDialogOpen(false);
	};

	useEffect(() => {
		if (!isAuthenticated || !params.id) {
			setLoading(false);
			return;
		}
		async function load() {
			try {
				const res = await fetch(`/api/v1/albums/${params.id}`);
				const json = await res.json();
				if (json.success) setAlbum(json.data);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		load();
	}, [params.id, isAuthenticated]);

	// Preload first few tracks for instant playback
	useEffect(() => {
		if (!album || album.tracks.length === 0) return;
		for (const track of album.tracks.slice(0, 3)) {
			preloadTrack(track.trackId);
		}
	}, [album]);

	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "";
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!album) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground font-bold">Album not found.</p>
				<Link href="/">
					<Button variant="outline">Back to home</Button>
				</Link>
			</div>
		);
	}

	const sortedTracks = sortOrder === "asc" ? album.tracks : [...album.tracks].reverse();

	const playerQueue: PlayerTrack[] = sortedTracks.map((t) => ({
		trackId: t.trackId,
		title: t.title,
		artist: t.artist,
		cover: t.coverUrl,
		duration: t.duration,
	}));

	return (
		<div className="space-y-8">
			{/* Album Header */}
			<div className="flex flex-col md:flex-row gap-8">
				<div className="flex items-start gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.push("/")}
						className="mt-1"
					>
						<ArrowLeft className="size-4" />
					</Button>
					<div className="w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0 overflow-hidden bg-muted border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] flex items-center justify-center">
						{album.coverUrl ? (
							<CoverImage
								src={album.coverUrl}
								alt={album.title}
								className="w-32 h-32 sm:w-48 sm:h-48"
							/>
						) : (
							<Disc3 className="size-12 text-muted-foreground/30" />
						)}
					</div>
				</div>
				<div className="flex flex-col justify-end gap-3">
					<Badge variant="secondary" className="w-fit">
						Album
					</Badge>
					<h1 className="text-brutal-lg">
						{album.title}
					</h1>
					<div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
						<span>{album.artist}</span>
						<span className="text-border">·</span>
						<span className="font-mono">{album.tracks.length} track{album.tracks.length !== 1 ? "s" : ""}</span>
					</div>
					<div className="flex items-center gap-2 mt-1">
						{playerQueue.length > 0 && (
							<PlayAllButton queue={playerQueue} />
						)}
						<AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !deleting && setDeleteDialogOpen(open)}>
							<AlertDialogTrigger
								render={
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500"
									/>
								}
							>
								<Trash2 className="size-3.5" />
								Delete album
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete this album?</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently delete <strong>{album.title}</strong> and
										all its tracks from your library and storage. This action cannot
										be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDelete}
										className="bg-red-600 hover:bg-red-700"
										disabled={deleting}
									>
										{deleting && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			</div>

			<Separator />

			{/* Tracklist */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xs font-black text-foreground uppercase tracking-[0.15em]">
						Tracklist
					</h2>
					{album.tracks.length > 1 && (
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5"
							onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
						>
							<ArrowDownUp className="size-3.5" />
							{sortOrder === "asc" ? "Oldest first" : "Newest first"}
						</Button>
					)}
				</div>
				{album.tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<p className="text-sm text-muted-foreground font-bold uppercase">No tracks found.</p>
						<p className="text-xs text-muted-foreground">
							Tracks for this album may not have been saved correctly.
						</p>
					</div>
				) : (
					<div className="space-y-1">
						{sortedTracks.map((track, idx) => {
							const playerTrack: PlayerTrack = {
								trackId: track.trackId,
								title: track.title,
								artist: track.artist,
								cover: track.coverUrl,
								duration: track.duration,
							};
							const isActive = currentPlayerTrack?.trackId === track.trackId && playerPlaying;
							const isPaused = currentPlayerTrack?.trackId === track.trackId && !playerPlaying;
							const lp = longPressHandlers(() => {
								openSheet({
									id: track.trackId,
									title: track.title,
									artist: track.artist,
									cover: track.coverUrl || undefined,
									duration: track.duration || undefined,
								});
							});

							return (
								<div
									key={track.id}
									{...lp}
									className={`group flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 overflow-hidden transition-colors border-b-[2px] border-foreground last:border-b-0 select-none ${isActive || isPaused ? "bg-accent/20" : "hover:bg-accent/20"}`}
								>
									<PlayButton
										track={playerTrack}
										queue={playerQueue}
									/>
									<div className="relative shrink-0 size-9 sm:size-10 bg-muted">
										{track.coverUrl ? (
											<CoverImage
												src={track.coverUrl}
												alt={track.title}
												className={`size-10 ${isActive ? "opacity-50" : ""}`}
											/>
										) : (
											<div className="size-10 flex items-center justify-center text-xs text-muted-foreground">
												{idx + 1}
											</div>
										)}
										{(isActive || isPaused) && (
											<div className="absolute inset-0 flex items-center justify-center">
												<PlaybackIndicator paused={isPaused} />
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className={`text-sm font-bold truncate ${isActive || isPaused ? "text-primary" : ""}`}>
											{track.title}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{track.artist}
										</p>
									</div>
									<span className="hidden sm:inline text-xs text-muted-foreground font-mono shrink-0">
										{formatDuration(track.duration)}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
