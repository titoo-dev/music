"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { convertDuration } from "@/utils/helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { TrackDownloadStatus } from "@/components/downloads/TrackDownloadStatus";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { useDownloadedAlbums } from "@/hooks/useDownloadedAlbums";
import { CoverImage } from "@/components/ui/cover-image";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { longPressHandlers } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";

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

function ArtistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [artist, setArtist] = useState<any>(null);
	const [topTracks, setTopTracks] = useState<any[]>([]);
	const [discography, setDiscography] = useState<any>({});
	const [loading, setLoading] = useState(true);
	const { download, isLoading } = useDownload();
	const allTrackIds = topTracks.map((t: any) => String(t.SNG_ID || t.id)).filter(Boolean);
	const { downloaded } = useDownloadedTracks(allTrackIds);
	const { albumMap } = useDownloadedAlbums();

	useEffect(() => {
		if (!id) return;
		async function loadArtist() {
			try {
				const data = await fetchData("content/tracklist", { id, type: "artist" });
				setArtist(data?.DATA || data);
				setTopTracks(data?.topTracks || []);
				setDiscography(data?.discography || {});
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadArtist();
	}, [id]);

	const openSheet = useTrackActionStore((s) => s.openSheet);
	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const playerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);

	const deezerUrl = (itemId: string, type: string) => `https://www.deezer.com/${type}/${itemId}`;
	const handleDownload = (itemId: string, type: string) => download(deezerUrl(itemId, type));

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	if (!artist)
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-bold uppercase text-muted-foreground">Artist not found</p>
				<p className="text-xs font-bold uppercase text-muted-foreground">The artist you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
			</div>
		);

	const artistPicture =
		artist.picture_xl ||
		artist.picture_big ||
		artist.picture_medium ||
		getArtistUrl(artist.ART_PICTURE, 500);

	const artistName = artist.name || artist.ART_NAME;
	const nbFan = artist.nb_fan || artist.NB_FAN;

	// Filter discography tabs that have content, preferred order
	const tabOrder = ["all", "album", "single", "ep", "featured", "more"];
	const tabLabels: Record<string, string> = {
		all: "All",
		album: "Albums",
		single: "Singles",
		ep: "EPs",
		featured: "Featured",
		more: "More",
	};
	const tabKeys = tabOrder.filter((k) => discography[k]?.length > 0);

	return (
		<div className="space-y-10">
			{/* Artist Hero */}
			<div>
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					ARTIST{nbFan != null ? ` · ${Number(nbFan).toLocaleString()} FANS` : ""}
				</p>
				<div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
					<CoverImage
						src={artistPicture}
						alt={artistName}
						className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 flex-shrink-0 border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] rounded-full overflow-hidden"
					/>
					<div className="flex flex-col gap-3 text-center md:text-left min-w-0 flex-1">
						<h1 className="text-brutal-xl m-0">
							{artistName}<span className="text-primary">.</span>
						</h1>
						{nbFan != null && (
							<p className="text-sm font-mono font-bold text-muted-foreground tracking-[0.05em]">
								{Number(nbFan).toLocaleString()} FANS · DEEZER
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Top Tracks */}
			{topTracks.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								TOP TRACKS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{Math.min(10, topTracks.length)} RESULTS
							</span>
						</div>
					</div>
					<div className="border-2 sm:border-[3px] border-foreground overflow-hidden">
						{topTracks.slice(0, 10).map((track: any, idx: number) => {
							const trackId = track.SNG_ID || track.id;
							const trackTitle = track.SNG_TITLE || track.title;
							const trackArtist = track.ART_NAME || track.artist?.name;
							const trackDuration = track.DURATION || track.duration || 0;
							const trackCover =
								track.album?.cover_small ||
								getCoverUrl(track.ALB_PICTURE, 56);
							const albumId = track.ALB_ID || track.album?.id;
							const albumTitle = track.ALB_TITLE || track.album?.title;
							const previewUrl = (track.MEDIA?.[0]?.HREF || track.preview || "").replace("http://", "https://");
							const isPreviewActive = previewTrack?.id === String(trackId) && previewPlaying;
							const isPlayerActive = playerTrack?.trackId === String(trackId) && playerPlaying;
							const isActive = isPreviewActive || isPlayerActive;
							const isPaused = (previewTrack?.id === String(trackId) && !previewPlaying) || (playerTrack?.trackId === String(trackId) && !playerPlaying);

							const trackUrl = deezerUrl(trackId, "track");
							const lp = longPressHandlers(() => {
								openSheet(
									{
										id: String(trackId),
										title: trackTitle,
										artist: trackArtist,
										cover: trackCover || undefined,
										duration: trackDuration ? Number(trackDuration) : undefined,
										albumId: albumId ? String(albumId) : undefined,
										albumTitle,
										artistId: id ? String(id) : undefined,
										previewUrl: previewUrl || undefined,
									},
									{ onDownload: () => handleDownload(trackId, "track") }
								);
							});

							return (
								<div
									key={trackId || idx}
									{...lp}
									className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 overflow-hidden border-b-[2px] border-foreground last:border-b-0 transition-colors select-none ${isActive || isPaused ? "bg-accent/20" : "hover:bg-accent/20"} group`}
								>
									<span className="w-6 text-right tabular-nums flex items-center justify-end">
										{isActive || isPaused ? (
											<PlaybackIndicator paused={isPaused} />
										) : (
											<span className="text-xs text-muted-foreground font-mono font-bold">{idx + 1}</span>
										)}
									</span>
									<CoverImage src={trackCover} className="size-9 sm:size-10 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<p className={`text-sm font-medium truncate ${isActive || isPaused ? "text-primary" : "text-foreground"}`}>
											{trackTitle}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{trackArtist}
											{albumTitle ? (
												<>
													{" · "}
													{albumId ? (
														<Link href={`/album?id=${albumId}`} className="hover:underline hover:text-foreground transition-colors">
															{albumTitle}
														</Link>
													) : albumTitle}
												</>
											) : ""}
										</p>
									</div>
									<span className="hidden sm:inline text-xs text-muted-foreground tabular-nums font-mono">
										{convertDuration(trackDuration)}
									</span>
									<TrackDownloadStatus
										trackId={trackId}
										isAlreadyDownloaded={downloaded.has(String(trackId))}
										apiLoading={isLoading(trackUrl)}
										onDownload={() => handleDownload(trackId, "track")}
									/>
								</div>
							);
						})}
					</div>
				</section>
			)}

			{/* Discography Tabs */}
			{tabKeys.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								DISCOGRAPHY
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{tabKeys.reduce((sum, k) => sum + (discography[k]?.length || 0), 0)} TOTAL
							</span>
						</div>
					</div>
					<Tabs defaultValue={tabKeys[0]}>
						<TabsList>
							{tabKeys.map((key) => (
								<TabsTrigger key={key} value={key}>
									{tabLabels[key] || key} ({discography[key].length})
								</TabsTrigger>
							))}
						</TabsList>

						{tabKeys.map((key) => (
							<TabsContent key={key} value={key} className="mt-6">
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
									{discography[key].map((album: any) => {
										const albumId = album.id || album.ALB_ID;
										const albumTitle = album.title || album.ALB_TITLE;
										const albumCover =
											album.cover_medium ||
											album.cover_big ||
											getCoverUrl(album.ALB_PICTURE || album.md5_image, 250) ||
											"/placeholder.jpg";
										const albumDeezerUrl = deezerUrl(albumId, "album");
										const myAlbumId = albumMap.get(String(albumId));
										const albumHref = myAlbumId ? `/my-albums/${myAlbumId}` : `/album?id=${albumId}`;

										return (
											<div key={albumId} className="group space-y-2">
												<div className="relative overflow-hidden border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all bg-card">
													<Link href={albumHref}>
														<CoverImage
															src={albumCover}
															alt={albumTitle}
															loading="lazy"
															className="w-full aspect-square border-0"
														/>
													</Link>
													{myAlbumId && (
														<span className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 border border-emerald-700">
															<CheckCircle2 className="size-3" />
															Downloaded
														</span>
													)}
													{!myAlbumId && (
														<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
															<Button
																size="sm"
																onClick={() => handleDownload(albumId, "album")}
																disabled={isLoading(albumDeezerUrl)}
																className="gap-1.5 pointer-events-auto"
															>
																{isLoading(albumDeezerUrl) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
																{isLoading(albumDeezerUrl) ? "Adding..." : "Download"}
															</Button>
														</div>
													)}
												</div>
												<div>
													<Link
														href={albumHref}
														className="text-sm font-medium truncate block text-foreground hover:underline"
													>
														{albumTitle}
													</Link>
													<p className="text-xs text-muted-foreground font-mono">
														{album.release_date || album.PHYSICAL_RELEASE_DATE}
														{album.nb_tracks ? ` · ${album.nb_tracks} tracks` : ""}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</TabsContent>
						))}
					</Tabs>
				</section>
			)}

			{/* Fallback if nothing */}
			{topTracks.length === 0 && tabKeys.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-bold uppercase text-muted-foreground">No content</p>
					<p className="text-xs font-bold uppercase text-muted-foreground">No tracks or discography found for this artist.</p>
				</div>
			)}
		</div>
	);
}

export default function ArtistPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ArtistContent />
		</Suspense>
	);
}
