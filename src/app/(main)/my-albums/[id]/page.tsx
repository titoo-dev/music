"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
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
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { preloadTrack } from "@/components/audio/AudioEngine";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePrefetch } from "@/hooks/usePrefetch";

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
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
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

	const handleRemoveTrack = async (trackId: string) => {
		if (!album) return;
		if (currentPlayerTrack?.trackId === trackId) {
			stopPlayer();
		}
		try {
			const res = await fetch(`/api/v1/albums/${album.id}/tracks`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ trackIds: [trackId] }),
			});
			const json = await res.json();
			if (json.success) {
				if (json.data.albumDeleted) {
					router.push("/");
				} else {
					setAlbum((prev) =>
						prev
							? { ...prev, tracks: prev.tracks.filter((t) => t.trackId !== trackId) }
							: null
					);
				}
			}
		} catch {
			// ignore
		}
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

	// Background prefetch: cache all album tracks into IndexedDB for instant playback
	const albumTrackIds = album?.tracks.map((t) => t.trackId) || [];
	usePrefetch(albumTrackIds);

	// Preload first few tracks for instant playback (in-memory Audio elements)
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
		<div className="space-y-10">
			{/* Album Hero */}
			<div>
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3 flex items-center gap-2">
					<button
						onClick={() => router.push("/")}
						className="inline-flex items-center justify-center w-5 h-5 hover:text-foreground transition-colors"
						aria-label="Back"
					>
						<ArrowLeft className="size-3.5" />
					</button>
					ALBUM · DOWNLOADED · {new Date(album.downloadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
				</p>
				<div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
					<div className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 flex-shrink-0 overflow-hidden bg-muted border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] flex items-center justify-center">
						{album.coverUrl ? (
							<CoverImage
								src={album.coverUrl}
								alt={album.title}
								className="w-full h-full"
							/>
						) : (
							<Disc3 className="size-12 text-muted-foreground/30" />
						)}
					</div>
					<div className="flex flex-col justify-end gap-3 min-w-0 flex-1">
						<h1 className="text-brutal-xl m-0">
							{album.title}<span className="text-primary">.</span>
						</h1>
						<div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[12px] font-mono font-bold uppercase tracking-[0.05em] text-muted-foreground">
							<span>BY <span className="text-primary">{album.artist}</span></span>
							<span className="text-border">·</span>
							<span>{album.tracks.length} TRACK{album.tracks.length !== 1 ? "S" : ""}</span>
							<span className="text-border">·</span>
							<span className="text-foreground">LOCAL</span>
						</div>
						<div className="flex items-center gap-2 flex-wrap mt-1">
						{playerQueue.length > 0 && (
							<PlayAllButton queue={playerQueue} />
						)}
						<AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !deleting && setDeleteDialogOpen(open)}>
							<AlertDialogTrigger
								render={
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive"
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
										className="bg-destructive hover:bg-destructive/90 text-white"
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
		</div>

		{/* Tracklist */}
		<div>
			<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
					<div className="flex items-baseline gap-3">
						<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
							TRACKLIST
						</h2>
						<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
							{album.tracks.length} TRACK{album.tracks.length !== 1 ? "S" : ""}
						</span>
					</div>
					{album.tracks.length > 1 && (
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 font-mono uppercase tracking-[0.1em]"
							onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
						>
							<ArrowDownUp className="size-3.5" />
							{sortOrder === "asc" ? "Oldest" : "Newest"}
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
					<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
						{/* Column header */}
						<div className="hidden sm:grid grid-cols-[36px_40px_1fr_auto_60px_28px] gap-3 items-center px-3 py-2 border-b-[2px] border-foreground font-mono text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
							<span className="text-right">#</span>
							<span />
							<span>TITLE / ARTIST</span>
							<span>FORMAT</span>
							<span className="text-right">TIME</span>
							<span />
						</div>
						{sortedTracks.map((track, idx) => {
							const t: TrackRowTrack = {
								trackId: track.trackId,
								title: track.title,
								artist: track.artist,
								album: album.title,
								albumId: album.id,
								cover: track.coverUrl,
								duration: track.duration,
								bitrateLabel: "LOCAL",
							};
							return (
								<TrackRow
									key={track.id}
									track={t}
									trackNumber={idx + 1}
									showBitrate
									showDuration
									onDelete={() => handleRemoveTrack(track.trackId)}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
