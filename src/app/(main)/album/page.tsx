"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { convertDuration } from "@/utils/helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CoverImage } from "@/components/ui/cover-image";
import { Loader2, CheckCircle2, Clock, Download } from "lucide-react";
import { TrackDownloadStatus } from "@/components/downloads/TrackDownloadStatus";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { useDownloadedAlbums } from "@/hooks/useDownloadedAlbums";
import { useQueueStore } from "@/stores/useQueueStore";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { longPressHandlers } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { getBitrateBadge } from "@/utils/track-format";
import { TrackActionMenu } from "@/components/tracks/TrackActionMenu";

function getCoverUrl(picture: string, size = 500) {
	if (!picture) return "/placeholder.jpg";
	if (picture.startsWith("http")) return picture;
	return `https://e-cdns-images.dzcdn.net/images/cover/${picture}/${size}x${size}-000000-80-0-0.jpg`;
}

function AlbumDownloadButton({
	queueItem,
	allDownloaded,
	apiLoading,
	onDownload,
}: {
	queueItem: import("@/stores/useQueueStore").QueueItem | null;
	allDownloaded: boolean;
	apiLoading: boolean;
	onDownload: () => void;
}) {
	const status = queueItem?.status;

	if (status === "completed" || allDownloaded) {
		return (
			<Button disabled className="w-fit mt-1 gap-2 bg-accent hover:bg-accent text-foreground border-foreground">
				<CheckCircle2 className="size-4" />
				Downloaded
			</Button>
		);
	}

	if (status === "downloading") {
		return (
			<Button disabled className="w-fit mt-1 gap-2">
				<Loader2 className="size-4 animate-spin" />
				Downloading {queueItem.downloaded}/{queueItem.size}
			</Button>
		);
	}

	if (status === "inQueue") {
		return (
			<Button disabled className="w-fit mt-1 gap-2">
				<Clock className="size-4" />
				In queue...
			</Button>
		);
	}

	if (status === "failed") {
		return (
			<Button onClick={onDownload} variant="destructive" className="w-fit mt-1 gap-2">
				<Download className="size-4" />
				Retry download
			</Button>
		);
	}

	return (
		<Button onClick={onDownload} disabled={apiLoading} className="w-fit mt-1 gap-2">
			{apiLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
			{apiLoading ? "Adding..." : "Download album"}
		</Button>
	);
}

function AlbumContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const id = searchParams.get("id");
	const [album, setAlbum] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { download, isLoading } = useDownload();
	const allTrackIds = tracks.map((t: any) => String(t.SNG_ID || t.id)).filter(Boolean);
	const { downloaded } = useDownloadedTracks(allTrackIds);
	const { albumMap } = useDownloadedAlbums();

	// Redirect to my-albums if this album is already downloaded
	useEffect(() => {
		if (id && albumMap.has(String(id))) {
			router.replace(`/my-albums/${albumMap.get(String(id))}`);
		}
	}, [id, albumMap, router]);

	useEffect(() => {
		if (!id) return;
		async function loadAlbum() {
			try {
				const data = await fetchData("content/tracklist", { id, type: "album" });
				// GW API returns data in DATA/SONGS structure
				const albumData = data?.DATA || data;
				const trackList = data?.tracks || data?.SONGS?.data || [];
				setAlbum(albumData);
				setTracks(trackList);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadAlbum();
	}, [id]);

	const openSheet = useTrackActionStore((s) => s.openSheet);
	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const playerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);

	// Album download queue tracking
	const albumQueueItem = useQueueStore((s) => {
		const items = Object.values(s.queue);
		return items.find((item) => String(item.id) === String(id)) || null;
	});
	const allTracksDownloaded = allTrackIds.length > 0 && allTrackIds.every((tid) => downloaded.has(tid));

	const albumUrl = `https://www.deezer.com/album/${id}`;
	const handleDownloadAll = () => download(albumUrl);
	const trackUrl = (trackId: string) => `https://www.deezer.com/track/${trackId}`;
	const handleDownloadTrack = (trackId: string) => download(trackUrl(trackId));

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	if (!album)
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-bold uppercase text-muted-foreground">Album not found</p>
				<p className="text-xs font-bold uppercase text-muted-foreground">The album you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
			</div>
		);

	// Handle both GW format (ALB_PICTURE, ALB_TITLE) and standard API format (cover_xl, title)
	const title = album.ALB_TITLE || album.title || "";
	const artistName = album.ART_NAME || album.artist?.name || "";
	const cover = album.cover_xl || album.cover_big || getCoverUrl(album.ALB_PICTURE, 500);
	const nbTracks = album.NUMBER_TRACK || album.nb_tracks;
	const releaseDate = album.PHYSICAL_RELEASE_DATE || album.DIGITAL_RELEASE_DATE || album.release_date;
	const recordType = album.TYPE === "0" ? "Single" : album.TYPE === "1" ? "Album" : album.TYPE === "2" ? "Compilation" : album.record_type || "Album";

	return (
		<div className="space-y-8">
			{/* Album Header */}
			<div className="flex flex-col md:flex-row gap-8">
				<CoverImage
					src={cover}
					alt={title}
					className="w-32 h-32 sm:w-48 sm:h-48 border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] flex-shrink-0"
				/>
				<div className="flex flex-col justify-end gap-3">
					<Badge variant="secondary" className="w-fit">
						{recordType}
					</Badge>
					<h1 className="text-brutal-lg">
						{title}
					</h1>
					<div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
						<span>{artistName}</span>
						{nbTracks && (
							<>
								<span className="text-border">·</span>
								<span>{nbTracks} tracks</span>
							</>
						)}
						{releaseDate && (
							<>
								<span className="text-border">·</span>
								<span>{releaseDate}</span>
							</>
						)}
					</div>
					<AlbumDownloadButton
						queueItem={albumQueueItem}
						allDownloaded={allTracksDownloaded}
						apiLoading={isLoading(albumUrl)}
						onDownload={handleDownloadAll}
					/>
				</div>
			</div>

			<Separator />

			{/* Tracklist */}
			<div>
				<h2 className="text-xs font-black text-foreground uppercase tracking-[0.15em] mb-4">
					Tracklist
				</h2>
				{tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<p className="text-sm font-bold uppercase text-muted-foreground">No tracks</p>
						<p className="text-xs font-bold uppercase text-muted-foreground">The tracklist for this album is unavailable.</p>
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
						const trackTitle = track.SNG_TITLE || track.title || "";
						const trackArtist = track.ART_NAME || track.artist?.name || "";
						const trackArtistId = track.ART_ID || track.artist?.id;
						const trackId = track.SNG_ID || track.id;
						const trackNum = track.TRACK_NUMBER || track.track_position || idx + 1;
						const trackDuration = track.DURATION || track.duration || 0;
						const trackCover = track.ALB_PICTURE
							? getCoverUrl(track.ALB_PICTURE, 56)
							: track.album?.cover_small;
						const previewUrl = (track.MEDIA?.[0]?.HREF || track.preview || "").replace("http://", "https://");
						const isPreviewActive = previewTrack?.id === String(trackId) && previewPlaying;
						const isPlayerActive = playerTrack?.trackId === String(trackId) && playerPlaying;
						const isActive = isPreviewActive || isPlayerActive;
						const isPaused = (previewTrack?.id === String(trackId) && !previewPlaying) || (playerTrack?.trackId === String(trackId) && !playerPlaying);
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
									albumId: id ? String(id) : undefined,
									albumTitle: title,
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
										<span className="text-[11px] text-muted-foreground font-mono font-bold">
											{String(trackNum).padStart(2, "0")}
										</span>
									)}
								</span>
								<CoverImage src={trackCover} className="size-9" />
								<div className="min-w-0">
									<p className={`text-[13px] font-bold tracking-[-0.005em] truncate leading-tight ${isActive || isPaused ? "text-foreground" : "text-foreground"}`}>
										{trackTitle}
										{track.VERSION ? <span className="text-muted-foreground font-medium"> {track.VERSION}</span> : ""}
									</p>
									<p className="text-[11px] text-muted-foreground truncate font-medium leading-tight mt-0.5">
										{trackArtistId ? (
											<Link href={`/artist?id=${trackArtistId}`} className="hover:underline hover:text-foreground transition-colors">
												{trackArtist}
											</Link>
										) : trackArtist}
									</p>
								</div>
								<span
									className={`font-mono text-[10px] font-black tracking-[0.05em] uppercase border-2 border-foreground px-1.5 py-0.5 ${
										isFlac ? "bg-accent text-foreground" : "bg-card text-muted-foreground"
									}`}
								>
									{bitrate}
								</span>
								<span className="hidden sm:inline text-[11px] text-muted-foreground tabular-nums font-mono text-right">
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
												albumId: id ? String(id) : undefined,
												albumTitle: title,
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

export default function AlbumPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<AlbumContent />
		</Suspense>
	);
}
