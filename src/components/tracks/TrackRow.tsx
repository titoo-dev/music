"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { TrackDownloadStatus } from "@/components/downloads/TrackDownloadStatus";
import { TrackActionMenu } from "@/components/tracks/TrackActionMenu";
import { useLongPress } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { convertDuration } from "@/utils/helpers";
import { getBitrateBadge } from "@/utils/track-format";

export interface TrackRowTrack {
	trackId: string;
	title: string;
	artist: string;
	artistId?: string | null;
	album?: string | null;
	albumId?: string | null;
	cover: string | null;
	duration?: number | null;
	previewUrl?: string | null;
	/** Pre-computed bitrate label (e.g. "FLAC", "320"). When omitted, the cell is hidden. */
	bitrateLabel?: string | null;
}

export interface TrackRowProps {
	track: TrackRowTrack;
	showBitrate?: boolean;
	showDuration?: boolean;
	isDownloaded?: boolean;
	apiLoading?: boolean;
	onDownload?: () => void;
}

/**
 * Convert a raw Deezer GW/API track into the normalized TrackRowTrack shape
 * used by this component. Handles both the GW (SNG_ID, ART_NAME, ALB_PICTURE)
 * and public API (id, artist.name, album.cover_small) variants.
 */
export function trackFromDeezerRaw(raw: any): TrackRowTrack {
	const id = raw.SNG_ID || raw.id;
	const cover =
		raw.album?.cover_small ||
		(raw.ALB_PICTURE
			? `https://e-cdns-images.dzcdn.net/images/cover/${raw.ALB_PICTURE}/56x56-000000-80-0-0.jpg`
			: null);
	const previewUrl = (raw.MEDIA?.[0]?.HREF || raw.preview || "").replace(
		"http://",
		"https://"
	);
	return {
		trackId: String(id),
		title: raw.SNG_TITLE || raw.title || "",
		artist: raw.ART_NAME || raw.artist?.name || "",
		artistId: raw.ART_ID || raw.artist?.id || null,
		album: raw.ALB_TITLE || raw.album?.title || null,
		albumId: raw.ALB_ID || raw.album?.id || null,
		cover,
		duration: raw.DURATION ? Number(raw.DURATION) : raw.duration ?? null,
		previewUrl: previewUrl || null,
		bitrateLabel: getBitrateBadge(raw),
	};
}

export function TrackRow({
	track,
	showBitrate = true,
	showDuration = true,
	isDownloaded = false,
	apiLoading = false,
	onDownload,
}: TrackRowProps) {
	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const playerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);
	const playerPlay = usePlayerStore((s) => s.play);
	const playerToggle = usePlayerStore((s) => s.toggle);

	const isPreviewActive = previewTrack?.id === track.trackId && previewPlaying;
	const isPlayerActive = playerTrack?.trackId === track.trackId && playerPlaying;
	const isPlayerLoaded = playerTrack?.trackId === track.trackId;
	const isActive = isPreviewActive || isPlayerActive;
	const isPaused =
		(previewTrack?.id === track.trackId && !previewPlaying) ||
		(playerTrack?.trackId === track.trackId && !playerPlaying);

	const handlePlay = (e: React.MouseEvent | React.TouchEvent) => {
		e.stopPropagation();
		e.preventDefault();
		if (isPlayerLoaded) {
			playerToggle();
			return;
		}
		playerPlay({
			trackId: track.trackId,
			title: track.title,
			artist: track.artist,
			cover: track.cover,
			duration: track.duration ?? null,
		});
	};

	const openSheet = useTrackActionStore((s) => s.openSheet);
	const longPress = useLongPress(() => {
		openSheet(
			{
				id: track.trackId,
				title: track.title,
				artist: track.artist,
				cover: track.cover || undefined,
				duration: track.duration ?? undefined,
				albumId: track.albumId ?? undefined,
				albumTitle: track.album ?? undefined,
				artistId: track.artistId ?? undefined,
				previewUrl: track.previewUrl ?? undefined,
			},
			onDownload ? { onDownload } : undefined
		);
	});

	const bitrate = track.bitrateLabel ?? "—";
	const isFlac = bitrate === "FLAC";
	const showBitrateCell = showBitrate && !!track.bitrateLabel;

	// Static Tailwind class combos so the JIT picks them up. Mobile hides
	// duration; desktop shows duration + bitrate when both enabled.
	let gridClass: string;
	if (showBitrateCell && showDuration) {
		gridClass =
			"grid-cols-[40px_1fr_auto_40px] sm:grid-cols-[40px_1fr_auto_60px_64px]";
	} else if (showBitrateCell) {
		gridClass = "grid-cols-[40px_1fr_auto_40px] sm:grid-cols-[40px_1fr_auto_64px]";
	} else if (showDuration) {
		gridClass = "grid-cols-[40px_1fr_40px] sm:grid-cols-[40px_1fr_60px_64px]";
	} else {
		gridClass = "grid-cols-[40px_1fr_40px] sm:grid-cols-[40px_1fr_64px]";
	}

	return (
		<div
			{...longPress}
			className={`grid ${gridClass} gap-2 sm:gap-3 items-center px-2 sm:px-3 py-2 sm:py-2.5 overflow-hidden group transition-colors select-none border-b border-foreground/15 last:border-b-0 ${
				isActive || isPaused ? "bg-accent" : "hover:bg-foreground/5"
			}`}
		>
			<button
				type="button"
				onClick={handlePlay}
				aria-label={isPlayerActive ? `Pause ${track.title}` : `Play ${track.title}`}
				className="relative shrink-0 group/cover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<CoverImage
					src={track.cover || ""}
					className={`size-9 border-0 transition-opacity ${
						isActive || isPaused ? "opacity-50" : "group-hover/cover:opacity-60"
					}`}
				/>
				{isActive || isPaused ? (
					<div className="absolute inset-0 flex items-center justify-center">
						<PlaybackIndicator paused={isPaused} />
					</div>
				) : (
					<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity bg-black/35">
						<Play className="size-4 text-white fill-white" />
					</div>
				)}
			</button>
			<div className="min-w-0">
				<p className="text-[13px] font-bold tracking-[-0.005em] truncate leading-tight">
					{track.title}
				</p>
				<p className="text-[11px] text-muted-foreground truncate font-medium leading-tight mt-0.5">
					{track.artistId ? (
						<Link
							href={`/artist?id=${track.artistId}`}
							className="hover:underline hover:text-foreground transition-colors"
						>
							{track.artist}
						</Link>
					) : (
						track.artist
					)}
					{track.album ? (
						<>
							{" · "}
							{track.albumId ? (
								<Link
									href={`/album?id=${track.albumId}`}
									className="hover:underline hover:text-foreground transition-colors"
								>
									{track.album}
								</Link>
							) : (
								track.album
							)}
						</>
					) : (
						""
					)}
				</p>
			</div>
			{showBitrateCell && (
				<span
					className={`font-mono text-[10px] font-black tracking-[0.05em] uppercase border-2 border-foreground px-1.5 py-0.5 ${
						isFlac ? "bg-accent text-foreground" : "bg-card text-muted-foreground"
					}`}
				>
					{bitrate}
				</span>
			)}
			{showDuration && (
				<span className="hidden sm:inline text-[11px] text-muted-foreground font-mono tabular-nums text-right">
					{track.duration ? convertDuration(track.duration) : ""}
				</span>
			)}
			<div className="flex items-center justify-end gap-0.5">
				{onDownload && (
					<TrackDownloadStatus
						trackId={track.trackId}
						isAlreadyDownloaded={isDownloaded}
						apiLoading={apiLoading}
						onDownload={onDownload}
					/>
				)}
				<div className="hidden md:block">
					<TrackActionMenu
						track={{
							id: track.trackId,
							title: track.title,
							artist: track.artist,
							cover: track.cover || undefined,
							duration: track.duration ?? undefined,
							albumId: track.albumId ?? undefined,
							albumTitle: track.album ?? undefined,
							artistId: track.artistId ?? undefined,
							previewUrl: track.previewUrl ?? undefined,
						}}
						callbacks={onDownload ? { onDownload } : undefined}
					/>
				</div>
			</div>
		</div>
	);
}
