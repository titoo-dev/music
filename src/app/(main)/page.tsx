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
import { Download, ArrowRight, Loader2 } from "lucide-react";
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

export default function HomePage() {
	const [charts, setCharts] = useState<ChartItem[]>([]);
	const [loading, setLoading] = useState(true);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const isDeezerConnected = useAuthStore((s) => s.isDeezerConnected);

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

	const { download, isLoading } = useDownload();
	const deezerUrl = (id: string, type: string) => `https://www.deezer.com/${type}/${id}`;
	const handleDownload = (id: string, type: string) => download(deezerUrl(id, type));

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Get started with deemix
					</h1>
					<p className="text-sm text-muted-foreground max-w-md">
						Sign in to download music and manage your playlists.
					</p>
				</div>
				<Card className="max-w-sm w-full">
					<CardHeader>
						<CardTitle>Welcome to deemix</CardTitle>
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

	if (!isDeezerConnected) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Connect your Deezer account
					</h1>
					<p className="text-sm text-muted-foreground max-w-md">
						You need a Deezer ARL token to browse and download music.
						Head to Settings to connect.
					</p>
				</div>
				<Card className="max-w-sm w-full">
					<CardHeader>
						<CardTitle>Deezer not connected</CardTitle>
						<CardDescription>
							Add your Deezer ARL in Settings to access your library and download music.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/settings">
							<Button className="w-full gap-2">
								Go to Settings
								<ArrowRight className="size-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Welcome back{user?.name ? `, ${user.name}` : ""}
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Browse charts or search for something to download.
				</p>
			</div>

			{charts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-medium text-muted-foreground">No charts available</p>
					<p className="text-xs text-muted-foreground">Charts could not be loaded. Try again later.</p>
				</div>
			) : (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-medium">Top Charts</h2>
						<span className="text-xs text-muted-foreground">
							{charts.length} playlists
						</span>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
									className="group relative rounded-xl overflow-hidden bg-muted/30"
								>
									<Link href={`/playlist?id=${item.id}`}>
										<CoverImage
											src={chartPicture}
											alt={chartTitle}
											loading="lazy"
											className="w-full aspect-square transition-transform duration-200 group-hover:scale-[1.02]"
										/>
									</Link>
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center pointer-events-none">
										<Button
											size="sm"
											onClick={() =>
												handleDownload(item.id, "playlist")
											}
											disabled={isLoading(deezerUrl(item.id, "playlist"))}
											className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1.5 pointer-events-auto"
										>
											{isLoading(deezerUrl(item.id, "playlist")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
											{isLoading(deezerUrl(item.id, "playlist")) ? "Adding..." : "Download"}
										</Button>
									</div>
									<div className="p-3">
										<Link
											href={`/playlist?id=${item.id}`}
											className="text-sm font-medium truncate block hover:underline"
										>
											{chartTitle}
										</Link>
										{item.nb_tracks && (
											<p className="text-xs text-muted-foreground mt-0.5">
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
