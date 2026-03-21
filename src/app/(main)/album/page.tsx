"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData, postToServer } from "@/utils/api";
import { convertDuration } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PreviewButton } from "@/components/audio/PreviewButton";
import { Loader2 } from "lucide-react";

function getCoverUrl(picture: string, size = 500) {
	if (!picture) return "/placeholder.jpg";
	if (picture.startsWith("http")) return picture;
	return `https://e-cdns-images.dzcdn.net/images/cover/${picture}/${size}x${size}-000000-80-0-0.jpg`;
}

function AlbumContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [album, setAlbum] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		async function loadAlbum() {
			try {
				const data = await fetchData("tracklist", { id, type: "album" });
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

	const handleDownloadAll = () => {
		postToServer("add-to-queue", { url: `https://www.deezer.com/album/${id}`, bitrate: null });
	};

	const handleDownloadTrack = (trackId: string) => {
		postToServer("add-to-queue", { url: `https://www.deezer.com/track/${trackId}`, bitrate: null });
	};

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	if (!album)
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-medium text-muted-foreground">Album not found</p>
				<p className="text-xs text-muted-foreground">The album you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
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
				<img
					src={cover}
					alt={title}
					className="w-48 h-48 rounded-lg object-cover flex-shrink-0"
				/>
				<div className="flex flex-col justify-end gap-3">
					<Badge variant="secondary" className="w-fit">
						{recordType}
					</Badge>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						{title}
					</h1>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
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
					<Button onClick={handleDownloadAll} className="w-fit mt-1">
						Download album
					</Button>
				</div>
			</div>

			<Separator />

			{/* Tracklist */}
			<div>
				<h2 className="text-xs font-medium text-muted-foreground mb-4">
					Tracklist
				</h2>
				{tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<p className="text-sm font-medium text-muted-foreground">No tracks</p>
						<p className="text-xs text-muted-foreground">The tracklist for this album is unavailable.</p>
					</div>
				) : (
				<div className="rounded-lg border border-border overflow-hidden">
					{tracks.map((track: any, idx: number) => {
						const trackTitle = track.SNG_TITLE || track.title || "";
						const trackArtist = track.ART_NAME || track.artist?.name || "";
						const trackId = track.SNG_ID || track.id;
						const trackNum = track.TRACK_NUMBER || track.track_position || idx + 1;
						const trackDuration = track.DURATION || track.duration || 0;
						const trackCover = track.ALB_PICTURE
							? getCoverUrl(track.ALB_PICTURE, 56)
							: track.album?.cover_small;
						const previewUrl = track.MEDIA?.[0]?.HREF || track.preview || "";

						return (
							<div
								key={trackId || idx}
								className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 transition-colors hover:bg-muted group"
							>
								<span className="text-xs text-muted-foreground w-6 text-right tabular-nums">
									{trackNum}
								</span>
								{trackCover && (
									<img
										src={trackCover}
										alt=""
										className="w-9 h-9 rounded object-cover"
									/>
								)}
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate text-foreground">
										{trackTitle}
										{track.VERSION ? ` ${track.VERSION}` : ""}
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
									variant="ghost"
									size="sm"
									onClick={() => handleDownloadTrack(trackId)}
									className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
								>
									Download
								</Button>
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
