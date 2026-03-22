"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { useAuthStore } from "@/stores/useAuthStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Download, ArrowRight, Loader2, Music, Disc3 } from "lucide-react";
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

interface ChartItem {
	id: string;
	title: string;
	picture_medium?: string;
	picture_xl?: string;
	PLAYLIST_PICTURE?: string;
	TITLE?: string;
	nb_tracks?: number;
}

interface UserPlaylist {
	id: string;
	title: string;
	description: string | null;
	updatedAt: string;
	_count: { tracks: number };
	covers?: string[];
}

function PlaylistCover({ covers, title }: { covers?: string[]; title: string }) {
	const imgs = covers?.slice(0, 4) || [];

	if (imgs.length === 0) {
		return (
			<div className="w-full aspect-square bg-muted flex items-center justify-center">
				<Music className="size-12 text-muted-foreground/30" />
			</div>
		);
	}

	if (imgs.length < 4) {
		return (
			<CoverImage
				src={imgs[0]}
				alt={title}
				loading="lazy"
				className="w-full aspect-square border-0"
			/>
		);
	}

	return (
		<div className="w-full aspect-square grid grid-cols-2 grid-rows-2 overflow-hidden">
			{imgs.map((src, i) => (
				<CoverImage
					key={i}
					src={src}
					alt=""
					loading="lazy"
					className="w-full h-full border-0"
				/>
			))}
		</div>
	);
}

interface UserAlbum {
	id: string;
	deezerAlbumId: string;
	title: string;
	artist: string;
	coverUrl: string | null;
	trackCount: number;
	downloadedAt: string;
}

export default function HomePage() {
	const [charts, setCharts] = useState<ChartItem[]>([]);
	const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
	const [albums, setAlbums] = useState<UserAlbum[]>([]);
	const [loading, setLoading] = useState(true);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	useEffect(() => {
		async function loadHome() {
			try {
				const data = await fetchData("content/home");
				if (data?.data) setCharts(data.data);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadHome();
	}, []);

	useEffect(() => {
		if (!isAuthenticated) return;
		async function loadUserData() {
			try {
				const [playlistData, albumData] = await Promise.all([
					fetchData("playlists").catch(() => null),
					fetchData("albums").catch(() => null),
				]);
				if (playlistData) setPlaylists(playlistData);
				if (albumData) setAlbums(albumData);
			} catch {
				// ignore
			}
		}
		loadUserData();
	}, [isAuthenticated]);

	const { download, isLoading } = useDownload();
	const deezerUrl = (id: string, type: string) => `https://www.deezer.com/${type}/${id}`;
	const handleDownload = (id: string, type: string) => download(deezerUrl(id, type));

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
				<div className="text-center space-y-4">
					<h1 className="text-brutal-xl">
						GET STARTED<br />
						<span className="text-primary">WITH DEEMIX</span>
					</h1>
					<p className="text-sm text-muted-foreground max-w-md font-medium">
						Sign in to download music and manage your playlists.
					</p>
				</div>
				<Card className="max-w-sm w-full">
					<CardHeader>
						<CardTitle>Welcome to DEEMIX</CardTitle>
						<CardDescription>
							Sign in with Google to get started, or browse as a guest.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<Link href="/login">
							<Button className="w-full gap-2">
								Sign in
								<ArrowRight className="size-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			<div>
				<h1 className="text-brutal-lg">
					Welcome back{user?.name ? `, ${user.name}` : ""}
				</h1>
				<p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wider">
					Browse charts or search for something to download.
				</p>
			</div>

			{/* User Playlists */}
			{playlists.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-brutal-md">My Playlists</h2>
						<Link
							href="/my-playlists"
							className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider"
						>
							View all
							<ArrowRight className="size-3" />
						</Link>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
						{playlists.slice(0, 10).map((pl) => (
							<Link
								key={pl.id}
								href={`/my-playlists/${pl.id}`}
								className="group border-2 sm:border-[3px] border-foreground bg-card overflow-hidden no-underline shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
							>
								<PlaylistCover covers={pl.covers} title={pl.title} />
								<div className="p-3 border-t-[2px] border-foreground">
									<p className="text-sm font-bold truncate">
										{pl.title}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5 font-mono">
										{pl._count.tracks} track{pl._count.tracks !== 1 ? "s" : ""}
									</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* User Albums */}
			{albums.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-brutal-md">My Albums</h2>
						<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
							{albums.length} album{albums.length !== 1 ? "s" : ""}
						</span>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
						{albums.slice(0, 10).map((album) => (
							<Link
								key={album.id}
								href={`/my-albums/${album.id}`}
								className="group border-2 sm:border-[3px] border-foreground bg-card overflow-hidden no-underline shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
							>
								<div className="w-full aspect-square bg-muted flex items-center justify-center">
									{album.coverUrl ? (
										<CoverImage
											src={album.coverUrl}
											alt={album.title}
											loading="lazy"
											className="w-full aspect-square border-0"
										/>
									) : (
										<Disc3 className="size-12 text-muted-foreground/30" />
									)}
								</div>
								<div className="p-3 border-t-[2px] border-foreground">
									<p className="text-sm font-bold truncate">
										{album.title}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5 truncate">
										{album.artist}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5 font-mono">
										{album.trackCount} track{album.trackCount !== 1 ? "s" : ""}
									</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{charts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-bold text-foreground uppercase tracking-wider">No charts available</p>
					<p className="text-xs text-muted-foreground">Charts could not be loaded. Try again later.</p>
				</div>
			) : (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-brutal-md">Top Charts</h2>
						<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
							{charts.length} playlists
						</span>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
						{charts.slice(0, 20).map((item) => {
							const chartTitle = item.title || item.TITLE || "Chart";
							const chartPicture =
								item.picture_xl ||
								item.picture_medium ||
								getCoverUrl(item.PLAYLIST_PICTURE || "", 500) ||
								"/placeholder.jpg";

							return (
								<div
									key={item.id}
									className="group relative border-2 sm:border-[3px] border-foreground bg-card overflow-hidden shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
								>
									<Link href={`/playlist?id=${item.id}`}>
										<CoverImage
											src={chartPicture}
											alt={chartTitle}
											loading="lazy"
											className="w-full aspect-square border-0"
										/>
									</Link>
									<div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
										<Button
											size="sm"
											onClick={() =>
												handleDownload(item.id, "playlist")
											}
											disabled={isLoading(deezerUrl(item.id, "playlist"))}
											className="gap-1.5 pointer-events-auto"
										>
											{isLoading(deezerUrl(item.id, "playlist")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
											{isLoading(deezerUrl(item.id, "playlist")) ? "Adding..." : "Download"}
										</Button>
									</div>
									<div className="p-3 border-t-[2px] border-foreground">
										<Link
											href={`/playlist?id=${item.id}`}
											className="text-sm font-bold truncate block hover:underline"
										>
											{chartTitle}
										</Link>
										{item.nb_tracks && (
											<p className="text-xs text-muted-foreground mt-0.5 font-mono">
												{item.nb_tracks} tracks
											</p>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</section>
			)}
		</div>
	);
}
