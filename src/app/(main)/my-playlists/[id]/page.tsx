"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDownload } from "@/hooks/useDownload";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Loader2, ArrowLeft, Download, ArrowDownUp } from "lucide-react";
import { TrackDownloadStatus } from "@/components/downloads/TrackDownloadStatus";
import Link from "next/link";
import { PlayButton } from "@/components/audio/PlayButton";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { longPressHandlers } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { preloadTrack } from "@/components/audio/AudioEngine";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePrefetch } from "@/hooks/usePrefetch";

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
	const { prefs, updatePrefs } = useUserPreferences();
	const sortOrder = prefs.playlistSortOrder ?? "asc";
	const setSortOrder = (order: "asc" | "desc") => updatePrefs({ playlistSortOrder: order });
	const { download, isLoading } = useDownload();
	const openSheet = useTrackActionStore((s) => s.openSheet);
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);
	const stopPlayer = usePlayerStore((s) => s.stop);

	const isDownloadsPlaylist = playlist?.title === "Downloads";

	const allTrackIds = playlist?.tracks.map((t) => t.trackId) || [];
	const { downloaded } = useDownloadedTracks(allTrackIds);

	// Background prefetch: cache all downloaded tracks into IndexedDB for instant playback
	const downloadedTrackIds = playlist?.tracks
		.filter((t) => isDownloadsPlaylist || downloaded.has(t.trackId))
		.map((t) => t.trackId) || [];
	usePrefetch(downloadedTrackIds);

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

	// Preload first playable tracks so playback starts instantly
	useEffect(() => {
		if (!playlist || playlist.tracks.length === 0) return;
		const playable = playlist.tracks
			.filter((t) => isDownloadsPlaylist || downloaded.has(t.trackId))
			.slice(0, 3);
		for (const track of playable) {
			preloadTrack(track.trackId);
		}
	}, [playlist, downloaded, isDownloadsPlaylist]);

	const handleRemoveTrack = async (trackId: string) => {
		if (!playlist) return;
		// Stop player if it's playing the track being removed
		if (currentPlayerTrack?.trackId === trackId) {
			stopPlayer();
		}
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
	};

	const handleDownloadAll = () => {
		if (!playlist) return;
		for (const track of playlist.tracks) {
			download(`https://www.deezer.com/track/${track.trackId}`);
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

	const sortedTracks = playlist
		? [...playlist.tracks].sort((a, b) =>
				sortOrder === "asc" ? a.position - b.position : b.position - a.position
			)
		: [];

	if (!playlist) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground font-bold">Playlist not found.</p>
				<Link href="/my-playlists">
					<Button variant="outline">Back to playlists</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3 min-w-0">
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					onClick={() => router.back()}
				>
					<ArrowLeft className="size-4" />
				</Button>
				<div className="flex-1 min-w-0">
					<h1 className="text-brutal-lg">{playlist.title}</h1>
					{playlist.description && (
						<p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>
					)}
					<p className="text-xs text-muted-foreground mt-0.5 font-mono font-bold">
						{playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{!isDownloadsPlaylist && playlist.tracks.length > 0 && !playlist.tracks.every((t) => downloaded.has(t.trackId)) && (
						<Button size="sm" className="gap-1.5" onClick={handleDownloadAll}>
							<Download className="size-4" />
							Download All
						</Button>
					)}
					{playlist.tracks.length > 1 && (
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
			</div>

			{playlist.tracks.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm text-muted-foreground font-bold uppercase">This playlist is empty.</p>
					<p className="text-xs text-muted-foreground font-bold uppercase">
						Add tracks from search results or album pages.
					</p>
				</div>
			) : (
				<div className="space-y-1">
					{sortedTracks.map((track, idx) => {
						const trackUrl = `https://www.deezer.com/track/${track.trackId}`;
						const isTrackDownloaded = isDownloadsPlaylist || downloaded.has(track.trackId);
						const playerTrack: PlayerTrack = {
							trackId: track.trackId,
							title: track.title,
							artist: track.artist,
							cover: track.coverUrl,
							duration: track.duration,
						};
						const playerQueue: PlayerTrack[] = sortedTracks
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
						const lp = longPressHandlers(() => {
							openSheet(
								{
									id: track.trackId,
									title: track.title,
									artist: track.artist,
									cover: track.coverUrl || undefined,
									duration: track.duration || undefined,
								},
								{
									onDownload: () => handleDownloadTrack(track.trackId),
									onDelete: () => handleRemoveTrack(track.trackId),
								}
							);
						});
						return (
							<div
								key={track.id}
								{...lp}
								className={`group flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 overflow-hidden transition-colors border-b-[2px] border-foreground last:border-b-0 select-none ${isActive || isPaused ? "bg-accent/20" : "hover:bg-accent/20"}`}
							>
								{isTrackDownloaded ? (
									<PlayButton
										track={playerTrack}
										queue={playerQueue}
										className=""
									/>
								) : (
									<span className="w-5 sm:w-7 text-right text-xs text-muted-foreground shrink-0 font-mono font-bold">
										{idx + 1}
									</span>
								)}
								<div className="relative shrink-0 size-9 sm:size-10 bg-muted">
									{track.coverUrl ? (
										<CoverImage
											src={track.coverUrl}
											alt={track.title}
											className={`size-9 sm:size-10 ${isActive ? "opacity-50" : ""}`}
										/>
									) : (
										<div className="size-9 sm:size-10 flex items-center justify-center text-xs text-muted-foreground">
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
									<p className={`text-sm font-bold truncate ${isActive || isPaused ? "text-primary" : ""}`}>{track.title}</p>
									<p className="text-xs text-muted-foreground truncate">
										{track.artist}
										{track.album ? ` \u00B7 ${track.album}` : ""}
									</p>
								</div>
								<span className="hidden sm:inline text-xs text-muted-foreground shrink-0 font-mono">
									{formatDuration(track.duration)}
								</span>
								<TrackDownloadStatus
									trackId={track.trackId}
									isAlreadyDownloaded={isTrackDownloaded}
									apiLoading={isLoading(trackUrl)}
									onDownload={() => handleDownloadTrack(track.trackId)}
								/>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
