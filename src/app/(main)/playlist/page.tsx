"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { convertDuration } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PreviewButton } from "@/components/audio/PreviewButton";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";
import { AddToPlaylist } from "@/components/playlists/AddToPlaylist";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

function getCoverUrl(hash: string, size = 500) {
	if (!hash) return "";
	if (hash.startsWith("http")) return hash;
	return `https://e-cdns-images.dzcdn.net/images/cover/${hash}/${size}x${size}-000000-80-0-0.jpg`;
}

function getArtistUrl(hash: string, size = 500) {
	if (!hash) return "";
	if (hash.startsWith("http")) return hash;
	return `https://e-cdns-images.dzcdn.net/images/artist/${hash}/${size}x${size}-000000-80-0-0.jpg`;
}

function PlaylistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [playlist, setPlaylist] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { download, isLoading } = useDownload();

	const allTrackIds = tracks.map((t: any) => String(t.id || t.SNG_ID)).filter(Boolean);
	const { downloaded, markDownloaded } = useDownloadedTracks(allTrackIds);

	useEffect(() => {
		if (!id) return;
		async function loadPlaylist() {
			try {
				const data = await fetchData("content/tracklist", { id, type: "playlist" });
				const playlistData = data?.DATA || data;
				setPlaylist(playlistData);
				setTracks(data?.tracks || data?.SONGS?.data || []);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadPlaylist();
	}, [id]);

	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const playerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);

	const playlistUrl = `https://www.deezer.com/playlist/${id}`;
	const handleDownloadAll = () => download(playlistUrl);
	const trackUrl = (trackId: string) => `https://www.deezer.com/track/${trackId}`;
	const handleDownloadTrack = (trackId: string) => {
		download(trackUrl(trackId));
		markDownloaded(String(trackId));
	};

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	if (!playlist)
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-medium text-muted-foreground">Playlist not found</p>
				<p className="text-xs text-muted-foreground">The playlist you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
			</div>
		);

	const playlistCover =
		playlist.picture_xl ||
		playlist.picture_big ||
		playlist.picture_medium ||
		getCoverUrl(playlist.PLAYLIST_PICTURE, 500) ||
		"/placeholder.jpg";

	const playlistTitle = playlist.title || playlist.TITLE || "Playlist";

	return (
		<div className="space-y-8">
			{/* Playlist Header */}
			<div className="flex flex-col md:flex-row gap-8">
				<CoverImage
					src={playlistCover}
					alt={playlistTitle}
					className="w-48 h-48 rounded-lg flex-shrink-0"
				/>
				<div className="flex flex-col justify-end gap-3">
					<p className="text-xs font-medium text-muted-foreground">Playlist</p>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						{playlistTitle}
					</h1>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						{playlist.creator && <span>By {playlist.creator?.name}</span>}
						{(playlist.nb_tracks || tracks.length > 0) && (
							<>
								{playlist.creator && <span className="text-border">·</span>}
								<span>{playlist.nb_tracks || tracks.length} tracks</span>
							</>
						)}
					</div>
					<Button onClick={handleDownloadAll} disabled={isLoading(playlistUrl)} className="w-fit mt-1 gap-2">
						{isLoading(playlistUrl) && <Loader2 className="size-4 animate-spin" />}
						{isLoading(playlistUrl) ? "Adding..." : "Download playlist"}
					</Button>
				</div>
			</div>

			<Separator />

			{/* Tracklist */}
			<div>
				<h2 className="text-xs font-medium text-muted-foreground mb-4">
					Tracklist
				</h2>
				{tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<p className="text-sm font-medium text-muted-foreground">No tracks</p>
						<p className="text-xs text-muted-foreground">The tracklist for this playlist is unavailable.</p>
					</div>
				) : (
				<div className="rounded-lg border border-border overflow-hidden">
					{tracks.map((track: any, idx: number) => {
						const trackId = track.id || track.SNG_ID;
						const trackTitle = track.title || track.SNG_TITLE;
						const trackArtist = track.artist?.name || track.ART_NAME;
						const trackDuration = track.duration || track.DURATION || 0;
						const trackCover =
							track.album?.cover_small ||
							getCoverUrl(track.ALB_PICTURE, 56);
						const previewUrl = (track.MEDIA?.[0]?.HREF || track.preview || "").replace("http://", "https://");
						const isPreviewActive = previewTrack?.id === String(trackId) && previewPlaying;
						const isPlayerActive = playerTrack?.trackId === String(trackId) && playerPlaying;
						const isActive = isPreviewActive || isPlayerActive;
						const isPaused = (previewTrack?.id === String(trackId) && !previewPlaying) || (playerTrack?.trackId === String(trackId) && !playerPlaying);

						return (
							<div
								key={trackId || idx}
								className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${isActive || isPaused ? "bg-primary/5" : "hover:bg-muted"} group`}
							>
								<span className="w-6 text-right tabular-nums flex items-center justify-end">
									{isActive || isPaused ? (
										<PlaybackIndicator paused={isPaused} />
									) : (
										<span className="text-xs text-muted-foreground">{idx + 1}</span>
									)}
								</span>
								<CoverImage src={trackCover} className="w-10 h-10 rounded flex-shrink-0" />
								<div className="flex-1 min-w-0">
									<p className={`text-sm font-medium truncate ${isActive || isPaused ? "text-primary" : "text-foreground"}`}>
										{trackTitle}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{trackArtist}
									</p>
								</div>
								<span className="text-xs text-muted-foreground tabular-nums">
									{convertDuration(trackDuration)}
								</span>
								<PreviewButton
									track={{
										id: trackId,
										title: trackTitle,
										artist: trackArtist,
										cover: trackCover || "",
										previewUrl,
									}}
								/>
								{downloaded.has(String(trackId)) ? (
									<span className="flex items-center justify-center size-7 text-emerald-500" title="Already downloaded">
										<CheckCircle2 className="size-3.5" />
									</span>
								) : (
									<Button
										variant="ghost"
										size="xs"
										onClick={() => handleDownloadTrack(trackId)}
										disabled={isLoading(trackUrl(trackId))}
										className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5"
									>
										{isLoading(trackUrl(trackId)) && <Loader2 className="size-3 animate-spin" />}
										{isLoading(trackUrl(trackId)) ? "Adding..." : "Download"}
									</Button>
								)}
								<AddToPlaylist
									track={{
										trackId: String(trackId),
										title: trackTitle,
										artist: trackArtist,
										coverUrl: trackCover,
										duration: trackDuration ? Number(trackDuration) : null,
									}}
									className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
								/>
							</div>
						);
					})}
				</div>
				)}
			</div>
		</div>
	);
}

export default function PlaylistPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<PlaylistContent />
		</Suspense>
	);
}
