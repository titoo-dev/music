"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { fetchData } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { TrackRow, trackFromDeezerRaw, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { MediaCard, CardGrid, SectionHeader } from "@/components/cards/MediaCard";
import { DownloadGlyph, EmptyState, SearchGlyph, Spinner } from "@/components/motion/icons";
import { useDownloadedAlbums } from "@/hooks/useDownloadedAlbums";
import { useCommandStore } from "@/stores/useCommandStore";
import { ModKey } from "@/components/command/CommandPalette";
import { useDownloadStore } from "@/stores/useDownloadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

type SearchTab = "all" | "track" | "album" | "artist" | "playlist";

const TABS: { value: SearchTab; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "track", label: "Tracks" },
	{ value: "album", label: "Albums" },
	{ value: "artist", label: "Artists" },
	{ value: "playlist", label: "Playlists" },
];

/* eslint-disable @typescript-eslint/no-explicit-any -- raw Deezer GW/API payloads */

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

function albumProps(album: any) {
	const id = String(album.ALB_ID || album.id);
	return {
		id,
		title: album.ALB_TITLE || album.title,
		artist: album.ART_NAME || album.artist?.name,
		cover: album.cover_medium || album.cover_big || getCoverUrl(album.ALB_PICTURE, 250) || null,
	};
}

function artistProps(artist: any) {
	return {
		id: String(artist.ART_ID || artist.id),
		name: artist.ART_NAME || artist.name,
		picture: artist.picture_xl || artist.picture_medium || getArtistUrl(artist.ART_PICTURE, 250) || null,
	};
}

function playlistProps(pl: any) {
	return {
		id: String(pl.PLAYLIST_ID || pl.id),
		title: pl.TITLE || pl.title,
		nbTracks: pl.NB_SONG ?? pl.nb_tracks,
		picture: pl.picture_xl || pl.picture_medium || getCoverUrl(pl.PLAYLIST_PICTURE, 250) || null,
	};
}

function SearchContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const openPalette = useCommandStore((s) => s.open);
	const term = searchParams.get("term") || "";
	const tabParam = searchParams.get("tab") as SearchTab | null;
	const [tab, setTabState] = useState<SearchTab>(tabParam || "all");
	const [results, setResults] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const setTab = useCallback(
		(newTab: SearchTab) => {
			setTabState(newTab);
			const params = new URLSearchParams(searchParams.toString());
			if (newTab === "all") params.delete("tab");
			else params.set("tab", newTab);
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[searchParams, router, pathname]
	);

	useEffect(() => {
		setTabState((searchParams.get("tab") as SearchTab | null) || "all");
	}, [searchParams]);

	// No term → the palette *is* the search page.
	useEffect(() => {
		if (!term) openPalette("");
	}, [term, openPalette]);

	const doSearch = useCallback(async () => {
		if (!term) return;
		setLoading(true);
		try {
			const data =
				tab === "all"
					? await fetchData("search/main", { term })
					: await fetchData("search", { term, type: tab, start: "0", nb: "100" });
			setResults(data);
		} catch {
			setResults(null);
		}
		setLoading(false);
	}, [term, tab]);

	useEffect(() => {
		doSearch();
	}, [doSearch]);

	const loadMore = useCallback(async () => {
		if (!term || tab === "all" || !results?.data) return;
		setLoadingMore(true);
		try {
			const data = await fetchData("search", { term, type: tab, start: String(results.data.length), nb: "100" });
			if (data?.data?.length) {
				setResults((prev: any) => ({
					...prev,
					data: [...(prev?.data || []), ...data.data],
					total: data.total ?? prev?.total,
				}));
			}
		} catch {
			// ignore
		}
		setLoadingMore(false);
	}, [term, tab, results]);

	const hasMore = tab !== "all" && !!results?.data && !!results?.total && results.data.length < results.total;
	const { albumMap } = useDownloadedAlbums();

	if (!term) {
		return (
			<EmptyState
				className="mt-10"
				title="Search Deezer"
				description={
					<>
						Press <ModKey /> <kbd className="kbd">K</kbd> anywhere to search tracks, albums and artists, or paste a Deezer link.
					</>
				}
				action={<Button onClick={() => openPalette("")}>Open search</Button>}
			/>
		);
	}

	return (
		<div>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<p className="text-sm text-muted-foreground">Results for</p>
					<motion.h1
						key={term}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-1 truncate text-3xl font-semibold tracking-tight"
					>
						{term}
					</motion.h1>
				</div>
				<Button variant="outline" onClick={() => openPalette(term)} className="self-start sm:self-auto">
					<SearchGlyph />
					Refine
					<span className="ml-1 hidden gap-0.5 sm:flex">
						<ModKey />
						<kbd className="kbd">K</kbd>
					</span>
				</Button>
			</div>

			<div className="sticky top-[calc(var(--header-h)+8px)] z-20 mb-8 max-md:top-[calc(var(--header-h)+44px)]">
				<LayoutGroup id="search-tabs">
					<div role="tablist" className="scrollbar-hide inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-border bg-muted/50 p-0.5 backdrop-blur">
						{TABS.map((t) => (
							<button
								key={t.value}
								role="tab"
								type="button"
								aria-selected={tab === t.value}
								onClick={() => setTab(t.value)}
								className={cn(
									"relative h-7 shrink-0 rounded-md px-3 text-[13px] transition-colors",
									tab === t.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
								)}
							>
								{tab === t.value && (
									<motion.span layoutId="search-tab-pill" className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
								)}
								<span className="relative">{t.label}</span>
							</button>
						))}
					</div>
				</LayoutGroup>
			</div>

			<AnimatePresence mode="wait" initial={false}>
				{loading ? (
					<motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-16 text-muted-foreground">
						<Spinner size={20} />
					</motion.div>
				) : !results ? (
					<motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
						<EmptyState title="No results" description="Try a different search term." />
					</motion.div>
				) : (
					<motion.div key={`${tab}-${term}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
						{tab === "all" && <AllResults results={results} albumMap={albumMap} onTab={setTab} />}
						{tab === "track" && <TrackResults tracks={results?.data || []} />}
						{tab === "album" && <AlbumGrid albums={results?.data || []} albumMap={albumMap} />}
						{tab === "artist" && <ArtistGrid artists={results?.data || []} />}
						{tab === "playlist" && <PlaylistGrid playlists={results?.data || []} />}
						{hasMore && (
							<div className="flex justify-center pt-8">
								<Button variant="outline" onClick={loadMore} disabled={loadingMore}>
									{loadingMore ? <Spinner size={14} /> : null}
									{loadingMore ? "Loading…" : "Load more"}
								</Button>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function AllResults({ results, albumMap, onTab }: { results: any; albumMap: Map<string, string>; onTab: (t: SearchTab) => void }) {
	const tracks = results?.TRACK?.data?.slice(0, 10) || [];
	const albums = results?.ALBUM?.data?.slice(0, 10) || [];
	const artists = results?.ARTIST?.data?.slice(0, 10) || [];
	const playlists = results?.PLAYLIST?.data?.slice(0, 10) || [];

	if (tracks.length === 0 && albums.length === 0 && artists.length === 0 && playlists.length === 0) {
		return <EmptyState title="No results" description="Nothing on Deezer matches this search." />;
	}

	const more = (t: SearchTab) => (
		<button type="button" onClick={() => onTab(t)} className="text-sm text-muted-foreground hover:text-foreground">
			View all
		</button>
	);

	return (
		<div className="space-y-12">
			{tracks.length > 0 && (
				<section>
					<SectionHeader title="Tracks" count={results?.TRACK?.total || tracks.length} action={more("track")} />
					<TrackResults tracks={tracks} compact />
				</section>
			)}
			{albums.length > 0 && (
				<section>
					<SectionHeader title="Albums" count={results?.ALBUM?.total || albums.length} action={more("album")} />
					<AlbumGrid albums={albums} albumMap={albumMap} />
				</section>
			)}
			{artists.length > 0 && (
				<section>
					<SectionHeader title="Artists" count={results?.ARTIST?.total || artists.length} action={more("artist")} />
					<ArtistGrid artists={artists} />
				</section>
			)}
			{playlists.length > 0 && (
				<section>
					<SectionHeader title="Playlists" count={results?.PLAYLIST?.total || playlists.length} action={more("playlist")} />
					<PlaylistGrid playlists={playlists} />
				</section>
			)}
		</div>
	);
}

function TrackResults({ tracks, compact = false }: { tracks: any[]; compact?: boolean }) {
	const normalized = useMemo<TrackRowTrack[]>(() => tracks.map((t) => trackFromDeezerRaw(t)), [tracks]);
	const enqueue = useDownloadStore((s) => s.enqueue);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const openPalette = useCommandStore((s) => s.open);

	if (tracks.length === 0) return <EmptyState title="No tracks" />;

	const downloadAll = () => {
		if (!isAuthenticated) {
			toast("Sign in to download");
			return;
		}
		const n = enqueue(normalized, "Search results");
		toast.success(n ? `Downloading ${n} tracks` : "Already in your downloads", {
			action: { label: "View", onClick: () => openPalette(undefined, "downloads") },
		});
	};

	return (
		<div>
			{!compact && (
				<div className="mb-3 flex justify-end">
					<Button variant="ghost" size="sm" onClick={downloadAll}>
						<DownloadGlyph />
						Download {normalized.length} tracks
					</Button>
				</div>
			)}
			<div className="-mx-2 space-y-px">
				{normalized.map((t) => (
					<TrackRow key={t.trackId} track={t} queue={normalized} />
				))}
			</div>
		</div>
	);
}

function AlbumGrid({ albums, albumMap }: { albums: any[]; albumMap: Map<string, string> }) {
	if (albums.length === 0) return <EmptyState title="No albums" />;
	return (
		<CardGrid>
			{albums.map((raw, i) => {
				const a = albumProps(raw);
				return (
					<MediaCard
						key={a.id}
						index={i}
						href={`/album?id=${a.id}`}
						title={a.title}
						subtitle={a.artist}
						cover={a.cover}
						collection={{ type: "album", id: a.id }}
						badge={
							albumMap.has(a.id) ? (
								<span className="glass rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-foreground">Saved</span>
							) : undefined
						}
					/>
				);
			})}
		</CardGrid>
	);
}

function ArtistGrid({ artists }: { artists: any[] }) {
	if (artists.length === 0) return <EmptyState title="No artists" />;
	return (
		<CardGrid className="lg:grid-cols-6">
			{artists.map((raw, i) => {
				const a = artistProps(raw);
				return <MediaCard key={a.id} index={i} href={`/artist?id=${a.id}`} title={a.name} subtitle="Artist" cover={a.picture} round />;
			})}
		</CardGrid>
	);
}

function PlaylistGrid({ playlists }: { playlists: any[] }) {
	if (playlists.length === 0) return <EmptyState title="No playlists" />;
	return (
		<CardGrid>
			{playlists.map((raw, i) => {
				const p = playlistProps(raw);
				return (
					<MediaCard
						key={p.id}
						index={i}
						href={`/playlist?id=${p.id}`}
						title={p.title}
						subtitle={p.nbTracks != null ? `${p.nbTracks} tracks` : undefined}
						cover={p.picture}
						collection={{ type: "playlist", id: p.id }}
					/>
				);
			})}
		</CardGrid>
	);
}

export default function SearchPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
					<Spinner size={20} />
				</div>
			}
		>
			<SearchContent />
		</Suspense>
	);
}
