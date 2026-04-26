"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchData } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Loader2, ChevronLeft, ChevronRight, Disc3 } from "lucide-react";
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

const bitrateLabels: Record<number, string> = {
	1: "MP3-128",
	3: "MP3-320",
	9: "FLAC",
	15: "360-HQ",
	14: "360-MQ",
	13: "360-LQ",
};

function fmtDay(dateStr: string) {
	const d = new Date(dateStr);
	return d
		.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
		.toUpperCase();
}

function fmtTime(dateStr: string) {
	return new Date(dateStr).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function bitrateApprox(bitrate: number) {
	// Rough average size in MB per minute for label
	if (bitrate === 9) return "FLAC";
	if (bitrate === 3) return "320KB";
	if (bitrate === 1) return "128KB";
	return bitrateLabels[bitrate] || `${bitrate}`;
}

export default function DownloadHistoryPage() {
	const [items, setItems] = useState<DownloadItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);
	const openSheet = useTrackActionStore((s) => s.openSheet);

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

	const grouped = useMemo(() => {
		const map = new Map<string, DownloadItem[]>();
		for (const item of items) {
			const day = fmtDay(item.downloadedAt);
			const list = map.get(day);
			if (list) list.push(item);
			else map.set(day, [item]);
		}
		return Array.from(map.entries());
	}, [items]);

	const allPlayerTracks: PlayerTrack[] = items
		.filter((i) => i.storageType === "s3")
		.map((i) => ({
			trackId: i.trackId,
			title: i.title,
			artist: i.artist,
			cover: i.coverUrl,
			duration: null,
		}));

	const flacCount = items.filter((i) => i.bitrate === 9).length;
	const mp3Count = items.length - flacCount;

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.05em]">
					Sign in to view your download history.
				</p>
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

	return (
		<div className="max-w-2xl mx-auto">
			{/* Page header */}
			<div className="mb-7">
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					DOWNLOAD HISTORY · LEDGER
				</p>
				<div className="flex items-end justify-between gap-6 flex-wrap">
					<div className="min-w-0 flex-1">
						<h1 className="text-brutal-xl m-0">
							THE <span className="text-primary">RECEIPTS.</span>
						</h1>
						<p className="mt-2 text-sm font-bold uppercase tracking-[0.04em] text-muted-foreground">
							{total} TRANSACTION{total !== 1 ? "S" : ""} · {flacCount} FLAC · {mp3Count} MP3 · ALL TIME
						</p>
					</div>
				</div>
			</div>

			{items.length === 0 ? (
				<div className="border-[2px] sm:border-[3px] border-foreground bg-card flex flex-col items-center justify-center py-20 px-6 gap-3 shadow-[var(--shadow-brutal)]">
					<div className="text-3xl font-black tracking-[0.2em]">∅</div>
					<p className="text-sm font-black uppercase tracking-[0.14em]">EMPTY LEDGER</p>
					<p className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.05em] text-center">
						Downloaded tracks will appear on this receipt.
					</p>
				</div>
			) : (
				<>
					{/* Receipt card */}
					<div
						className="border-[2px] sm:border-[3px] border-foreground bg-[#fffdf6] shadow-[var(--shadow-brutal)] px-5 sm:px-7 py-6 font-mono"
					>
						{/* Receipt header */}
						<div className="text-center border-b-[2px] border-dashed border-foreground pb-4 mb-4">
							<div className="font-black text-base sm:text-lg tracking-[0.2em]">DEEMIX</div>
							<div className="text-[10px] mt-1 tracking-[0.1em]">── DOWNLOAD RECEIPT ──</div>
							<div className="text-[10px] mt-1 text-muted-foreground tracking-[0.05em]">
								PAGE {page} / {totalPages} · {items.length} ITEM{items.length !== 1 ? "S" : ""}
							</div>
						</div>

						{/* Items grouped by day */}
						{grouped.map(([day, dayItems]) => (
							<div key={day} className="mb-5">
								<div className="text-[10px] font-bold tracking-[0.12em] mb-2 pb-1 border-b border-foreground/20">
									{day}
								</div>
								<div className="space-y-1">
									{dayItems.map((item) => {
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
												key={item.id}
												{...lp}
												className={`group grid grid-cols-[auto_28px_1fr_auto_auto] gap-2 sm:gap-3 items-center text-[12px] py-1 px-1 transition-colors select-none ${
													isActive || isPaused ? "bg-primary/10" : "hover:bg-foreground/5"
												}`}
											>
												{/* Play button (or playing indicator) */}
												<div className="shrink-0 w-6 flex items-center justify-center">
													{item.storageType === "s3" ? (
														isActive || isPaused ? (
															<PlaybackIndicator paused={isPaused} />
														) : (
															<PlayButton track={playerTrack} queue={allPlayerTracks} className="!h-5 !w-5" />
														)
													) : (
														<span className="text-muted-foreground/50 text-[10px]">·</span>
													)}
												</div>
												{/* Cover thumbnail */}
												<div className="shrink-0 w-7 h-7 bg-muted overflow-hidden border border-foreground/30">
													{item.coverUrl ? (
														<CoverImage src={item.coverUrl} alt={item.title} className="w-7 h-7" />
													) : (
														<div className="w-7 h-7 flex items-center justify-center">
															<Disc3 className="size-3 text-muted-foreground/40" />
														</div>
													)}
												</div>
												{/* Title + artist */}
												<div className="min-w-0 leading-tight">
													<span className={`font-bold truncate ${isActive || isPaused ? "text-primary" : ""}`}>
														{item.title}
													</span>
													<span className="text-muted-foreground"> · {item.artist}</span>
													{item.album && (
														<span className="hidden sm:inline text-muted-foreground/60">
															{" / "}
															{item.albumId ? (
																<Link
																	href={`/album?id=${item.albumId}`}
																	className="hover:text-foreground hover:underline"
																>
																	{item.album}
																</Link>
															) : (
																item.album
															)}
														</span>
													)}
												</div>
												{/* Bitrate */}
												<span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">
													{bitrateApprox(item.bitrate)}
												</span>
												{/* Time */}
												<span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-10 text-right">
													{fmtTime(item.downloadedAt)}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						))}

						{/* Total */}
						<div className="border-t-[2px] border-dashed border-foreground pt-3 mt-2">
							<div className="flex justify-between items-baseline font-black text-[13px] tracking-[0.05em]">
								<span>SUBTOTAL · PAGE</span>
								<span>{items.length} TR</span>
							</div>
							<div className="flex justify-between text-[10px] text-muted-foreground mt-1 tracking-[0.05em]">
								<span>{flacCount} FLAC · {mp3Count} MP3</span>
								<span>PAID IN BANDWIDTH</span>
							</div>
							<div className="flex justify-between font-black text-[15px] tracking-[0.05em] border-t border-foreground/30 pt-2 mt-2">
								<span>TOTAL · ALL TIME</span>
								<span>{total} TR</span>
							</div>
						</div>

						{/* Receipt footer */}
						<div className="text-center border-t-[2px] border-dashed border-foreground pt-4 mt-4 text-[10px] text-muted-foreground tracking-[0.1em]">
							*** THANK YOU ***
							<br />
							KEEP THIS RECEIPT FOR YOUR RECORDS
						</div>

						{/* Barcode-ish strip */}
						<div className="mt-4 flex justify-center gap-[1px]" aria-hidden>
							{Array.from({ length: 40 }).map((_, i) => (
								<div
									key={i}
									className="bg-foreground"
									style={{
										width: i % 3 === 0 ? 3 : i % 4 === 0 ? 2 : 1,
										height: 24,
										opacity: i % 5 === 0 ? 0.4 : 1,
									}}
								/>
							))}
						</div>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-6">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
								className="font-mono uppercase tracking-[0.1em]"
							>
								<ChevronLeft className="size-4" />
								PREV
							</Button>
							<span className="text-[11px] text-muted-foreground font-mono font-bold tracking-[0.1em] uppercase px-2">
								PAGE {page} / {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="font-mono uppercase tracking-[0.1em]"
							>
								NEXT
								<ChevronRight className="size-4" />
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
