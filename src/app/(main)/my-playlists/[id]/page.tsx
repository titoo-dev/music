"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDownload } from "@/hooks/useDownload";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { AddToPlaylist } from "@/components/playlists/AddToPlaylist";
import { Loader2, ArrowLeft, Download, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PlayButton } from "@/components/audio/PlayButton";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";

interface PlaylistTrack {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	coverUrl: string | null;
	duration: number | null;
	position: number;
}

interface PlaylistDetail {
	id: string;
	title: string;
	description: string | null;
	tracks: PlaylistTrack[];
}

export default function PlaylistDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const { download, isLoading } = useDownload();
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);

	const isDownloadsPlaylist = playlist?.title === "Downloads";

	const allTrackIds = playlist?.tracks.map((t) => t.trackId) || [];
	const { downloaded, markDownloaded } = useDownloadedTracks(allTrackIds);

	useEffect(() => {
		if (!isAuthenticated || !params.id) {
			setLoading(false);
			return;
		}
		async function load() {
			try {
				const res = await fetch(`/api/v1/playlists/${params.id}`);
				const json = await res.json();
				if (json.success) setPlaylist(json.data);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		load();
	}, [params.id, isAuthenticated]);

	const handleRemoveTrack = async (trackId: string) => {
		if (!playlist) return;
		try {
			await fetch(`/api/v1/playlists/${playlist.id}/tracks`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ trackIds: [trackId] }),
			});
			setPlaylist((prev) =>
				prev
					? { ...prev, tracks: prev.tracks.filter((t) => t.trackId !== trackId) }
					: null
			);
		} catch {
			// ignore
		}
	};

	const handleDownloadTrack = (trackId: string) => {
		download(`https://www.deezer.com/track/${trackId}`);
		markDownloaded(trackId);
	};

	const handleDownloadAll = () => {
		if (!playlist) return;
		for (const track of playlist.tracks) {
			download(`https://www.deezer.com/track/${track.trackId}`);
			markDownloaded(track.trackId);
		}
	};

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

	if (!playlist) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground">Playlist not found.</p>
				<Link href="/my-playlists">
					<Button variant="outline">Back to playlists</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.push("/my-playlists")}
				>
					<ArrowLeft className="size-4" />
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold tracking-tight">{playlist.title}</h1>
					{playlist.description && (
						<p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>
					)}
					<p className="text-xs text-muted-foreground mt-0.5">
						{playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
					</p>
				</div>
				{!isDownloadsPlaylist && playlist.tracks.length > 0 && !playlist.tracks.every((t) => downloaded.has(t.trackId)) && (
					<Button size="sm" className="gap-1.5" onClick={handleDownloadAll}>
						<Download className="size-4" />
						Download All
					</Button>
				)}
			</div>

			{playlist.tracks.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm text-muted-foreground">This playlist is empty.</p>
					<p className="text-xs text-muted-foreground">
						Add tracks from search results or album pages.
					</p>
				</div>
			) : (
				<div className="space-y-1">
					{playlist.tracks.map((track, idx) => {
						const trackUrl = `https://www.deezer.com/track/${track.trackId}`;
						const isTrackDownloaded = isDownloadsPlaylist || downloaded.has(track.trackId);
						const playerTrack: PlayerTrack = {
							trackId: track.trackId,
							title: track.title,
							artist: track.artist,
							cover: track.coverUrl,
							duration: track.duration,
						};
						const playerQueue: PlayerTrack[] = playlist.tracks
							.filter((t) => isDownloadsPlaylist || downloaded.has(t.trackId))
							.map((t) => ({
								trackId: t.trackId,
								title: t.title,
								artist: t.artist,
								cover: t.coverUrl,
								duration: t.duration,
							}));
						const isActive = currentPlayerTrack?.trackId === track.trackId && playerPlaying;
						const isPaused = currentPlayerTrack?.trackId === track.trackId && !playerPlaying;
						return (
							<div
								key={track.id}
								className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isActive || isPaused ? "bg-primary/5" : "hover:bg-muted/50"}`}
							>
								{isTrackDownloaded ? (
									<PlayButton
										track={playerTrack}
										queue={playerQueue}
										className=""
									/>
								) : (
									<span className="w-7 text-right text-xs text-muted-foreground shrink-0">
										{idx + 1}
									</span>
								)}
								<div className="relative shrink-0 size-10 rounded overflow-hidden bg-muted">
									{track.coverUrl ? (
										<CoverImage
											src={track.coverUrl}
											alt={track.title}
											className={`size-10 ${isActive ? "opacity-50" : ""}`}
										/>
									) : (
										<div className="size-10 flex items-center justify-center text-xs text-muted-foreground">
											?
										</div>
									)}
									{(isActive || isPaused) && (
										<div className="absolute inset-0 flex items-center justify-center">
											<PlaybackIndicator paused={isPaused} />
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className={`text-sm font-medium truncate ${isActive || isPaused ? "text-primary" : ""}`}>{track.title}</p>
									<p className="text-xs text-muted-foreground truncate">
										{track.artist}
										{track.album ? ` \u00B7 ${track.album}` : ""}
									</p>
								</div>
								<span className="text-xs text-muted-foreground shrink-0">
									{formatDuration(track.duration)}
								</span>
								<div className="flex gap-1 items-center">
									{isTrackDownloaded ? (
										<span className="flex items-center justify-center size-8 text-emerald-500" title="Already downloaded">
											<CheckCircle2 className="size-3.5" />
										</span>
									) : (
										<Button
											variant="ghost"
											size="icon"
											className="size-8"
											onClick={() => handleDownloadTrack(track.trackId)}
											disabled={isLoading(trackUrl)}
										>
											{isLoading(trackUrl) ? (
												<Loader2 className="size-3.5 animate-spin" />
											) : (
												<Download className="size-3.5" />
											)}
										</Button>
									)}
									<AddToPlaylist
										track={{
											trackId: track.trackId,
											title: track.title,
											artist: track.artist,
											album: track.album,
											coverUrl: track.coverUrl,
											duration: track.duration,
										}}
										className="size-8"
									/>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 text-muted-foreground hover:text-red-500"
										onClick={() => handleRemoveTrack(track.trackId)}
									>
										<Trash2 className="size-3.5" />
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
