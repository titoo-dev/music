"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ChevronRight, Disc3, Heart, History, Library, ListMusic, LogIn, Plus, Search, Shuffle, User as UserIcon, UserPlus, type LucideIcon } from "lucide-react";
import { fetchData, postToServer } from "@/utils/api";
import { cn } from "@/lib/utils";
import { sizedCover } from "@/lib/cover-palette";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCommandStore } from "@/stores/useCommandStore";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { useDownloadStore } from "@/stores/useDownloadStore";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { CardGrid, MediaCard, useCollectionActions } from "@/components/cards/MediaCard";
import { DownloadGlyph, PlayPauseIcon, Spinner } from "@/components/motion/icons";
import { CountPill, FilterPills, Medallion, PageHero, SectionTitle, TonalPill, swap, entrance } from "@/components/expressive";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistEditDialog, filledButton, tonalButton } from "@/components/playlists/PlaylistDialogs";
import { CardGridSkeleton, NewPlaylistTile, TrackRowsSkeleton } from "@/components/playlists/PlaylistTiles";
import { formatRelative, formatTotal, groupByDay, plural, relativePhrase, uniqueCovers } from "@/components/playlists/format";
import { ArtistLink } from "@/components/links/EntityLink";
import { VirtualRows } from "@/components/virtual/VirtualRows";

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

interface TrackItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	duration: number | null;
}

interface SavedTrackItem extends TrackItem {
	savedAt: string;
}

interface RecentPlayItem extends TrackItem {
	playedAt: string;
}

interface FollowedArtistItem {
	id: string;
	deezerArtistId: string;
	name: string;
	pictureUrl: string | null;
	followedAt: string;
}

interface LibraryData {
	playlists: UserPlaylist[];
	albums: UserAlbum[];
	tracks: SavedTrackItem[];
	recentPlays: RecentPlayItem[];
	followedArtists: FollowedArtistItem[];
}

const EMPTY: LibraryData = { playlists: [], albums: [], tracks: [], recentPlays: [], followedArtists: [] };

type Tab = "recent" | "tracks" | "albums" | "playlists" | "following";

const TABS: { key: Tab; label: string }[] = [
	{ key: "recent", label: "Recent" },
	{ key: "tracks", label: "Liked" },
	{ key: "albums", label: "Albums" },
	{ key: "playlists", label: "Playlists" },
	{ key: "following", label: "Following" },
];

/** `?tab=` → tab (accepts the mobile names too). */
function parseTab(v: string | null): Tab {
	if (v === "liked") return "tracks";
	if (v === "artists") return "following";
	return TABS.some((t) => t.key === v) ? (v as Tab) : "recent";
}

function toRow(t: TrackItem): TrackRowTrack {
	return { trackId: t.trackId, title: t.title, artist: t.artist, album: t.album, albumId: t.albumId, cover: t.coverUrl, duration: t.duration, bitrateLabel: null };
}

function toPlayer(t: TrackRowTrack): PlayerTrack {
	return { trackId: t.trackId, title: t.title, artist: t.artist, artistId: t.artistId ?? null, album: t.album ?? null, albumId: t.albumId ?? null, cover: t.cover, duration: t.duration ?? null };
}

// ─── Hero ───────────────────────────────────────────────────────────────────

interface Stat {
	icon: LucideIcon;
	count: number | null;
	label: string;
	tab: Tab;
}

function LibraryHero({ covers, stats, onStat }: { covers: string[]; stats: Stat[]; onStat: (t: Tab) => void }) {
	return (
		<PageHero covers={covers}>
			<div className="mt-auto min-w-0">
				<motion.p {...entrance(0, 10)} className="type-eyebrow tracking-[0.2em] text-primary">
					Your collection
				</motion.p>
				<motion.h1 {...entrance(1)} className="type-display mt-2 text-[2.75rem] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
					Library
				</motion.h1>
				<motion.div {...entrance(2, 8)} className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
					{stats.map((s) => (
						<TonalPill key={s.label} icon={s.icon} value={s.count} label={s.label} tone={s.tab === "tracks" ? "tertiary" : "primary"} onClick={() => onStat(s.tab)} />
					))}
				</motion.div>
			</div>
		</PageHero>
	);
}

// ─── Bits ───────────────────────────────────────────────────────────────────

function GroupLabel({ label, count, first }: { label: string; count: number; first?: boolean }) {
	return (
		<div className={cn("mb-2 flex items-center gap-2.5", first ? "mt-2" : "mt-8")}>
			<h3 className="text-base font-semibold tracking-tight">{label}</h3>
			<CountPill value={count} />
			<span aria-hidden className="h-px flex-1 bg-outline-variant/50" />
		</div>
	);
}

/** A track row with a relative time ("2h ago") on wide screens. */
function NotedRow({ track, queue, note, number }: { track: TrackRowTrack; queue: TrackRowTrack[]; note: string; number?: number }) {
	return (
		<div className="relative">
			<TrackRow track={track} trackNumber={number} showBitrate={false} showDuration={false} queue={queue} />
			<span className="pointer-events-none absolute right-[132px] top-1/2 hidden -translate-y-1/2 text-xs tabular-nums text-muted-foreground md:block">{note}</span>
		</div>
	);
}

function SearchAction({ label }: { label: string }) {
	return (
		<Link href="/search" className={tonalButton}>
			<Search />
			{label}
		</Link>
	);
}

function PaletteAction() {
	const open = useCommandStore((s) => s.open);
	return (
		<button type="button" className={tonalButton} onClick={() => open()}>
			<Search />
			Open search
		</button>
	);
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

function RecentTab({ plays }: { plays: RecentPlayItem[] }) {
	const rows = useMemo(() => plays.map(toRow), [plays]);
	// Day labels and rows flattened into one list so it can be virtualized.
	const entries = useMemo(
		() =>
			groupByDay(plays, (p) => p.playedAt).flatMap((g, gi) => [
				{ kind: "label" as const, key: `label-${g.label}`, label: g.label, count: g.items.length, first: gi === 0 },
				...g.items.map(({ item, index }) => ({ kind: "row" as const, key: item.id, item, index })),
			]),
		[plays]
	);
	if (plays.length === 0) {
		return <Medallion icon={History} title="Nothing played yet" message="Play a track for at least 30 seconds and it’ll show up here." action={<PaletteAction />} />;
	}
	return (
		<VirtualRows
			gap={2}
			items={entries}
			getKey={(e) => e.key}
			estimateSize={(e) => (e.kind === "label" ? 44 : 60)}
			render={(e) =>
				e.kind === "label" ? (
					<GroupLabel label={e.label} count={e.count} first={e.first} />
				) : (
					<div className="-mx-2">
						<NotedRow track={rows[e.index]} queue={rows} note={formatRelative(e.item.playedAt)} />
					</div>
				)
			}
		/>
	);
}

/** "Liked songs" gradient banner with a big white Play button. */
function LikedBanner({ rows }: { rows: TrackRowTrack[] }) {
	const current = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const toggle = usePlayerStore((s) => s.toggle);
	const playQueue = usePlayerStore((s) => s.playQueue);
	const shuffleOn = usePlayerStore((s) => s.shuffle);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
	const enqueue = useDownloadStore((s) => s.enqueue);
	const openPalette = useCommandStore((s) => s.open);
	const isThis = !!current && rows.some((t) => t.trackId === current.trackId);
	const playing = isThis && isPlaying;
	const seconds = rows.reduce((s, t) => s + (t.duration ?? 0), 0);

	const play = (shuffle: boolean) => {
		if (shuffle !== shuffleOn) toggleShuffle();
		playQueue(rows.map(toPlayer), shuffle ? Math.floor(Math.random() * rows.length) : 0);
	};
	const download = () => {
		const n = enqueue(rows, "Liked songs");
		toast.success(n ? `Downloading ${n} tracks` : "Already in your downloads", {
			action: { label: "View", onClick: () => openPalette(undefined, "downloads") },
		});
	};

	return (
		<motion.section
			{...entrance(0)}
			className="bg-liked-gradient relative isolate mb-4 mt-2 overflow-hidden rounded-m3-xl text-white shadow-[0_12px_28px_-4px_rgb(79_70_229/0.35)]"
		>
			<Heart aria-hidden className="absolute -bottom-12 -right-7 -z-10 size-[180px] fill-white/[0.12] text-transparent sm:size-[240px]" />
			<button type="button" onClick={download} aria-label="Download liked songs" title="Download all" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-white/90 transition-[background-color,transform] hover:bg-white/15 active:scale-90 sm:right-5 sm:top-5">
				<DownloadGlyph />
			</button>
			<div className="flex items-end gap-3 p-5 sm:p-7 lg:p-8">
				<div className="min-w-0 flex-1">
					<span className="flex size-9 items-center justify-center rounded-full bg-white/20">
						<Heart className="size-5 fill-current" />
					</span>
					<h2 className="type-display mt-3.5 text-2xl sm:text-4xl lg:text-5xl">Liked songs</h2>
					<p className="mt-1 text-sm text-white/80 sm:text-base">{[plural(rows.length, "track"), formatTotal(seconds)].filter(Boolean).join(" · ")}</p>
				</div>
				<div className="flex shrink-0 items-center gap-1 sm:gap-2">
					<motion.button type="button" onClick={() => play(true)} aria-label="Shuffle" title="Shuffle" whileTap={{ scale: 0.88, rotate: -12 }} className="flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15">
						<Shuffle className="size-6" />
					</motion.button>
					<motion.button
						type="button"
						aria-label={playing ? "Pause" : "Play liked songs"}
						onClick={() => (isThis ? toggle() : play(false))}
						whileTap={{ scale: 0.9 }}
						animate={{ scale: playing ? 1.06 : 1 }}
						className="flex size-[60px] items-center justify-center rounded-full bg-white text-[#4f46e5] shadow-[0_6px_16px_rgb(0_0_0/0.3)] transition-colors hover:bg-white/90 sm:size-16"
					>
						<PlayPauseIcon playing={playing} className="size-8" />
					</motion.button>
				</div>
			</div>
		</motion.section>
	);
}

function LikedTab({ tracks }: { tracks: SavedTrackItem[] }) {
	const rows = useMemo(() => tracks.map(toRow), [tracks]);
	if (tracks.length === 0) {
		return <Medallion icon={Heart} title="No liked tracks" message="Tap the heart on any track to save it here." action={<PaletteAction />} />;
	}
	return (
		<div>
			<LikedBanner rows={rows} />
			<VirtualRows
				className="-mx-2"
				gap={2}
				items={tracks}
				getKey={(t) => t.id}
				render={(t, i) => <NotedRow track={rows[i]} queue={rows} number={i + 1} note={formatRelative(t.savedAt)} />}
			/>
		</div>
	);
}

/** The latest saved album, on its own blurred artwork. */
function FeaturedAlbum({ album }: { album: UserAlbum }) {
	const { play, download, busy } = useCollectionActions();
	const href = `/album?id=${album.deezerAlbumId}`;
	const meta = [album.trackCount > 0 ? plural(album.trackCount, "track") : null, album.savedAt ? `Saved ${relativePhrase(album.savedAt)}` : null].filter(Boolean).join(" · ");
	return (
		<motion.div {...entrance(0)} whileTap={{ scale: 0.985 }} className="group relative isolate mt-2 overflow-hidden rounded-m3-xl bg-surface-highest text-white">
			{album.coverUrl && (
				<div aria-hidden className="absolute inset-[-30%] -z-10 bg-cover bg-center blur-[48px] saturate-150 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url("${sizedCover(album.coverUrl, 120)}")` }} />
			)}
			<div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/25 to-black/55" />
			<Link href={href} aria-label={album.title} className="absolute inset-0 z-0" />
			<div className="pointer-events-none relative flex items-center gap-4 p-4 sm:gap-7 sm:p-6">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={album.coverUrl ? sizedCover(album.coverUrl, 500) : undefined}
					alt=""
					className="size-28 shrink-0 rounded-m3-lg bg-white/10 object-cover shadow-[0_8px_20px_rgb(0_0_0/0.38)] transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:-rotate-2 group-hover:scale-[1.03] sm:size-40 lg:size-44"
				/>
				<div className="min-w-0 flex-1">
					<p className="type-eyebrow text-white/75">Latest addition</p>
					<h2 className="mt-1.5 line-clamp-2 text-xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">{album.title}</h2>
					<p className="mt-1 truncate text-sm sm:text-base">
						<ArtistLink name={album.artist} className="pointer-events-auto" />
					</p>
					{meta && <p className="mt-2.5 text-xs font-medium text-white/75 sm:text-sm">{meta}</p>}
				</div>
				<div className="pointer-events-auto hidden items-center gap-2 sm:flex">
					<button
						type="button"
						aria-label={`Download ${album.title}`}
						title="Download"
						onClick={() => void download("album", album.deezerAlbumId)}
						className="flex size-11 items-center justify-center rounded-full bg-white/[0.18] backdrop-blur-md transition-[background-color,transform] hover:bg-white/25 active:scale-90"
					>
						{busy === "download" ? <Spinner size={16} /> : <DownloadGlyph />}
					</button>
					<button
						type="button"
						aria-label={`Play ${album.title}`}
						title="Play"
						onClick={() => void play("album", album.deezerAlbumId)}
						className="flex size-14 items-center justify-center rounded-full bg-white text-black shadow-[0_6px_16px_rgb(0_0_0/0.3)] transition-transform hover:scale-105 active:scale-90"
					>
						{busy === "play" ? <Spinner size={18} /> : <PlayPauseIcon playing={false} className="size-6" />}
					</button>
				</div>
				<ChevronRight className="size-6 shrink-0 text-white/75 transition-transform group-hover:translate-x-0.5 sm:hidden" />
			</div>
		</motion.div>
	);
}

function AlbumsTab({ albums }: { albums: UserAlbum[] }) {
	const sorted = useMemo(() => [...albums].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()), [albums]);
	if (sorted.length === 0) {
		return <Medallion icon={Disc3} title="No saved albums" message="Save albums with the heart on their page." action={<SearchAction label="Find albums" />} />;
	}
	const rest = sorted.slice(1);
	return (
		<div>
			<FeaturedAlbum album={sorted[0]} />
			{rest.length > 0 && (
				<>
					<GroupLabel label="All albums" count={sorted.length} />
					<CardGrid>
						{rest.map((a, i) => (
							<MediaCard key={a.id} index={i} href={`/album?id=${a.deezerAlbumId}`} title={a.title} subtitle={<><ArtistLink name={a.artist} className="transition-colors hover:text-foreground" />{` · ${plural(a.trackCount, "track")}`}</>} cover={a.coverUrl} collection={{ type: "album", id: a.deezerAlbumId }} />
						))}
					</CardGrid>
				</>
			)}
		</div>
	);
}

function PlaylistsTab({ playlists, onCreate }: { playlists: UserPlaylist[]; onCreate: () => void }) {
	if (playlists.length === 0) {
		return (
			<Medallion
				icon={ListMusic}
				title="No playlists"
				message="Collect tracks into your own mixes."
				action={
					<button type="button" className={filledButton} onClick={onCreate}>
						<Plus />
						New playlist
					</button>
				}
			/>
		);
	}
	return (
		<div>
			<SectionTitle title="Your playlists" count={playlists.length} href="/my-playlists" actionLabel="Manage" className="mt-2" as="h3" />
			<CardGrid>
				<NewPlaylistTile onClick={onCreate} subtitle="Start a fresh mix" />
				{playlists.map((p, i) => (
					<MediaCard
						key={p.id}
						index={i + 1}
						href={`/my-playlists/${p.id}`}
						title={p.title}
						subtitle={[plural(p._count.tracks, "track"), formatRelative(p.updatedAt)].filter(Boolean).join(" · ")}
						covers={p.covers}
					/>
				))}
			</CardGrid>
		</div>
	);
}

/** Round portrait in a brand-gradient ring. */
function ArtistBubble({ artist, index }: { artist: FollowedArtistItem; index: number }) {
	const since = formatRelative(artist.followedAt);
	return (
		<motion.div
			initial={{ opacity: 0, y: 14, scale: 0.9 }}
			whileInView={{ opacity: 1, y: 0, scale: 1 }}
			viewport={{ once: true, margin: "0px 0px -20px 0px" }}
			whileTap={{ scale: 0.95 }}
			transition={{ duration: 0.45, delay: Math.min(index, 12) * 0.04, ease: [0.05, 0.7, 0.1, 1] }}
		>
			<Link href={`/artist?id=${artist.deezerArtistId}`} className="group block rounded-m3-lg p-1.5 text-center no-underline transition-colors duration-300 hover:bg-surface-high/70">
				<span className="bg-brand-gradient block aspect-square rounded-full p-[2.5px] transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:rotate-[8deg]">
					<span className="block size-full rounded-full bg-background p-[3px]">
						{artist.pictureUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={sizedCover(artist.pictureUrl, 250)} alt="" loading="lazy" className="size-full rounded-full bg-surface-highest object-cover transition-transform duration-500 group-hover:-rotate-[8deg]" />
						) : (
							<span className="flex size-full items-center justify-center rounded-full bg-surface-highest text-muted-foreground">
								<UserIcon className="size-1/3" />
							</span>
						)}
					</span>
				</span>
				<span className="mt-2 block truncate text-sm font-semibold text-foreground">{artist.name}</span>
				{since && <span className="mt-0.5 block truncate text-xs text-muted-foreground">Since {since === "Just now" ? "just now" : since}</span>}
			</Link>
		</motion.div>
	);
}

const BUBBLES = "-mx-1.5 mt-2 grid grid-cols-3 gap-x-1 gap-y-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7";

function FollowingTab({ artists }: { artists: FollowedArtistItem[] }) {
	if (artists.length === 0) {
		return <Medallion icon={UserPlus} title="Not following anyone" message="Follow artists from their page to find them here." action={<SearchAction label="Find artists" />} />;
	}
	return (
		<div className={BUBBLES}>
			{artists.map((a, i) => (
				<ArtistBubble key={a.id} artist={a} index={i} />
			))}
		</div>
	);
}

function TabSkeleton({ tab }: { tab: Tab }) {
	if (tab === "recent")
		return (
			<div>
				<Skeleton className="mb-3 mt-2 h-5 w-28 rounded-full" />
				<TrackRowsSkeleton count={9} />
			</div>
		);
	if (tab === "tracks")
		return (
			<div>
				<Skeleton className="mb-4 mt-2 h-[172px] rounded-m3-xl sm:h-[180px]" />
				<TrackRowsSkeleton count={7} numbered />
			</div>
		);
	if (tab === "albums")
		return (
			<div>
				<Skeleton className="mt-2 h-[144px] rounded-m3-xl sm:h-[208px] lg:h-[224px]" />
				<Skeleton className="mb-3 mt-8 h-5 w-32 rounded-full" />
				<CardGridSkeleton count={5} />
			</div>
		);
	if (tab === "following") return <CardGridSkeleton count={7} round className="mt-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-7" />;
	return <CardGridSkeleton count={10} className="mt-14" />;
}

// ─── Page ───────────────────────────────────────────────────────────────────

function GuestLibrary() {
	return (
		<Medallion
			className="pt-[12vh]"
			icon={Library}
			title="Your library"
			message="Sign in to keep liked tracks, saved albums and the artists you follow."
			action={
				<Link href="/login" className={filledButton}>
					<LogIn />
					Sign in
				</Link>
			}
		/>
	);
}

function LibraryContent() {
	const router = useRouter();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const authLoading = useAuthStore((s) => s.isLoading);
	const searchParams = useSearchParams();
	const [data, setData] = useState<LibraryData | null>(null);
	const [tab, setTabState] = useState<Tab>(() => parseTab(searchParams.get("tab")));
	const [creating, setCreating] = useState(false);
	const tabsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isAuthenticated) return;
		let live = true;
		Promise.all([
			fetchData("playlists").catch(() => []),
			fetchData("library/albums").catch(() => ({ items: [] })),
			fetchData("library/tracks", { limit: "200" }).catch(() => ({ items: [] })),
			fetchData("recent-plays", { limit: "100" }).catch(() => ({ items: [] })),
			fetchData("library/artists").catch(() => ({ items: [] })),
		]).then(([pls, als, tks, rps, ars]) => {
			if (!live) return;
			setData({
				playlists: Array.isArray(pls) ? pls : [],
				albums: (als as { items?: UserAlbum[] }).items || [],
				tracks: (tks as { items?: SavedTrackItem[] }).items || [],
				recentPlays: (rps as { items?: RecentPlayItem[] }).items || [],
				followedArtists: (ars as { items?: FollowedArtistItem[] }).items || [],
			});
		});
		return () => {
			live = false;
		};
	}, [isAuthenticated]);

	const loading = isAuthenticated && !data;
	const { playlists, albums, tracks, recentPlays, followedArtists } = data ?? EMPTY;

	const covers = useMemo(
		() => uniqueCovers([albums.map((a) => a.coverUrl), recentPlays.map((p) => p.coverUrl), tracks.slice(0, 60).map((t) => t.coverUrl), playlists.flatMap((p) => p.covers ?? [])], 24),
		[albums, recentPlays, tracks, playlists]
	);

	const setTab = (next: Tab) => {
		const bar = tabsRef.current;
		if (bar) {
			// Bring the tab bar back under the top bar when the page is scrolled past it.
			const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
			const top = bar.getBoundingClientRect().top + window.scrollY - headerH;
			if (window.scrollY > top + 1 || next === tab) window.scrollTo({ top: next === tab ? 0 : top, behavior: "smooth" });
		}
		if (next === tab) return;
		setTabState(next);
		const url = new URL(window.location.href);
		url.searchParams.set("tab", next);
		window.history.replaceState(null, "", url);
	};

	const createPlaylist = async ({ title, description }: { title: string; description: string | null }) => {
		const p = (await postToServer("playlists", { title, description })) as UserPlaylist;
		router.push(`/my-playlists/${p.id}`);
	};

	if (authLoading && !isAuthenticated) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
				<Spinner size={20} />
			</div>
		);
	}
	if (!isAuthenticated) return <GuestLibrary />;

	const n = (v: number) => (loading ? null : v);
	const counts: Record<Tab, number | null> = { recent: n(recentPlays.length), tracks: n(tracks.length), albums: n(albums.length), playlists: n(playlists.length), following: n(followedArtists.length) };

	return (
		<div>
			<LibraryHero
				covers={covers}
				onStat={setTab}
				stats={[
					{ icon: Heart, count: counts.tracks, label: "liked", tab: "tracks" },
					{ icon: Disc3, count: counts.albums, label: "albums", tab: "albums" },
					{ icon: ListMusic, count: counts.playlists, label: "playlists", tab: "playlists" },
					{ icon: UserIcon, count: counts.following, label: "artists", tab: "following" },
				]}
			/>

			{/* Section pills, pinned under the top bar. */}
			<div ref={tabsRef} className="sticky top-[var(--header-h)] z-20 mb-3 mx-[calc(50%-50vw)] glass border-b border-border px-[calc(50vw-50%)] py-2">
				<FilterPills<Tab>
					ariaLabel="Library sections"
					value={tab}
					onChange={setTab}
					items={TABS.map(({ key, label }) => ({ value: key, label, count: key === "recent" ? null : counts[key] }))}
				/>
			</div>

			<AnimatePresence mode="wait" initial={false}>
				<motion.div key={loading ? `loading-${tab}` : tab} variants={swap} initial="initial" animate="animate" exit="exit">
					{loading ? (
						<TabSkeleton tab={tab} />
					) : tab === "recent" ? (
						<RecentTab plays={recentPlays} />
					) : tab === "tracks" ? (
						<LikedTab tracks={tracks} />
					) : tab === "albums" ? (
						<AlbumsTab albums={albums} />
					) : tab === "playlists" ? (
						<PlaylistsTab playlists={playlists} onCreate={() => setCreating(true)} />
					) : (
						<FollowingTab artists={followedArtists} />
					)}
				</motion.div>
			</AnimatePresence>

			<PlaylistEditDialog open={creating} onOpenChange={setCreating} mode="create" onSubmit={createPlaylist} />
		</div>
	);
}

export default function LibraryPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
					<Spinner size={20} />
				</div>
			}
		>
			<LibraryContent />
		</Suspense>
	);
}
