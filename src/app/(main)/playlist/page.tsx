"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { convertDuration } from "@/utils/helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TrackDownloadStatus } from "@/components/downloads/TrackDownloadStatus";
import { CoverImage } from "@/components/ui/cover-image";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { longPressHandlers } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { getBitrateBadge } from "@/utils/track-format";
import { TrackActionMenu } from "@/components/tracks/TrackActionMenu";

function getCoverUrl(hash: string, size = 500) {
	if (!hash) return "";
	if (hash.startsWith("http")) return hash;
	return `https://e-cdns-images.dzcdn.net/images/cover/${hash}/${size}x${size}-000000-80-0-0.jpg`;
}

function PlaylistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [playlist, setPlaylist] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { download, isLoading } = useDownload();

	const allTrackIds = tracks.map((t: any) => String(t.id || t.SNG_ID)).filter(Boolean);
	const { downloaded } = useDownloadedTracks(allTrackIds);

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

	const openSheet = useTrackActionStore((s) => s.openSheet);
	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const playerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);

	const playlistUrl = `https://www.deezer.com/playlist/${id}`;
	const handleDownloadAll = () => download(playlistUrl);
	const trackUrl = (trackId: string) => `https://www.deezer.com/track/${trackId}`;
	const handleDownloadTrack = (trackId: string) => {
		download(trackUrl(trackId));
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
				<p className="text-sm font-bold uppercase text-muted-foreground">Playlist not found</p>
				<p className="text-xs font-bold uppercase text-muted-foreground">The playlist you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
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
		<div className="space-y-10">
			{/* Playlist Hero */}
			<div>
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					PLAYLIST{playlist.creator?.name ? ` · BY ${String(playlist.creator.name).toUpperCase()}` : " · PERSONAL"}
				</p>
				<div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
					<CoverImage
						src={playlistCover}
						alt={playlistTitle}
						className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] flex-shrink-0"
					/>
					<div className="flex flex-col justify-end gap-3 min-w-0 flex-1">
						<h1 className="text-brutal-xl m-0">
							{playlistTitle}<span className="text-primary">.</span>
						</h1>
						<div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[12px] font-mono font-bold uppercase tracking-[0.05em] text-muted-foreground">
							{playlist.creator?.name && (
								<>
									<span>BY <span className="text-primary">{playlist.creator.name}</span></span>
									<span className="text-border">·</span>
								</>
							)}
							<span>{playlist.nb_tracks || tracks.length} TRACKS</span>
						</div>
						<Button
							onClick={handleDownloadAll}
							disabled={isLoading(playlistUrl)}
							size="lg"
							className="w-fit mt-1 gap-2 font-mono uppercase tracking-[0.1em]"
						>
							{isLoading(playlistUrl) && <Loader2 className="size-4 animate-spin" />}
							{isLoading(playlistUrl) ? "Adding..." : "Download playlist"}
						</Button>
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
							{tracks.length} TRACK{tracks.length !== 1 ? "S" : ""}
						</span>
					</div>
				</div>
				{tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<p className="text-sm font-bold uppercase text-muted-foreground">No tracks</p>
						<p className="text-xs font-bold uppercase text-muted-foreground">The tracklist for this playlist is unavailable.</p>
					</div>
				) : (
				<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
					{/* Column header */}
					<div className="hidden sm:grid grid-cols-[28px_40px_1fr_auto_60px_64px] gap-3 items-center px-3 py-2 border-b-[2px] border-foreground font-mono text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
						<span className="text-right">#</span>
						<span />
						<span>TITLE / ARTIST</span>
						<span>FORMAT</span>
						<span className="text-right">TIME</span>
						<span />
					</div>
					{tracks.map((track: any, idx: number) => {
						const trackId = track.id || track.SNG_ID;
						const trackTitle = track.title || track.SNG_TITLE;
						const trackArtist = track.artist?.name || track.ART_NAME;
						const trackAlbumId = track.ALB_ID || track.album?.id;
						const trackAlbumTitle = track.ALB_TITLE || track.album?.title;
						const trackDuration = track.duration || track.DURATION || 0;
						const trackCover =
							track.album?.cover_small ||
							getCoverUrl(track.ALB_PICTURE, 56);
						const previewUrl = (track.MEDIA?.[0]?.HREF || track.preview || "").replace("http://", "https://");
						const isPreviewActive = previewTrack?.id === String(trackId) && previewPlaying;
						const isPlayerActive = playerTrack?.trackId === String(trackId) && playerPlaying;
						const isActive = isPreviewActive || isPlayerActive;
						const isPaused = (previewTrack?.id === String(trackId) && !previewPlaying) || (playerTrack?.trackId === String(trackId) && !playerPlaying);
						const trackArtistId = track.ART_ID || track.artist?.id;
						const bitrate = getBitrateBadge(track);
						const isFlac = bitrate === "FLAC";
						const lp = longPressHandlers(() => {
							openSheet(
								{
									id: String(trackId),
									title: trackTitle,
									artist: trackArtist,
									cover: trackCover || undefined,
									duration: trackDuration ? Number(trackDuration) : undefined,
									artistId: trackArtistId ? String(trackArtistId) : undefined,
									previewUrl: previewUrl || undefined,
								},
								{ onDownload: () => handleDownloadTrack(trackId) }
							);
						});

						return (
							<div
								key={trackId || idx}
								{...lp}
								className={`grid grid-cols-[28px_40px_1fr_auto_40px] sm:grid-cols-[28px_40px_1fr_auto_60px_64px] gap-2 sm:gap-3 items-center px-2 sm:px-3 py-2 sm:py-2.5 overflow-hidden border-b border-foreground/15 last:border-b-0 transition-colors select-none ${
									isActive || isPaused ? "bg-accent" : "hover:bg-foreground/5"
								} group`}
							>
								<span className="text-right tabular-nums flex items-center justify-end">
									{isActive || isPaused ? (
										<PlaybackIndicator paused={isPaused} />
									) : (
										<span className="text-[11px] font-mono font-bold text-muted-foreground">
											{String(idx + 1).padStart(2, "0")}
										</span>
									)}
								</span>
								<CoverImage src={trackCover} className="size-9 flex-shrink-0" />
								<div className="min-w-0">
									<p className={`text-[13px] font-bold tracking-[-0.005em] truncate leading-tight`}>
										{trackTitle}
									</p>
									<p className="text-[11px] text-muted-foreground truncate font-medium leading-tight mt-0.5">
										{trackArtistId ? (
											<Link href={`/artist?id=${trackArtistId}`} className="hover:underline hover:text-foreground transition-colors">
												{trackArtist}
											</Link>
										) : trackArtist}
										{trackAlbumTitle ? (
											<>
												{" · "}
												{trackAlbumId ? (
													<Link href={`/album?id=${trackAlbumId}`} className="hover:underline hover:text-foreground transition-colors">
														{trackAlbumTitle}
													</Link>
												) : trackAlbumTitle}
											</>
										) : ""}
									</p>
								</div>
								<span
									className={`font-mono text-[10px] font-black tracking-[0.05em] uppercase border-2 border-foreground px-1.5 py-0.5 ${
										isFlac ? "bg-accent text-foreground" : "bg-card text-muted-foreground"
									}`}
								>
									{bitrate}
								</span>
								<span className="hidden sm:inline text-[11px] font-mono text-muted-foreground tabular-nums text-right">
									{convertDuration(trackDuration)}
								</span>
								<div className="flex items-center justify-end gap-0.5">
									<TrackDownloadStatus
										trackId={trackId}
										isAlreadyDownloaded={downloaded.has(String(trackId))}
										apiLoading={isLoading(trackUrl(trackId))}
										onDownload={() => handleDownloadTrack(trackId)}
									/>
									<div className="hidden md:block">
										<TrackActionMenu
											track={{
												id: String(trackId),
												title: trackTitle,
												artist: trackArtist,
												cover: trackCover || undefined,
												duration: trackDuration ? Number(trackDuration) : undefined,
												albumId: trackAlbumId ? String(trackAlbumId) : undefined,
												albumTitle: trackAlbumTitle,
												artistId: trackArtistId ? String(trackArtistId) : undefined,
												previewUrl: previewUrl || undefined,
											}}
											callbacks={{ onDownload: () => handleDownloadTrack(trackId) }}
										/>
									</div>
								</div>
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
