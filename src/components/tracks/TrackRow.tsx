"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { warmTrack } from "@/components/audio/AudioEngine";
import { SaveButton } from "@/components/tracks/SaveButton";
import { TrackActionMenu } from "@/components/tracks/TrackActionMenu";
import { useLongPress } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
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
	/** Show the Save (heart) button. Default true. */
	showSave?: boolean;
	/** Context-specific delete callback (e.g. remove from a playlist). */
	onDelete?: () => void;
	/** When set, prepends a "#" column with the track number (album/playlist view). */
	trackNumber?: number;
	/**
	 * Surrounding tracks to enqueue when this row is played. Pass the full
	 * displayed list (in display order) so playback chains through. When
	 * omitted, only this track plays.
	 */
	queue?: TrackRowTrack[];
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
	showSave = true,
	onDelete,
	trackNumber,
	queue,
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
		const tapped: PlayerTrack = {
			trackId: track.trackId,
			title: track.title,
			artist: track.artist,
			cover: track.cover,
			duration: track.duration ?? null,
		};
		if (queue && queue.length > 0) {
			const mapped: PlayerTrack[] = queue.map((t) => ({
				trackId: t.trackId,
				title: t.title,
				artist: t.artist,
				cover: t.cover,
				duration: t.duration ?? null,
			}));
			// Ensure the tapped track is in the queue. If callers passed a list
			// that excludes the tapped track for some reason, fall back gracefully.
			const inQueue = mapped.some((t) => t.trackId === tapped.trackId);
			playerPlay(tapped, inQueue ? mapped : [tapped, ...mapped]);
			return;
		}
		playerPlay(tapped);
	};

	const openSheet = useTrackActionStore((s) => s.openSheet);
	const callbacks = onDelete ? { onDelete } : undefined;
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
			callbacks
		);
	});

	const bitrate = track.bitrateLabel ?? "—";
	const isFlac = bitrate === "FLAC";
	const showBitrateCell = showBitrate && !!track.bitrateLabel;

	// Static Tailwind class combos so the JIT picks them up. Mobile hides
	// duration; desktop shows duration + bitrate when both enabled.
	const hasNum = typeof trackNumber === "number";
	let gridClass: string;
	if (hasNum) {
		if (showBitrateCell && showDuration) {
			gridClass =
				"grid-cols-[28px_40px_1fr_auto_40px] sm:grid-cols-[28px_40px_1fr_auto_60px_64px]";
		} else if (showBitrateCell) {
			gridClass = "grid-cols-[28px_40px_1fr_auto_40px] sm:grid-cols-[28px_40px_1fr_auto_64px]";
		} else if (showDuration) {
			gridClass = "grid-cols-[28px_40px_1fr_40px] sm:grid-cols-[28px_40px_1fr_60px_64px]";
		} else {
			gridClass = "grid-cols-[28px_40px_1fr_40px] sm:grid-cols-[28px_40px_1fr_64px]";
		}
	} else if (showBitrateCell && showDuration) {
		gridClass =
			"grid-cols-[40px_1fr_auto_40px] sm:grid-cols-[40px_1fr_auto_60px_64px]";
	} else if (showBitrateCell) {
		gridClass = "grid-cols-[40px_1fr_auto_40px] sm:grid-cols-[40px_1fr_auto_64px]";
	} else if (showDuration) {
		gridClass = "grid-cols-[40px_1fr_40px] sm:grid-cols-[40px_1fr_60px_64px]";
	} else {
		gridClass = "grid-cols-[40px_1fr_40px] sm:grid-cols-[40px_1fr_64px]";
	}

	const handleHoverWarm = () => {
		if (isPlayerLoaded) return;
		// Hover signals strong intent — full audio buffer prefetch (~30s).
		warmTrack(track.trackId, { audio: "full" });
	};

	// Sliding-window prefetch: when this row scrolls into view, kick off a
	// light "head" prefetch (~3s of audio + server cache warm). Cheap enough
	// to apply to every visible item; the LRU caps total bandwidth.
	const rowRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (isPlayerLoaded) return;
		const el = rowRef.current;
		if (!el || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						warmTrack(track.trackId, { audio: "head" });
						observer.disconnect();
						break;
					}
				}
			},
			{ rootMargin: "200px" }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [track.trackId, isPlayerLoaded]);

	return (
		<div
			{...longPress}
			ref={rowRef}
			onMouseEnter={handleHoverWarm}
			onFocus={handleHoverWarm}
			className={`grid ${gridClass} gap-2 sm:gap-3 items-center px-2 sm:px-3 py-2 sm:py-2.5 overflow-hidden group transition-colors select-none border-b border-foreground/15 last:border-b-0 ${
				isActive || isPaused ? "bg-accent" : "hover:bg-foreground/5"
			}`}
		>
			{hasNum && (
				<span className="text-right tabular-nums flex items-center justify-end">
					{isActive || isPaused ? (
						<PlaybackIndicator paused={isPaused} />
					) : (
						<span className="text-[11px] text-muted-foreground font-mono font-bold">
							{String(trackNumber).padStart(2, "0")}
						</span>
					)}
				</span>
			)}
			<button
				type="button"
				onClick={handlePlay}
				aria-label={isPlayerActive ? `Pause ${track.title}` : `Play ${track.title}`}
				className="relative shrink-0 size-9 p-0 m-0 bg-transparent border-0 appearance-none cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<CoverImage
					src={track.cover || ""}
					className={`size-9 border-0 block transition-opacity ${
						isActive || isPaused ? "opacity-50" : "group-hover:opacity-60"
					}`}
				/>
				{isActive || isPaused ? (
					<span className="absolute inset-0 flex items-center justify-center">
						<PlaybackIndicator paused={isPaused} />
					</span>
				) : (
					<span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35">
						<Play className="size-4 text-white fill-white" />
					</span>
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
				{showSave && (
					<SaveButton
						track={{
							trackId: track.trackId,
							title: track.title,
							artist: track.artist,
							album: track.album ?? null,
							albumId: track.albumId ?? null,
							coverUrl: track.cover,
							duration: track.duration ?? null,
						}}
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
						callbacks={callbacks}
					/>
				</div>
			</div>
		</div>
	);
}
