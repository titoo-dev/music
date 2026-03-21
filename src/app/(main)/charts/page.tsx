"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { convertDuration } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { PreviewButton } from "@/components/audio/PreviewButton";

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
						<h1 className="text-2xl font-semibold tracking-tight truncate">
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
						<p className="text-sm font-medium text-muted-foreground">No tracks found</p>
						<p className="text-xs text-muted-foreground">This chart appears to be empty.</p>
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
							const previewUrl = track.MEDIA?.[0]?.HREF || track.preview || "";

							return (
								<div key={trackId || idx}>
									<div className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/50 transition-colors">
										<span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
											{idx + 1}
										</span>
										{trackCover && (
											<img
												src={trackCover}
												alt=""
												className="w-10 h-10 rounded-md object-cover"
											/>
										)}
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">
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
										<Button
											size="icon-sm"
											variant="ghost"
											onClick={() =>
												handleDownload(trackId, "track")
											}
											disabled={isLoading(deezerUrl(trackId, "track"))}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										>
											{isLoading(deezerUrl(trackId, "track")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
										</Button>
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
				<h1 className="text-2xl font-semibold tracking-tight">Charts</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Browse charts by country
				</p>
			</div>

			{countries.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-medium text-muted-foreground">No charts available</p>
					<p className="text-xs text-muted-foreground">Charts could not be loaded. Try again later.</p>
				</div>
			) : (
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
							className="group cursor-pointer"
							onClick={() => loadChartTracks(country)}
						>
							<div className="rounded-xl overflow-hidden bg-muted/30">
								<img
									src={countryPicture}
									alt={countryTitle}
									loading="lazy"
									className="w-full aspect-square object-cover transition-transform duration-200 group-hover:scale-[1.02]"
								/>
							</div>
							<div className="mt-2 px-0.5">
								<p className="text-sm font-medium truncate">
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
