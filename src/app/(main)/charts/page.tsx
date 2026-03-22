"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { convertDuration } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { TrackDownloadStatus } from "@/components/downloads/TrackDownloadStatus";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { longPressHandlers } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { CoverImage } from "@/components/ui/cover-image";
import { PreviewButton } from "@/components/audio/PreviewButton";
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

export default function ChartsPage() {
	const [countries, setCountries] = useState<any[]>([]);
	const [selectedChart, setSelectedChart] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingTracks, setLoadingTracks] = useState(false);
	const { download, isLoading } = useDownload();
	const allTrackIds = tracks.map((t: any) => String(t.id || t.SNG_ID)).filter(Boolean);
	const { downloaded } = useDownloadedTracks(allTrackIds);

	const openSheet = useTrackActionStore((s) => s.openSheet);
	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const playerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);

	useEffect(() => {
		async function loadCharts() {
			try {
				const data = await fetchData("content/charts");
				setCountries(data || []);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadCharts();
	}, []);

	const loadChartTracks = async (chart: any) => {
		setSelectedChart(chart);
		setLoadingTracks(true);
		try {
			const data = await fetchData("content/chart-tracks", {
				id: chart.id.toString(),
			});
			setTracks(data?.data || []);
		} catch {
			setTracks([]);
		}
		setLoadingTracks(false);
	};

	const deezerUrl = (id: string, type: string) => `https://www.deezer.com/${type}/${id}`;
	const handleDownload = (id: string, type: string = "track") => download(deezerUrl(id, type));

	const chartUrl = selectedChart ? `https://www.deezer.com/playlist/${selectedChart.id}` : "";
	const handleDownloadAll = () => { if (chartUrl) download(chartUrl); };

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (selectedChart) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSelectedChart(null)}
						className="gap-1.5"
					>
						<ArrowLeft className="size-4" />
						Back
					</Button>
					<div className="flex-1 min-w-0">
						<h1 className="text-brutal-lg truncate">
							{selectedChart.title || selectedChart.TITLE}
						</h1>
					</div>
					<Button
						size="sm"
						onClick={handleDownloadAll}
						disabled={isLoading(chartUrl)}
						className="gap-1.5"
					>
						{isLoading(chartUrl) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
						{isLoading(chartUrl) ? "Adding..." : "Download All"}
					</Button>
				</div>

				{loadingTracks ? (
					<div className="flex items-center justify-center py-24">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				) : tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 gap-2">
						<p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">No tracks found</p>
						<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">This chart appears to be empty.</p>
					</div>
				) : (
					<div className="border-2 sm:border-[3px] border-foreground overflow-hidden">
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
							const trackArtistId = track.artist?.id || track.ART_ID;
							const trackAlbumId = track.album?.id || track.ALB_ID;
							const trackAlbumTitle = track.album?.title || track.ALB_TITLE;
							const lp = longPressHandlers(() => {
								openSheet(
									{
										id: String(trackId),
										title: trackTitle,
										artist: trackArtist,
										cover: trackCover || undefined,
										duration: trackDuration ? Number(trackDuration) : undefined,
										albumId: trackAlbumId ? String(trackAlbumId) : undefined,
										albumTitle: trackAlbumTitle || undefined,
										artistId: trackArtistId ? String(trackArtistId) : undefined,
										previewUrl: previewUrl || undefined,
									},
									{ onDownload: () => handleDownload(trackId, "track") }
								);
							});

							return (
								<div key={trackId || idx}>
									<div {...lp} className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 overflow-hidden group transition-colors select-none ${isActive || isPaused ? "bg-accent/20" : "hover:bg-accent/20"}`}>
										<span className="w-8 text-right tabular-nums flex items-center justify-end">
											{isActive || isPaused ? (
												<PlaybackIndicator paused={isPaused} />
											) : (
												<span className="text-xs text-muted-foreground font-mono font-bold">{idx + 1}</span>
											)}
										</span>
										<CoverImage src={trackCover} className="size-9 sm:size-10" />
										<div className="flex-1 min-w-0">
											<p className={`text-sm font-medium truncate ${isActive || isPaused ? "text-primary" : ""}`}>
												{trackTitle}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{trackArtist}
											</p>
										</div>
										<span className="hidden sm:inline text-xs text-muted-foreground font-mono tabular-nums">
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
										<TrackDownloadStatus
											trackId={trackId}
											isAlreadyDownloaded={downloaded.has(String(trackId))}
											apiLoading={isLoading(deezerUrl(trackId, "track"))}
											onDownload={() => handleDownload(trackId, "track")}
										/>
									</div>
									{idx < tracks.length - 1 && <Separator />}
								</div>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-brutal-lg">Charts</h1>
				<p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-bold">
					Browse charts by country
				</p>
			</div>

			{countries.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">No charts available</p>
					<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Charts could not be loaded. Try again later.</p>
				</div>
			) : (
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
				{countries.map((country: any) => {
					const countryTitle = country.title || country.TITLE;
					const countryPicture =
						country.picture_medium ||
						country.picture_big ||
						getCoverUrl(country.PLAYLIST_PICTURE, 250) ||
						"/placeholder.jpg";

					return (
						<div
							key={country.id}
							className="group cursor-pointer border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all overflow-hidden"
							onClick={() => loadChartTracks(country)}
						>
							<CoverImage
								src={countryPicture}
								alt={countryTitle}
								loading="lazy"
								className="w-full aspect-square border-0"
							/>
							<div className="border-t-[2px] border-foreground px-2 py-2">
								<p className="text-sm font-bold truncate">
									{countryTitle}
								</p>
							</div>
						</div>
					);
				})}
			</div>
			)}
		</div>
	);
}
