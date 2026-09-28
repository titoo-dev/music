"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Music, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { MediaCard, CardGrid, SectionHeader } from "@/components/cards/MediaCard";
import { DownloadGlyph, EmptyState, LogoMark, PlayPauseIcon, SlideSwap, WaveLine } from "@/components/motion/icons";
import { useCommandStore } from "@/stores/useCommandStore";
import { ModKey } from "@/components/command/CommandPalette";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { useDownloadStore } from "@/stores/useDownloadStore";
import { cn } from "@/lib/utils";

export interface UserPlaylist {
	id: string;
	title: string;
	description: string | null;
	updatedAt: string;
	_count: { tracks: number };
	covers?: string[];
}

export interface UserAlbum {
	id: string;
	deezerAlbumId: string;
	title: string;
	artist: string;
	coverUrl: string | null;
	trackCount: number;
	savedAt: string;
}

export interface RecentPlayItem {
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

export interface SavedTrackItem {
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

interface HomeContentProps {
	playlists: UserPlaylist[];
	albums: UserAlbum[];
	recentPlays: RecentPlayItem[];
	tracks: SavedTrackItem[];
	user: { name: string } | null;
}

type Filter = "all" | "tracks" | "albums" | "playlists" | "recent";
type Sort = "added" | "title" | "artist";

const PAGE = 100;

function greeting() {
	const h = new Date().getHours();
	if (h < 5) return "Up late";
	if (h < 12) return "Good morning";
	if (h < 18) return "Good afternoon";
	return "Good evening";
}

function toRow(t: SavedTrackItem | RecentPlayItem): TrackRowTrack {
	return {
		trackId: t.trackId,
		title: t.title,
		artist: t.artist,
		album: t.album,
		albumId: t.albumId,
		cover: t.coverUrl,
		duration: t.duration,
		bitrateLabel: null,
	};
}

function toPlayer(t: TrackRowTrack): PlayerTrack {
	return { trackId: t.trackId, title: t.title, artist: t.artist, artistId: t.artistId ?? null, cover: t.cover, duration: t.duration ?? null };
}

function Segmented<T extends string>({
	id,
	value,
	onChange,
	options,
}: {
	id: string;
	value: T;
	onChange: (v: T) => void;
	options: { value: T; label: string; count?: number }[];
}) {
	return (
		<LayoutGroup id={id}>
			<div role="tablist" className="scrollbar-hide inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-muted/50 p-0.5">
				{options.map((o) => (
					<button
						key={o.value}
						role="tab"
						type="button"
						aria-selected={value === o.value}
						onClick={() => onChange(o.value)}
						className={cn(
							"relative flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-[13px] transition-colors",
							value === o.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
						)}
					>
						{value === o.value && (
							<motion.span
								layoutId={`${id}-pill`}
								className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border"
								transition={{ type: "spring", stiffness: 500, damping: 38 }}
							/>
						)}
						<span className="relative">{o.label}</span>
						{o.count !== undefined && <span className="relative font-mono text-[11px] tabular-nums text-muted-foreground">{o.count}</span>}
					</button>
				))}
			</div>
		</LayoutGroup>
	);
}

function TrackList({ tracks, emptyTitle }: { tracks: TrackRowTrack[]; emptyTitle: string }) {
	const [limit, setLimit] = useState(PAGE);
	if (tracks.length === 0) return <EmptyState title={emptyTitle} description="Save tracks with the heart icon and they'll show up here." />;
	const shown = tracks.slice(0, limit);
	return (
		<div>
			<div className="-mx-2 space-y-px">
				{shown.map((t, i) => (
					<TrackRow key={`${t.trackId}-${i}`} track={t} trackNumber={i + 1} showBitrate={false} queue={tracks} />
				))}
			</div>
			{tracks.length > limit && (
				<div className="mt-4 flex justify-center">
					<Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
						Show {Math.min(PAGE, tracks.length - limit)} more
					</Button>
				</div>
			)}
		</div>
	);
}

function GuestHero() {
	const open = useCommandStore((s) => s.open);
	return (
		<section className="relative -mx-4 -mt-6 overflow-hidden px-4 pb-16 pt-16 sm:-mx-6 sm:-mt-8 sm:px-6 sm:pt-24">
			<div className="bg-grid pointer-events-none absolute inset-0" />
			<div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
				<motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
					<LogoMark animated className="size-14" />
				</motion.div>
				<motion.h1
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
					className="text-balance mt-8 text-4xl font-semibold tracking-tighter sm:text-6xl"
				>
					Every track,
					<br />
					<span className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">one keystroke away.</span>
				</motion.h1>
				<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-5 max-w-md text-balance text-muted-foreground">
					Search Deezer, stream in lossless and download anything — all from a single command bar.
				</motion.p>
				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-8 flex flex-wrap justify-center gap-3">
					<Button size="lg" render={<Link href="/login" />} nativeButton={false}>
						Sign in
						<ArrowRight />
					</Button>
					<Button size="lg" variant="outline" onClick={() => open()}>
						Search
						<span className="ml-1 flex gap-0.5">
							<ModKey />
							<kbd className="kbd">K</kbd>
						</span>
					</Button>
				</motion.div>
				<div className="mt-14 w-full max-w-lg text-muted-foreground/50">
					<WaveLine className="h-10" amplitude={12} />
				</div>
			</div>
		</section>
	);
}

export function HomeContent({ playlists, albums, recentPlays, tracks, user }: HomeContentProps) {
	const [filter, setFilter] = useState<Filter>("all");
	const [sort, setSort] = useState<Sort>("added");
	const openPalette = useCommandStore((s) => s.open);
	const playQueue = usePlayerStore((s) => s.playQueue);
	const shuffleOn = usePlayerStore((s) => s.shuffle);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const enqueue = useDownloadStore((s) => s.enqueue);

	const trackRows = useMemo(() => {
		const rows = tracks.map(toRow);
		if (sort === "title") rows.sort((a, b) => a.title.localeCompare(b.title));
		if (sort === "artist") rows.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
		return rows;
	}, [tracks, sort]);
	const recentRows = useMemo(() => {
		// Collapse repeat plays so the list reads as "what I've been into".
		const seen = new Set<string>();
		return recentPlays.filter((r) => (seen.has(r.trackId) ? false : (seen.add(r.trackId), true))).map(toRow);
	}, [recentPlays]);
	const sortedAlbums = useMemo(
		() => [...albums].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
		[albums]
	);

	if (!user) return <GuestHero />;

	const totalTracks = tracks.length;
	const isEmpty = tracks.length === 0 && albums.length === 0 && playlists.length === 0 && recentPlays.length === 0;

	const playAll = (shuffle: boolean) => {
		const src = trackRows.length ? trackRows : recentRows;
		if (!src.length) return;
		if (shuffle !== shuffleOn) toggleShuffle();
		const start = shuffle ? Math.floor(Math.random() * src.length) : 0;
		playQueue(src.map(toPlayer), start);
	};

	const downloadAll = () => {
		if (!trackRows.length) return;
		const n = enqueue(trackRows, "All music");
		toast.success(n ? `Downloading ${n} tracks` : "Already in your downloads", {
			action: { label: "View", onClick: () => openPalette(undefined, "downloads") },
		});
	};

	return (
		<div>
			{/* Header */}
			<div className="relative -mx-4 -mt-6 mb-8 overflow-hidden px-4 pb-2 pt-6 sm:-mx-6 sm:-mt-8 sm:px-6 sm:pt-10">
				<div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
				<div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
							{greeting()}, {user.name?.split(" ")[0] || "there"}
						</motion.p>
						<motion.h1
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
							className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
						>
							All music
						</motion.h1>
						<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
							<span>
								<SlideSwap id={totalTracks} className="font-mono tabular-nums text-foreground">
									{totalTracks}
								</SlideSwap>{" "}
								tracks
							</span>
							<span className="size-1 rounded-full bg-border" />
							<span>
								<span className="font-mono tabular-nums text-foreground">{albums.length}</span> albums
							</span>
							<span className="size-1 rounded-full bg-border" />
							<span>
								<span className="font-mono tabular-nums text-foreground">{playlists.length}</span> playlists
							</span>
						</p>
					</div>
					{!isEmpty && (
						<div className="flex items-center gap-2">
							<motion.button
								type="button"
								whileTap={{ scale: 0.94 }}
								onClick={() => playAll(false)}
								className="flex h-10 items-center gap-2 rounded-full bg-foreground pl-3 pr-4 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
							>
								<PlayPauseIcon playing={false} className="size-4" />
								Play all
							</motion.button>
							<Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Shuffle all" onClick={() => playAll(true)}>
								<Shuffle />
							</Button>
							<Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Download all" title="Download all" onClick={downloadAll}>
								<DownloadGlyph />
							</Button>
						</div>
					)}
				</div>
			</div>

			{isEmpty ? (
				<EmptyState
					title="Your library is empty"
					description={
						<>
							Press <ModKey /> <kbd className="kbd">K</kbd> to search Deezer, or paste an album link to download it.
						</>
					}
					action={
						<Button onClick={() => openPalette()}>
							Open search
						</Button>
					}
				/>
			) : (
				<>
					<div className="sticky top-[calc(var(--header-h)+8px)] z-20 -mx-1 mb-6 flex flex-wrap items-center justify-between gap-3 px-1 max-md:top-[calc(var(--header-h)+44px)]">
						<Segmented<Filter>
							id="home-filter"
							value={filter}
							onChange={setFilter}
							options={[
								{ value: "all", label: "All" },
								{ value: "tracks", label: "Tracks", count: tracks.length },
								{ value: "albums", label: "Albums", count: albums.length },
								{ value: "playlists", label: "Playlists", count: playlists.length },
								{ value: "recent", label: "Recent" },
							]}
						/>
						{(filter === "tracks" || filter === "all") && trackRows.length > 1 && (
							<Segmented<Sort>
								id="home-sort"
								value={sort}
								onChange={setSort}
								options={[
									{ value: "added", label: "Recent" },
									{ value: "title", label: "A–Z" },
									{ value: "artist", label: "Artist" },
								]}
							/>
						)}
					</div>

					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={filter}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: 0.18 }}
							className="space-y-12"
						>
							{(filter === "all" || filter === "recent") && recentRows.length > 0 && (
								<section>
									<SectionHeader
										title="Recently played"
										count={recentRows.length}
										action={
											filter === "all" ? (
												<button type="button" onClick={() => setFilter("recent")} className="text-sm text-muted-foreground hover:text-foreground">
													View all
												</button>
											) : undefined
										}
									/>
									{filter === "all" ? (
										<div className="scrollbar-hide -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6">
											{recentRows.slice(0, 12).map((t, i) => (
												<RecentCard key={t.trackId} track={t} queue={recentRows} index={i} />
											))}
										</div>
									) : (
										<TrackList tracks={recentRows} emptyTitle="Nothing played yet" />
									)}
								</section>
							)}

							{(filter === "all" || filter === "albums") && sortedAlbums.length > 0 && (
								<section>
									<SectionHeader
										title="Albums"
										count={albums.length}
										action={
											filter === "all" && albums.length > 10 ? (
												<button type="button" onClick={() => setFilter("albums")} className="text-sm text-muted-foreground hover:text-foreground">
													View all
												</button>
											) : undefined
										}
									/>
									<CardGrid>
										{(filter === "all" ? sortedAlbums.slice(0, 10) : sortedAlbums).map((a, i) => (
											<MediaCard
												key={a.id}
												index={i}
												href={`/album?id=${a.deezerAlbumId}`}
												title={a.title}
												subtitle={`${a.artist} · ${a.trackCount} tracks`}
												cover={a.coverUrl}
												collection={{ type: "album", id: a.deezerAlbumId }}
											/>
										))}
									</CardGrid>
								</section>
							)}

							{(filter === "all" || filter === "playlists") && playlists.length > 0 && (
								<section>
									<SectionHeader
										title="Playlists"
										count={playlists.length}
										action={
											<Link href="/my-playlists" className="text-sm text-muted-foreground no-underline hover:text-foreground">
												Manage
											</Link>
										}
									/>
									<CardGrid>
										{(filter === "all" ? playlists.slice(0, 10) : playlists).map((p, i) => (
											<MediaCard
												key={p.id}
												index={i}
												href={`/my-playlists/${p.id}`}
												title={p.title}
												subtitle={`${p._count.tracks} tracks`}
												covers={p.covers}
											/>
										))}
									</CardGrid>
								</section>
							)}

							{(filter === "all" || filter === "tracks") && (
								<section>
									<SectionHeader
										title="Tracks"
										count={tracks.length}
										action={
											isPlaying ? undefined : (
												<button type="button" onClick={() => playAll(false)} className="text-sm text-muted-foreground hover:text-foreground">
													Play
												</button>
											)
										}
									/>
									<TrackList tracks={trackRows} emptyTitle="No saved tracks yet" />
								</section>
							)}

							{filter === "recent" && recentRows.length === 0 && <EmptyState title="Nothing played yet" />}
						</motion.div>
					</AnimatePresence>
				</>
			)}
		</div>
	);
}

function RecentCard({ track, queue, index }: { track: TrackRowTrack; queue: TrackRowTrack[]; index: number }) {
	const play = usePlayerStore((s) => s.play);
	const toggle = usePlayerStore((s) => s.toggle);
	const current = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const loaded = current?.trackId === track.trackId;

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, x: 12 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.03, duration: 0.3 }}
			onClick={() => (loaded ? toggle() : play(toPlayer(track), queue.map(toPlayer)))}
			className="group w-32 shrink-0 snap-start text-left sm:w-36"
		>
			<div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
				{track.cover ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={track.cover.replace(/\/\d+x\d+-/, "/500x500-")} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
				) : (
					<span className="flex h-full w-full items-center justify-center text-muted-foreground/40">
						<Music className="size-8" />
					</span>
				)}
				<span
					className={cn(
						"absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-foreground text-background shadow transition-all duration-200",
						loaded ? "opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
					)}
				>
					<PlayPauseIcon playing={loaded && isPlaying} className="size-4" />
				</span>
			</div>
			<p className={cn("mt-2 truncate text-sm font-medium", loaded ? "text-highlight" : "text-foreground")}>{track.title}</p>
			<p className="truncate text-xs text-muted-foreground">{track.artist}</p>
		</motion.button>
	);
}
