"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Disc3, Search, Clock } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";

interface UserPlaylist {
	id: string;
	title: string;
	description: string | null;
	updatedAt: string;
	_count: { tracks: number };
	covers?: string[];
}

interface UserAlbum {
	id: string;
	deezerAlbumId: string;
	title: string;
	artist: string;
	coverUrl: string | null;
	trackCount: number;
	savedAt: string;
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

interface RecentPlayItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	duration: number | null;
	playedAt: string;
}

interface HomeContentProps {
	playlists: UserPlaylist[];
	albums: UserAlbum[];
	recentPlays: RecentPlayItem[];
	user: { name: string } | null;
}

function todayLabel() {
	const now = new Date();
	const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
	const day = now.toLocaleDateString("en-US", { weekday: "short" });
	const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	return `${time} · ${day} · ${date}`.toUpperCase();
}

export function HomeContent({ playlists, albums, recentPlays, user }: HomeContentProps) {
	if (!user) {
		return (
			<div className="max-w-3xl mx-auto py-10">
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					NOT SIGNED IN · GUEST MODE
				</p>
				<h1 className="text-brutal-xl m-0 leading-[0.95]">
					GET STARTED<br />
					<span className="text-primary">WITH DEEMIX.</span>
				</h1>
				<p className="mt-4 text-sm font-bold uppercase tracking-[0.04em] text-muted-foreground max-w-md">
					Sign in to download music · Manage playlists · Track your library.
				</p>
				<div className="mt-7 flex gap-3 flex-wrap">
					<Link href="/login" className="no-underline">
						<Button size="lg" className="gap-2 font-mono uppercase tracking-[0.1em]">
							Sign in
							<ArrowRight className="size-4" />
						</Button>
					</Link>
					<Link href="/search" className="no-underline">
						<Button size="lg" variant="outline" className="gap-2 font-mono uppercase tracking-[0.1em]">
							<Search className="size-4" />
							Browse as guest
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const totalTracks = albums.reduce((s, a) => s + (a.trackCount || 0), 0)
		+ playlists.reduce((s, p) => s + (p._count?.tracks || 0), 0);
	const recentAlbums = [...albums]
		.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
		.slice(0, 8);

	return (
		<div>
			{/* Page Header */}
			<div className="mb-7">
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					{todayLabel()}
				</p>
				<div className="flex items-end justify-between gap-6 flex-wrap">
					<div className="min-w-0 flex-1">
						<h1 className="text-brutal-xl m-0 max-w-[15ch]">
							WELCOME BACK,{" "}
							<span className="text-primary">
								{(user.name || "USER").toUpperCase()}.
							</span>
						</h1>
						<p className="mt-3 text-sm font-bold uppercase tracking-[0.04em] text-muted-foreground">
							{albums.length} ALBUM{albums.length !== 1 ? "S" : ""} · {playlists.length} PLAYLIST{playlists.length !== 1 ? "S" : ""} · {totalTracks} TRACKS
						</p>
					</div>
					<Link href="/search" className="no-underline">
						<Button size="lg" className="gap-2 bg-accent text-foreground border-foreground hover:bg-accent/80 font-mono uppercase tracking-[0.1em]">
							<Search className="size-4" />
							Paste link
						</Button>
					</Link>
				</div>
			</div>

			{/* Receipt ticker — recent additions */}
			{recentAlbums.length > 0 && (
				<div className="mb-9 border-2 sm:border-[3px] border-foreground bg-foreground text-accent overflow-hidden whitespace-nowrap">
					<div className="flex animate-[ticker_40s_linear_infinite] py-2 gap-10 font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
						{[0, 1].map((k) =>
							recentAlbums.map((a, i) => (
								<span key={`${k}-${i}`} className="shrink-0 mr-10">
									▸ {a.title} · {a.artist} · {a.trackCount} TR
								</span>
							))
						)}
					</div>
				</div>
			)}

			{/* Recently Played */}
			{recentPlays.length > 0 && (
				<section className="mb-11">
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-5 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0 flex items-center gap-2">
								<Clock className="size-4 -mt-0.5" strokeWidth={2.5} />
								RECENTLY PLAYED
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{recentPlays.length} TRACK{recentPlays.length !== 1 ? "S" : ""}
							</span>
						</div>
						<Link
							href="/library?tab=recent"
							className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-primary hover:underline flex items-center gap-1"
						>
							VIEW ALL
							<ArrowRight className="size-3" />
						</Link>
					</div>
					<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
						{recentPlays.slice(0, 8).map((item) => {
							const t: TrackRowTrack = {
								trackId: item.trackId,
								title: item.title,
								artist: item.artist,
								album: item.album,
								albumId: item.albumId,
								cover: item.coverUrl,
								duration: item.duration,
								bitrateLabel: null,
							};
							return (
								<TrackRow
									key={item.id}
									track={t}
									showBitrate={false}
									showDuration={true}
								/>
							);
						})}
					</div>
				</section>
			)}

			{/* User Playlists */}
			{playlists.length > 0 && (
				<section className="mb-11">
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-5 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								MY PLAYLISTS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{playlists.length} COLLECTION{playlists.length !== 1 ? "S" : ""}
							</span>
						</div>
						<Link
							href="/my-playlists"
							className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-primary hover:underline flex items-center gap-1"
						>
							VIEW ALL
							<ArrowRight className="size-3" />
						</Link>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
						{playlists.slice(0, 10).map((pl) => (
							<Link
								key={pl.id}
								href={`/my-playlists/${pl.id}`}
								className="group border-2 sm:border-[3px] border-foreground bg-card overflow-hidden no-underline shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
							>
								<PlaylistCover covers={pl.covers} title={pl.title} />
								<div className="p-2.5 border-t-[2px] border-foreground">
									<p className="text-[12px] font-extrabold uppercase tracking-[-0.01em] truncate leading-[1.15]">
										{pl.title}
									</p>
									<div className="flex justify-between items-baseline mt-1">
										<span className="text-[10px] font-mono text-muted-foreground tabular-nums">
											{pl._count.tracks} TR
										</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* User Albums */}
			{albums.length > 0 && (
				<section className="mb-11">
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-5 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								MY ALBUMS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{albums.length} RECORD{albums.length !== 1 ? "S" : ""}
							</span>
						</div>
						<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
							SORT BY DATE ↓
						</span>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
						{recentAlbums.slice(0, 10).map((album) => (
							<Link
								key={album.id}
								href={`/my-albums/${album.id}`}
								className="group border-2 sm:border-[3px] border-foreground bg-card overflow-hidden no-underline shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
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
								<div className="p-2.5 border-t-[2px] border-foreground">
									<p className="text-[12px] font-extrabold uppercase tracking-[-0.01em] truncate leading-[1.15]">
										{album.title}
									</p>
									<div className="flex justify-between items-baseline mt-1 gap-2">
										<span className="text-[10px] font-mono text-muted-foreground truncate">
											{album.artist}
										</span>
										<span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
											{album.trackCount} TR
										</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Empty state if neither */}
			{playlists.length === 0 && albums.length === 0 && (
				<div className="border-2 sm:border-[3px] border-foreground bg-card flex flex-col items-center justify-center py-20 px-6 gap-3 shadow-[var(--shadow-brutal)]">
					<div className="text-3xl font-black tracking-[0.2em]">∅</div>
					<p className="text-sm font-black uppercase tracking-[0.14em]">
						LIBRARY EMPTY
					</p>
					<p className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.05em] text-center max-w-xs">
						Paste a Deezer link in search to download your first album.
					</p>
					<Link href="/search" className="no-underline mt-2">
						<Button size="sm" className="gap-2 font-mono uppercase tracking-[0.1em]">
							<Search className="size-3.5" />
							Open search
						</Button>
					</Link>
				</div>
			)}
		</div>
	);
}
