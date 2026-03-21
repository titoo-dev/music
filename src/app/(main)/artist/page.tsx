"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";

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
	const [releases, setReleases] = useState<any>({});
	const [tab, setTab] = useState("all");
	const [loading, setLoading] = useState(true);
	const { download, isLoading } = useDownload();

	useEffect(() => {
		if (!id) return;
		async function loadArtist() {
			try {
				const data = await fetchData("content/tracklist", { id, type: "artist" });
				setArtist(data?.artist || data);
				setReleases(data?.releases || {});
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadArtist();
	}, [id]);

	const albumUrl = (albumId: string) => `https://www.deezer.com/album/${albumId}`;
	const handleDownload = (albumId: string) => download(albumUrl(albumId));

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

	const tabKeys = Object.keys(releases).filter((k) => releases[k]?.length > 0);

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
					{artist.nb_fan && (
						<p className="text-sm text-muted-foreground">
							{artist.nb_fan.toLocaleString()} fans
						</p>
					)}
				</div>
			</div>

			<Separator />

			{/* Release Tabs */}
			{tabKeys.length > 0 && (
				<Tabs
					value={tab}
					onValueChange={(val: string | null) => val && setTab(val)}
				>
					<TabsList variant="line">
						{tabKeys.map((key) => (
							<TabsTrigger key={key} value={key}>
								{key.charAt(0).toUpperCase() + key.slice(1)} ({releases[key].length})
							</TabsTrigger>
						))}
					</TabsList>

					{tabKeys.map((key) => (
						<TabsContent key={key} value={key} className="mt-6">
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
								{releases[key].map((album: any) => {
									const albumId = album.id || album.ALB_ID;
									const albumTitle = album.title || album.ALB_TITLE;
									const albumCover =
										album.cover_medium ||
										album.cover_big ||
										getCoverUrl(album.ALB_PICTURE, 250) ||
										"/placeholder.jpg";

									return (
										<div key={albumId} className="group space-y-2">
											<div className="relative overflow-hidden rounded-lg">
												<Link href={`/album?id=${albumId}`}>
													<CoverImage
														src={albumCover}
														alt={albumTitle}
														loading="lazy"
														className="w-full aspect-square transition-opacity group-hover:opacity-80"
													/>
												</Link>
												<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
													<Button
														size="sm"
														onClick={() => handleDownload(albumId)}
														disabled={isLoading(albumUrl(albumId))}
														className="gap-1.5"
													>
														{isLoading(albumUrl(albumId)) && <Loader2 className="size-3 animate-spin" />}
														{isLoading(albumUrl(albumId)) ? "Adding..." : "Download"}
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
													{(album.nb_tracks || album.NUMBER_TRACK) ? ` \u00b7 ${album.nb_tracks || album.NUMBER_TRACK} tracks` : ""}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						</TabsContent>
					))}
				</Tabs>
			)}

			{/* Fallback if no categorized releases */}
			{tabKeys.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-medium text-muted-foreground">No releases</p>
					<p className="text-xs text-muted-foreground">No discography found for this artist.</p>
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
