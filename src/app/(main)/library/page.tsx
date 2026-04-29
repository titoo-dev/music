"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Loader2, Music, Disc3, Heart, Clock } from "lucide-react";
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

interface SavedTrackItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	duration: number | null;
	savedAt: string;
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

type Tab = "recent" | "tracks" | "albums" | "playlists";

const TABS: { key: Tab; label: string }[] = [
	{ key: "recent", label: "RECENT" },
	{ key: "tracks", label: "TRACKS" },
	{ key: "albums", label: "ALBUMS" },
	{ key: "playlists", label: "PLAYLISTS" },
];

function fmtRelative(dateStr: string): string {
	const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
	const min = Math.floor(diff / 60_000);
	if (min < 1) return "JUST NOW";
	if (min < 60) return `${min}M AGO`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}H AGO`;
	const day = Math.floor(hr / 24);
	if (day < 7) return `${day}D AGO`;
	return new Date(dateStr)
		.toLocaleDateString(undefined, { month: "short", day: "numeric" })
		.toUpperCase();
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
				<CoverImage key={i} src={src} alt="" loading="lazy" className="w-full h-full border-0" />
			))}
		</div>
	);
}

function LibraryContent() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const searchParams = useSearchParams();
	const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
	const [albums, setAlbums] = useState<UserAlbum[]>([]);
	const [tracks, setTracks] = useState<SavedTrackItem[]>([]);
	const [recentPlays, setRecentPlays] = useState<RecentPlayItem[]>([]);
	const [loading, setLoading] = useState(true);
	const initialTab = (searchParams.get("tab") as Tab) || "recent";
	const [tab, setTab] = useState<Tab>(
		["recent", "tracks", "albums", "playlists"].includes(initialTab) ? initialTab : "recent"
	);

	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}
		(async () => {
			setLoading(true);
			try {
				const [pls, als, tks, rps] = await Promise.all([
					fetchData("playlists").catch(() => []),
					fetchData("library/albums").catch(() => ({ items: [] })),
					fetchData("library/tracks", { limit: "200" }).catch(() => ({ items: [] })),
					fetchData("recent-plays", { limit: "100" }).catch(() => ({ items: [] })),
				]);
				setPlaylists(Array.isArray(pls) ? pls : []);
				setAlbums((als as { items?: UserAlbum[] }).items || []);
				setTracks((tks as { items?: SavedTrackItem[] }).items || []);
				setRecentPlays((rps as { items?: RecentPlayItem[] }).items || []);
			} catch {
				// ignore
			}
			setLoading(false);
		})();
	}, [isAuthenticated]);

	const totalTracks = useMemo(() => {
		const fromAlbums = albums.reduce((s, a) => s + (a.trackCount || 0), 0);
		const fromPlaylists = playlists.reduce((s, p) => s + (p._count?.tracks || 0), 0);
		return Math.max(tracks.length, fromAlbums, fromPlaylists);
	}, [albums, playlists, tracks]);

	if (!isAuthenticated) {
		return (
			<div>
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					LIBRARY
				</p>
				<h1 className="text-brutal-xl m-0">
					SIGN IN TO<br />
					<span className="text-primary">SEE YOUR LIBRARY.</span>
				</h1>
				<Link href="/login" className="inline-block mt-6 no-underline">
					<button className="px-5 py-3 border-2 sm:border-[3px] border-foreground bg-primary text-white font-mono text-sm font-black tracking-[0.12em] uppercase shadow-[var(--shadow-brutal)] hover:bg-primary/90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] transition-all">
						SIGN IN
					</button>
				</Link>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div>
			{/* Page header */}
			<div className="mb-7">
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					LIBRARY
				</p>
				<div className="min-w-0">
					<h1 className="text-brutal-xl m-0">
						MY <span className="text-primary">COLLECTION.</span>
					</h1>
					<p className="mt-3 text-sm font-bold uppercase tracking-[0.04em] text-muted-foreground">
						{playlists.length} PLAYLIST{playlists.length !== 1 ? "S" : ""} · {albums.length} ALBUM{albums.length !== 1 ? "S" : ""} · {totalTracks} TRACKS
					</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b-[2px] border-foreground -mx-1 sm:mx-0 overflow-x-auto scrollbar-hide mb-6">
				{TABS.map((t, i) => {
					const active = tab === t.key;
					const count =
						t.key === "playlists"
							? playlists.length
							: t.key === "albums"
								? albums.length
								: t.key === "recent"
									? recentPlays.length
									: tracks.length;
					return (
						<button
							key={t.key}
							onClick={() => setTab(t.key)}
							className={`shrink-0 px-5 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] uppercase cursor-pointer transition-colors ${
								i < TABS.length - 1 ? "border-r-[2px] border-foreground" : ""
							} ${active ? "bg-foreground text-background" : "bg-transparent text-foreground hover:bg-accent/40"}`}
						>
							{t.label}
							<span className={`ml-1.5 ${active ? "opacity-70" : "text-muted-foreground"}`}>
								({count})
							</span>
						</button>
					);
				})}
			</div>

			{/* Recent plays list */}
			{tab === "recent" && (
				recentPlays.length === 0 ? (
					<EmptyState
						icon={<Clock className="size-7" />}
						title="NOTHING YET"
						hint="Play a track for at least 30 seconds and it'll show up here."
						actionHref="/search"
						actionLabel="OPEN SEARCH"
					/>
				) : (
					<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
						{(() => {
							const normalized: TrackRowTrack[] = recentPlays.map((item) => ({
								trackId: item.trackId,
								title: item.title,
								artist: item.artist,
								album: item.album,
								albumId: item.albumId,
								cover: item.coverUrl,
								duration: item.duration,
								bitrateLabel: null,
							}));
							return recentPlays.map((item, idx) => (
								<div key={item.id} className="relative">
									<TrackRow
										track={normalized[idx]}
										showBitrate={false}
										showDuration={false}
										queue={normalized}
									/>
									<span className="hidden md:block absolute right-[88px] top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground pointer-events-none tabular-nums">
										{fmtRelative(item.playedAt)}
									</span>
								</div>
							));
						})()}
					</div>
				)
			)}

			{/* Playlists grid */}
			{tab === "playlists" && (
				playlists.length === 0 ? (
					<EmptyState
						icon={<Music className="size-7" />}
						title="NO PLAYLISTS"
						hint="Create one to organize your music."
						actionHref="/my-playlists"
						actionLabel="MANAGE"
					/>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
						{playlists.map((pl) => (
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
									<div className="flex justify-between items-baseline mt-1 font-mono text-[10px] text-muted-foreground tabular-nums">
										<span>{pl._count.tracks} TR</span>
										<span>
											{new Date(pl.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}
										</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				)
			)}

			{/* Albums grid */}
			{tab === "albums" && (
				albums.length === 0 ? (
					<EmptyState
						icon={<Disc3 className="size-7" />}
						title="NO SAVED ALBUMS"
						hint="Save an album from search to start your collection."
						actionHref="/search"
						actionLabel="OPEN SEARCH"
					/>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
						{albums.map((album) => (
							<Link
								key={album.id}
								href={`/album?id=${album.deezerAlbumId}`}
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
									<div className="flex justify-between items-baseline mt-1 gap-2 font-mono text-[10px] text-muted-foreground">
										<span className="truncate">{album.artist}</span>
										<span className="tabular-nums shrink-0">{album.trackCount} TR</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				)
			)}

			{/* Saved tracks list ("Liked Songs") */}
			{tab === "tracks" && (
				tracks.length === 0 ? (
					<EmptyState
						icon={<Heart className="size-7" />}
						title="NO SAVED TRACKS"
						hint="Tap the heart icon on any track to save it to your library."
						actionHref="/search"
						actionLabel="OPEN SEARCH"
					/>
				) : (
					<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
						{(() => {
							const normalized: TrackRowTrack[] = tracks.map((item) => ({
								trackId: item.trackId,
								title: item.title,
								artist: item.artist,
								album: item.album,
								albumId: item.albumId,
								cover: item.coverUrl,
								duration: item.duration,
								bitrateLabel: null,
							}));
							return tracks.map((item, idx) => (
								<div key={item.id} className="relative">
									<TrackRow
										track={normalized[idx]}
										trackNumber={idx + 1}
										showBitrate={false}
										showDuration={false}
										queue={normalized}
									/>
									<span className="hidden md:block absolute right-[88px] top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground pointer-events-none tabular-nums">
										{fmtRelative(item.savedAt)}
									</span>
								</div>
							));
						})()}
					</div>
				)
			)}
		</div>
	);
}

export default function LibraryPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<LibraryContent />
		</Suspense>
	);
}

function EmptyState({
	icon,
	title,
	hint,
	actionHref,
	actionLabel,
}: {
	icon: React.ReactNode;
	title: string;
	hint: string;
	actionHref: string;
	actionLabel: string;
}) {
	return (
		<div className="border-2 sm:border-[3px] border-foreground bg-card flex flex-col items-center justify-center py-16 px-6 gap-3 shadow-[var(--shadow-brutal)]">
			<div className="flex items-center justify-center w-14 h-14 border-[3px] border-foreground bg-muted">
				{icon}
			</div>
			<p className="text-sm font-black uppercase tracking-[0.14em]">{title}</p>
			<p className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.05em] text-center max-w-xs">
				{hint}
			</p>
			<Link href={actionHref} className="no-underline mt-2">
				<button className="px-4 py-2 border-2 border-foreground bg-card text-foreground font-mono text-[11px] font-bold tracking-[0.1em] uppercase shadow-[var(--shadow-brutal-sm)] hover:bg-accent active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] transition-all">
					{actionLabel}
				</button>
			</Link>
		</div>
	);
}
