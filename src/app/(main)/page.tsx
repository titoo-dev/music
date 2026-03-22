"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
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
import { ArrowRight, Loader2, Music, Disc3 } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";

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
	const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
	const [albums, setAlbums] = useState<UserAlbum[]>([]);
	const [loading, setLoading] = useState(true);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);

	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}
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
			setLoading(false);
		}
		loadUserData();
	}, [isAuthenticated]);

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
					Search for something to download.
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

		</div>
	);
}
