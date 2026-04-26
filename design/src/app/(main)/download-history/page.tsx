"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Loader2, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Disc3 } from "lucide-react";
import Link from "next/link";
import { PlayButton } from "@/components/audio/PlayButton";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { longPressHandlers } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";

interface DownloadItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	bitrate: number;
	storageType: string;
	downloadedAt: string;
}

interface AlbumGroup {
	type: "album";
	albumId: string;
	albumName: string;
	artist: string;
	coverUrl: string | null;
	bitrate: number;
	downloadedAt: string;
	tracks: DownloadItem[];
}

interface SingleTrack {
	type: "single";
	item: DownloadItem;
}

type HistoryEntry = AlbumGroup | SingleTrack;

const bitrateLabels: Record<number, string> = {
	1: "MP3 128",
	3: "MP3 320",
	9: "FLAC",
	15: "360 HQ",
	14: "360 MQ",
	13: "360 LQ",
};

function groupItems(items: DownloadItem[]): HistoryEntry[] {
	const albumMap = new Map<string, DownloadItem[]>();
	const singles: DownloadItem[] = [];

	for (const item of items) {
		if (item.albumId && item.album) {
			const existing = albumMap.get(item.albumId);
			if (existing) {
				existing.push(item);
			} else {
				albumMap.set(item.albumId, [item]);
			}
		} else {
			singles.push(item);
		}
	}

	const entries: HistoryEntry[] = [];
	// Track which albumIds we've already added so we preserve download order
	const addedAlbums = new Set<string>();

	for (const item of items) {
		if (item.albumId && item.album && albumMap.has(item.albumId)) {
			if (addedAlbums.has(item.albumId)) continue;
			addedAlbums.add(item.albumId);
			const tracks = albumMap.get(item.albumId)!;
			if (tracks.length === 1) {
				// Single track from an album — show flat
				entries.push({ type: "single", item: tracks[0] });
			} else {
				entries.push({
					type: "album",
					albumId: item.albumId,
					albumName: item.album,
					artist: tracks[0].artist,
					coverUrl: tracks[0].coverUrl,
					bitrate: tracks[0].bitrate,
					downloadedAt: tracks[0].downloadedAt,
					tracks,
				});
			}
		} else if (!item.albumId || !item.album) {
			entries.push({ type: "single", item });
		}
	}

	return entries;
}

export default function DownloadHistoryPage() {
	const [items, setItems] = useState<DownloadItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);
	const openSheet = useTrackActionStore((s) => s.openSheet);

	const toggleAlbum = (albumId: string) => {
		setExpandedAlbums((prev) => {
			const next = new Set(prev);
			if (next.has(albumId)) next.delete(albumId);
			else next.add(albumId);
			return next;
		});
	};

	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		async function load() {
			setLoading(true);
			try {
				const data = await fetchData("downloads/history", {
					page: String(page),
					limit: "50",
				});
				setItems(data.items || []);
				setTotalPages(data.totalPages || 1);
				setTotal(data.total || 0);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		load();
	}, [page, isAuthenticated]);

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground">Sign in to view your download history.</p>
				<Link href="/login">
					<Button>Sign in</Button>
				</Link>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const entries = groupItems(items);

	// Build full player queue from all playable tracks
	const allPlayerTracks: PlayerTrack[] = items
		.filter((i) => i.storageType === "s3")
		.map((i) => ({
			trackId: i.trackId,
			title: i.title,
			artist: i.artist,
			cover: i.coverUrl,
			duration: null,
		}));

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-brutal-lg">Download History</h1>
				<p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-bold font-mono">
					{total} track{total !== 1 ? "s" : ""} downloaded
				</p>
			</div>

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<Download className="size-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground font-bold uppercase">No downloads yet</p>
					<p className="text-xs text-muted-foreground font-bold uppercase">
						Downloaded tracks will appear here.
					</p>
				</div>
			) : (
				<>
					<div className="space-y-1">
						{entries.map((entry) => {
							if (entry.type === "single") {
								return (
									<TrackRow
										key={entry.item.id}
										item={entry.item}
										playerQueue={allPlayerTracks}
										currentPlayerTrack={currentPlayerTrack}
										playerPlaying={playerPlaying}
										openSheet={openSheet}
									/>
								);
							}

							const isExpanded = expandedAlbums.has(entry.albumId);
							return (
								<div key={`album-${entry.albumId}`}>
									{/* Album header row */}
									<button
										onClick={() => toggleAlbum(entry.albumId)}
										className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 overflow-hidden transition-colors border-b-[2px] border-foreground hover:bg-accent/20 select-none text-left"
									>
										<div className="relative shrink-0 size-9 sm:size-10 overflow-hidden bg-muted">
											{entry.coverUrl ? (
												<CoverImage
													src={entry.coverUrl}
													alt={entry.albumName}
													className="size-9 sm:size-10"
												/>
											) : (
												<div className="size-9 sm:size-10 flex items-center justify-center">
													<Disc3 className="size-4 text-muted-foreground" />
												</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-bold truncate">{entry.albumName}</p>
											<p className="text-xs text-muted-foreground truncate">
												{entry.artist} · {entry.tracks.length} tracks
											</p>
										</div>
										<div className="shrink-0 text-right mr-1">
											<p className="text-xs text-muted-foreground font-mono font-bold">
												{bitrateLabels[entry.bitrate] || `${entry.bitrate}`}
											</p>
											<p className="text-xs text-muted-foreground font-mono">
												{new Date(entry.downloadedAt).toLocaleDateString()}
											</p>
										</div>
										{isExpanded ? (
											<ChevronUp className="size-4 text-muted-foreground shrink-0" />
										) : (
											<ChevronDown className="size-4 text-muted-foreground shrink-0" />
										)}
									</button>

									{/* Expanded tracks */}
									{isExpanded && (
										<div className="border-b-[2px] border-foreground">
											{entry.tracks.map((item) => (
												<TrackRow
													key={item.id}
													item={item}
													playerQueue={allPlayerTracks}
													currentPlayerTrack={currentPlayerTrack}
													playerPlaying={playerPlaying}
													openSheet={openSheet}
													indent
												/>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-4">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							<span className="text-sm text-muted-foreground font-mono font-bold">
								Page {page} of {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

function TrackRow({
	item,
	playerQueue,
	currentPlayerTrack,
	playerPlaying,
	openSheet,
	indent,
}: {
	item: DownloadItem;
	playerQueue: PlayerTrack[];
	currentPlayerTrack: PlayerTrack | null;
	playerPlaying: boolean;
	openSheet: (track: any, callbacks?: any) => void;
	indent?: boolean;
}) {
	const playerTrack: PlayerTrack = {
		trackId: item.trackId,
		title: item.title,
		artist: item.artist,
		cover: item.coverUrl,
		duration: null,
	};
	const isActive = currentPlayerTrack?.trackId === item.trackId && playerPlaying;
	const isPaused = currentPlayerTrack?.trackId === item.trackId && !playerPlaying;

	const lp = longPressHandlers(() => {
		openSheet({
			id: item.trackId,
			title: item.title,
			artist: item.artist,
			cover: item.coverUrl || undefined,
			albumId: item.albumId || undefined,
			albumTitle: item.album || undefined,
		});
	});

	return (
		<div
			{...lp}
			className={`group flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 overflow-hidden transition-colors border-b-[2px] border-foreground last:border-b-0 select-none ${isActive || isPaused ? "bg-accent/20" : "hover:bg-accent/20"} ${indent ? "pl-5 sm:pl-7" : ""}`}
		>
			{item.storageType === "s3" && (
				<PlayButton
					track={playerTrack}
					queue={playerQueue}
					className=""
				/>
			)}
			<div className="relative shrink-0 size-9 sm:size-10 overflow-hidden bg-muted">
				{item.coverUrl ? (
					<CoverImage
						src={item.coverUrl}
						alt={item.title}
						className="size-9 sm:size-10"
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
				<p className={`text-sm font-medium truncate ${isActive || isPaused ? "text-primary" : ""}`}>{item.title}</p>
				<p className="text-xs text-muted-foreground truncate">
					{item.artist}
					{!indent && item.album ? (
						<>
							{" · "}
							{item.albumId ? (
								<Link href={`/album?id=${item.albumId}`} className="hover:underline hover:text-foreground transition-colors">
									{item.album}
								</Link>
							) : item.album}
						</>
					) : ""}
				</p>
			</div>
			{!indent && (
				<div className="shrink-0 text-right">
					<p className="text-xs text-muted-foreground font-mono font-bold">
						{bitrateLabels[item.bitrate] || `${item.bitrate}`}
					</p>
					<p className="text-xs text-muted-foreground font-mono">
						{new Date(item.downloadedAt).toLocaleDateString()}
					</p>
				</div>
			)}
		</div>
	);
}
