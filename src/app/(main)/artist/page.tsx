"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { convertDuration } from "@/utils/helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2 } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";
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

function ArtistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [artist, setArtist] = useState<any>(null);
	const [topTracks, setTopTracks] = useState<any[]>([]);
	const [discography, setDiscography] = useState<any>({});
	const [loading, setLoading] = useState(true);
	const { download, isLoading } = useDownload();

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
				<p className="text-sm font-medium text-muted-foreground">Artist not found</p>
				<p className="text-xs text-muted-foreground">The artist you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
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
		<div className="space-y-8">
			{/* Artist Header */}
			<div className="flex flex-col md:flex-row items-center md:items-end gap-8">
				<CoverImage
					src={artistPicture}
					alt={artistName}
					className="w-48 h-48 rounded-full flex-shrink-0"
				/>
				<div className="flex flex-col gap-2 text-center md:text-left">
					<p className="text-xs font-medium text-muted-foreground">Artist</p>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						{artistName}
					</h1>
					{nbFan != null && (
						<p className="text-sm text-muted-foreground">
							{Number(nbFan).toLocaleString()} fans
						</p>
					)}
				</div>
			</div>

			<Separator />

			{/* Top Tracks */}
			{topTracks.length > 0 && (
				<section className="space-y-4">
					<h2 className="text-sm font-medium text-muted-foreground">
						Top tracks
					</h2>
					<div className="rounded-lg border border-border overflow-hidden">
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
							const trackUrl = deezerUrl(trackId, "track");

							return (
								<div
									key={trackId || idx}
									className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 transition-colors hover:bg-muted/50 group"
								>
									<span className="text-xs text-muted-foreground w-6 text-right tabular-nums">
										{idx + 1}
									</span>
									<CoverImage src={trackCover} className="w-10 h-10 rounded-md flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate text-foreground">
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
										variant="ghost"
										size="icon-sm"
										onClick={() => handleDownload(trackId, "track")}
										disabled={isLoading(trackUrl)}
										className="opacity-0 group-hover:opacity-100 transition-opacity"
									>
										{isLoading(trackUrl) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
									</Button>
								</div>
							);
						})}
					</div>
				</section>
			)}

			{/* Discography Tabs */}
			{tabKeys.length > 0 && (
				<section className="space-y-4">
					<h2 className="text-sm font-medium text-muted-foreground">
						Discography
					</h2>
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
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
									{discography[key].map((album: any) => {
										const albumId = album.id || album.ALB_ID;
										const albumTitle = album.title || album.ALB_TITLE;
										const albumCover =
											album.cover_medium ||
											album.cover_big ||
											getCoverUrl(album.ALB_PICTURE || album.md5_image, 250) ||
											"/placeholder.jpg";
										const albumDeezerUrl = deezerUrl(albumId, "album");

										return (
											<div key={albumId} className="group space-y-2">
												<div className="relative overflow-hidden rounded-lg bg-muted/30">
													<Link href={`/album?id=${albumId}`}>
														<CoverImage
															src={albumCover}
															alt={albumTitle}
															loading="lazy"
															className="w-full aspect-square transition-transform duration-200 group-hover:scale-[1.02]"
														/>
													</Link>
													<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center pointer-events-none">
														<Button
															size="sm"
															onClick={() => handleDownload(albumId, "album")}
															disabled={isLoading(albumDeezerUrl)}
															className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1.5 pointer-events-auto"
														>
															{isLoading(albumDeezerUrl) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
															{isLoading(albumDeezerUrl) ? "Adding..." : "Download"}
														</Button>
													</div>
												</div>
												<div>
													<Link
														href={`/album?id=${albumId}`}
														className="text-sm font-medium truncate block text-foreground hover:underline"
													>
														{albumTitle}
													</Link>
													<p className="text-xs text-muted-foreground">
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
					<p className="text-sm font-medium text-muted-foreground">No content</p>
					<p className="text-xs text-muted-foreground">No tracks or discography found for this artist.</p>
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
