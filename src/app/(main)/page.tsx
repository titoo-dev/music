"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { useLoginStore } from "@/stores/useLoginStore";
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
	const loggedIn = useLoginStore((s) => s.loggedIn);
	const user = useLoginStore((s) => s.user);

	useEffect(() => {
		async function loadHome() {
			try {
				const data = await fetchData("home");
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

	if (!loggedIn) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Get started with deemix
					</h1>
					<p className="text-sm text-muted-foreground max-w-md">
						You need a Deezer ARL token to start downloading music.
						Head to Settings to log in.
					</p>
				</div>
				<Card className="max-w-sm w-full">
					<CardHeader>
						<CardTitle>Not logged in</CardTitle>
						<CardDescription>
							Connect your Deezer account to access your library and
							download music.
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
									<img
										src={chartPicture}
										alt={chartTitle}
										loading="lazy"
										className="w-full aspect-square object-cover transition-transform duration-200 group-hover:scale-[1.02]"
									/>
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
										<Button
											size="sm"
											onClick={() =>
												handleDownload(item.id, "playlist")
											}
											disabled={isLoading(deezerUrl(item.id, "playlist"))}
											className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1.5"
										>
											{isLoading(deezerUrl(item.id, "playlist")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
											{isLoading(deezerUrl(item.id, "playlist")) ? "Adding..." : "Download"}
										</Button>
									</div>
									<div className="p-3">
										<p className="text-sm font-medium truncate">
											{chartTitle}
										</p>
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
