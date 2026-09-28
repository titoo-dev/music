"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { fetchData } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCommandStore } from "@/stores/useCommandStore";
import { CoverImage } from "@/components/ui/cover-image";
import { Button } from "@/components/ui/button";
import { Music, Disc3, User as UserIcon } from "lucide-react";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { EmptyState, Spinner } from "@/components/motion/icons";
import { cn } from "@/lib/utils";

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

interface FollowedArtistItem {
	id: string;
	deezerArtistId: string;
	name: string;
	pictureUrl: string | null;
	followedAt: string;
}

type Tab = "recent" | "tracks" | "albums" | "playlists" | "following";

const TABS: { key: Tab; label: string }[] = [
	{ key: "recent", label: "Recent" },
	{ key: "tracks", label: "Tracks" },
	{ key: "albums", label: "Albums" },
	{ key: "playlists", label: "Playlists" },
	{ key: "following", label: "Following" },
];

function fmtRelative(dateStr: string): string {
	const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
	const min = Math.floor(diff / 60_000);
	if (min < 1) return "Just now";
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	if (day < 7) return `${day}d ago`;
	return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function PlaylistCover({ covers, title }: { covers?: string[]; title: string }) {
	const imgs = covers?.slice(0, 4) || [];
	if (imgs.length === 0) {
		return (
			<div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
				<Music className="size-10 text-muted-foreground/30" />
			</div>
		);
	}
	if (imgs.length < 4) {
		return (
			<CoverImage
				src={imgs[0]}
				alt={title}
				loading="lazy"
				className="w-full aspect-square rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
			/>
		);
	}
	return (
		<div className="w-full aspect-square grid grid-cols-2 grid-rows-2 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-[1.02]">
			{imgs.map((src, i) => (
				<CoverImage key={i} src={src} alt="" loading="lazy" className="w-full h-full rounded-none" />
			))}
		</div>
	);
}

/** Grid card: cover on top, title + meta underneath. */
function GridCard({
	href,
	index,
	cover,
	title,
	meta,
	round = false,
}: {
	href: string;
	index: number;
	cover: React.ReactNode;
	title: string;
	meta: React.ReactNode;
	round?: boolean;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.03, ease: "easeOut" }}
			className="min-w-0"
		>
			<Link href={href} className={cn("group block no-underline", round && "text-center")}>
				<div className={cn("overflow-hidden ring-1 ring-border", round ? "rounded-full" : "rounded-lg")}>
					{cover}
				</div>
				<div className="mt-2 min-w-0">
					<p className="text-sm font-medium truncate text-foreground">{title}</p>
					<div className="text-xs text-muted-foreground truncate tabular-nums">{meta}</div>
				</div>
			</Link>
		</motion.div>
	);
}

const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6";
const LIST = "divide-y divide-border border-y border-border";

function LibraryContent() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const searchParams = useSearchParams();
	const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
	const [albums, setAlbums] = useState<UserAlbum[]>([]);
	const [tracks, setTracks] = useState<SavedTrackItem[]>([]);
	const [recentPlays, setRecentPlays] = useState<RecentPlayItem[]>([]);
	const [followedArtists, setFollowedArtists] = useState<FollowedArtistItem[]>([]);
	const [loading, setLoading] = useState(true);
	const initialTab = (searchParams.get("tab") as Tab) || "recent";
	const [tab, setTab] = useState<Tab>(
		["recent", "tracks", "albums", "playlists", "following"].includes(initialTab) ? initialTab : "recent"
	);

	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}
		(async () => {
			setLoading(true);
			try {
				const [pls, als, tks, rps, ars] = await Promise.all([
					fetchData("playlists").catch(() => []),
					fetchData("library/albums").catch(() => ({ items: [] })),
					fetchData("library/tracks", { limit: "200" }).catch(() => ({ items: [] })),
					fetchData("recent-plays", { limit: "100" }).catch(() => ({ items: [] })),
					fetchData("library/artists").catch(() => ({ items: [] })),
				]);
				setPlaylists(Array.isArray(pls) ? pls : []);
				setAlbums((als as { items?: UserAlbum[] }).items || []);
				setTracks((tks as { items?: SavedTrackItem[] }).items || []);
				setRecentPlays((rps as { items?: RecentPlayItem[] }).items || []);
				setFollowedArtists((ars as { items?: FollowedArtistItem[] }).items || []);
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
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="pt-2"
			>
				<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight m-0">Library</h1>
				<EmptyState
					className="mt-8"
					title="Sign in to see your library"
					description="Saved tracks, albums, playlists and followed artists live here."
					action={
						<Link href="/login" className="no-underline">
							<Button>Sign in</Button>
						</Link>
					}
				/>
			</motion.div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
				<Spinner size={20} />
			</div>
		);
	}

	return (
		<div className="pt-2">
			{/* Page header */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
				className="mb-6"
			>
				<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight m-0">Library</h1>
				<p className="mt-1 text-sm text-muted-foreground tabular-nums">
					{playlists.length} playlist{playlists.length !== 1 ? "s" : ""} · {albums.length} album{albums.length !== 1 ? "s" : ""} · {totalTracks} tracks · {followedArtists.length} artist{followedArtists.length !== 1 ? "s" : ""}
				</p>
			</motion.div>

			{/* Tabs */}
			<div
				role="tablist"
				aria-label="Library sections"
				className="mb-6 inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-lg border border-border bg-muted/50 p-0.5"
			>
				{TABS.map((t) => {
					const active = tab === t.key;
					const count =
						t.key === "playlists"
							? playlists.length
							: t.key === "albums"
								? albums.length
								: t.key === "recent"
									? recentPlays.length
									: t.key === "following"
										? followedArtists.length
										: tracks.length;
					return (
						<button
							key={t.key}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setTab(t.key)}
							className={cn(
								"relative shrink-0 h-9 md:h-7 rounded-md px-3 text-sm whitespace-nowrap cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
								active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
							)}
						>
							{active && (
								<motion.span
									layoutId="library-tab-indicator"
									className="absolute inset-0 rounded-md bg-background shadow-sm"
									transition={{ type: "spring", stiffness: 500, damping: 38 }}
								/>
							)}
							<span className="relative">
								{t.label}
								<span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{count}</span>
							</span>
						</button>
					);
				})}
			</div>

			<motion.div
				key={tab}
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25, ease: "easeOut" }}
			>
			{/* Recent plays list */}
			{tab === "recent" && (
				recentPlays.length === 0 ? (
					<LibraryEmpty
						title="Nothing yet"
						hint="Play a track for at least 30 seconds and it'll show up here."
						actionLabel="Open search"
					/>
				) : (
					<div className={LIST}>
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
									<span className="hidden md:block absolute right-[88px] top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none tabular-nums">
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
					<LibraryEmpty
						title="No playlists"
						hint="Create one to organize your music."
						actionHref="/my-playlists"
						actionLabel="Manage playlists"
					/>
				) : (
					<div className={GRID}>
						{playlists.map((pl, i) => (
							<GridCard
								key={pl.id}
								index={i}
								href={`/my-playlists/${pl.id}`}
								cover={<PlaylistCover covers={pl.covers} title={pl.title} />}
								title={pl.title}
								meta={
									<>
										{pl._count.tracks} track{pl._count.tracks !== 1 ? "s" : ""} ·{" "}
										{new Date(pl.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
									</>
								}
							/>
						))}
					</div>
				)
			)}

			{/* Albums grid */}
			{tab === "albums" && (
				albums.length === 0 ? (
					<LibraryEmpty
						title="No saved albums"
						hint="Save an album from search to start your collection."
						actionLabel="Open search"
					/>
				) : (
					<div className={GRID}>
						{albums.map((album, i) => (
							<GridCard
								key={album.id}
								index={i}
								href={`/album?id=${album.deezerAlbumId}`}
								cover={
									album.coverUrl ? (
										<CoverImage
											src={album.coverUrl}
											alt={album.title}
											loading="lazy"
											className="w-full aspect-square rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
										/>
									) : (
										<div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
											<Disc3 className="size-10 text-muted-foreground/30" />
										</div>
									)
								}
								title={album.title}
								meta={<>{album.artist} · {album.trackCount} tracks</>}
							/>
						))}
					</div>
				)
			)}

			{/* Followed artists grid */}
			{tab === "following" && (
				followedArtists.length === 0 ? (
					<LibraryEmpty
						title="No followed artists"
						hint="Tap the heart on an artist page to start following them."
						actionLabel="Open search"
					/>
				) : (
					<div className={GRID}>
						{followedArtists.map((artist, i) => (
							<GridCard
								key={artist.id}
								index={i}
								round
								href={`/artist?id=${artist.deezerArtistId}`}
								cover={
									artist.pictureUrl ? (
										<CoverImage
											src={artist.pictureUrl}
											alt={artist.name}
											loading="lazy"
											className="w-full aspect-square rounded-full transition-transform duration-300 group-hover:scale-[1.02]"
										/>
									) : (
										<div className="w-full aspect-square rounded-full bg-muted flex items-center justify-center">
											<UserIcon className="size-10 text-muted-foreground/30" aria-hidden />
										</div>
									)
								}
								title={artist.name}
								meta={<>Followed {fmtRelative(artist.followedAt).toLowerCase()}</>}
							/>
						))}
					</div>
				)
			)}

			{/* Saved tracks list ("Liked Songs") */}
			{tab === "tracks" && (
				tracks.length === 0 ? (
					<LibraryEmpty
						title="No saved tracks"
						hint="Tap the heart icon on any track to save it to your library."
						actionLabel="Open search"
					/>
				) : (
					<div className={LIST}>
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
									<span className="hidden md:block absolute right-[88px] top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none tabular-nums">
										{fmtRelative(item.savedAt)}
									</span>
								</div>
							));
						})()}
					</div>
				)
			)}
			</motion.div>
		</div>
	);
}

export default function LibraryPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
					<Spinner size={20} />
				</div>
			}
		>
			<LibraryContent />
		</Suspense>
	);
}

/** Empty tab. Without `actionHref` the CTA opens the ⌘K search palette. */
function LibraryEmpty({
	title,
	hint,
	actionHref,
	actionLabel,
}: {
	title: string;
	hint: string;
	actionHref?: string;
	actionLabel: string;
}) {
	return (
		<EmptyState
			title={title}
			description={hint}
			action={
				actionHref ? (
					<Link href={actionHref} className="no-underline">
						<Button variant="outline" size="sm">{actionLabel}</Button>
					</Link>
				) : (
					<Button variant="outline" size="sm" onClick={() => useCommandStore.getState().open()}>
						{actionLabel}
					</Button>
				)
			}
		/>
	);
}
