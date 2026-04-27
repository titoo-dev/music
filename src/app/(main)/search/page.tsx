"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { fetchData } from "@/utils/api";
import Link from "next/link";
import {
	Tabs,
	TabsContent,
} from "@/components/ui/tabs";
import { Search, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDownloadedAlbums } from "@/hooks/useDownloadedAlbums";
import { CoverImage } from "@/components/ui/cover-image";
import { TrackRow, trackFromDeezerRaw } from "@/components/tracks/TrackRow";

function parseDeezerLink(url: string): { type: string; id: string } | null {
	const trackMatch = url.match(/\/track\/(\d+)/);
	if (trackMatch) return { type: "track", id: trackMatch[1] };
	const albumMatch = url.match(/\/album\/(\d+)/);
	if (albumMatch) return { type: "album", id: albumMatch[1] };
	const playlistMatch = url.match(/\/playlist\/(\d+)/);
	if (playlistMatch) return { type: "playlist", id: playlistMatch[1] };
	const artistMatch = url.match(/\/artist\/(\d+)/);
	if (artistMatch) return { type: "artist", id: artistMatch[1] };
	return null;
}

function BrutalSearchBar({ initialTerm }: { initialTerm: string }) {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [q, setQ] = useState(initialTerm);

	useEffect(() => {
		setQ(initialTerm);
	}, [initialTerm]);

	const submit = useCallback(
		(e?: React.FormEvent) => {
			e?.preventDefault();
			const v = q.trim();
			if (!v) return;
			const link = parseDeezerLink(v);
			if (link) {
				router.push(`/${link.type}?id=${link.id}`);
				setQ("");
				return;
			}
			router.push(`/search?term=${encodeURIComponent(v)}`);
		},
		[q, router]
	);

	return (
		<div>
			<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
				SEARCH / DEEZER
			</p>
			<form onSubmit={submit} className="flex items-stretch">
				{/* Input box */}
				<div className="flex-1 flex items-center px-4 sm:px-5 border-2 sm:border-[3px] border-foreground bg-card shadow-[var(--shadow-brutal)] min-w-0">
					<Search className="size-5 shrink-0 text-foreground" />
					<input
						ref={inputRef}
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="ARTIST, TRACK, ALBUM, OR DEEZER LINK…"
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="off"
						spellCheck={false}
						className="flex-1 min-w-0 bg-transparent border-0 outline-none px-3 py-3.5 sm:py-4 text-base sm:text-lg font-bold tracking-[-0.01em] text-foreground placeholder:text-muted-foreground/60 placeholder:tracking-[0.05em] placeholder:text-sm placeholder:font-bold placeholder:uppercase"
					/>
					{q && (
						<button
							type="button"
							aria-label="Clear search"
							onClick={() => {
								setQ("");
								inputRef.current?.focus();
							}}
							className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
						>
							<X className="size-4" />
						</button>
					)}
				</div>
				{/* GO button */}
				<button
					type="submit"
					className="shrink-0 px-5 sm:px-7 border-2 sm:border-[3px] border-l-0 sm:border-l-0 border-foreground bg-primary text-white font-mono text-sm sm:text-base font-black tracking-[0.14em] uppercase shadow-[var(--shadow-brutal)] hover:bg-primary/90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)]"
				>
					GO
				</button>
			</form>
			<p className="mt-2 text-[10px] font-mono font-bold uppercase tracking-[0.05em] text-muted-foreground">
				TIP — PASTE A DEEZER URL TO QUEUE AN ENTIRE ALBUM OR PLAYLIST.
			</p>
		</div>
	);
}

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

type SearchTab = "all" | "track" | "album" | "artist" | "playlist";

function SearchContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const term = searchParams.get("term") || "";
	const tabParam = searchParams.get("tab") as SearchTab | null;
	const [tab, setTabState] = useState<SearchTab>(tabParam || "all");

	// Sync tab to URL
	const setTab = useCallback((newTab: SearchTab) => {
		setTabState(newTab);
		const params = new URLSearchParams(searchParams.toString());
		if (newTab === "all") {
			params.delete("tab");
		} else {
			params.set("tab", newTab);
		}
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}, [searchParams, router, pathname]);

	// Sync from URL on param change (e.g. browser back/forward)
	useEffect(() => {
		const urlTab = searchParams.get("tab") as SearchTab | null;
		setTabState(urlTab || "all");
	}, [searchParams]);
	const [results, setResults] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const doSearch = useCallback(async () => {
		if (!term) return;
		setLoading(true);
		try {
			if (tab === "all") {
				const data = await fetchData("search/main", { term });
				setResults(data);
			} else {
				const data = await fetchData("search", {
					term,
					type: tab,
					start: "0",
					nb: "100",
				});
				setResults(data);
			}
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
			const data = await fetchData("search", {
				term,
				type: tab,
				start: String(results.data.length),
				nb: "100",
			});
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

	const deezerUrl = (id: string | number, type: string) => `https://www.deezer.com/${type}/${id}`;
	const hasMore = tab !== "all" && !!results?.data && !!results?.total && results.data.length < results.total;

	// Collect all track IDs from results for batch download check
	const allTrackIds = (() => {
		if (!results) return [];
		const ids: string[] = [];
		// "all" tab
		if (results?.TRACK?.data) {
			results.TRACK.data.forEach((t: any) => ids.push(String(t.SNG_ID || t.id)));
		}
		// typed tab
		if (tab === "track" && results?.data) {
			results.data.forEach((t: any) => ids.push(String(t.SNG_ID || t.id)));
		}
		return ids;
	})();

	const { albumMap } = useDownloadedAlbums();

	if (!term) {
		return (
			<div className="space-y-8">
				<BrutalSearchBar initialTerm="" />
				<div>
					<h1 className="text-brutal-xl m-0">
						FIND<br />
						<span className="text-primary">SOMETHING.</span>
					</h1>
					<p className="mt-4 text-[12px] font-mono font-bold uppercase tracking-[0.05em] text-muted-foreground max-w-md">
						TYPE AN ARTIST, ALBUM OR TRACK ABOVE — OR PASTE A DEEZER URL.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<BrutalSearchBar initialTerm={term} />

			{/* Result label */}
			<div>
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">
					RESULTS FOR
				</p>
				<h1 className="text-brutal-lg m-0 break-words">
					&ldquo;{term}&rdquo;<span className="text-primary">.</span>
				</h1>
			</div>

			<Tabs
				value={tab}
				onValueChange={(value) => setTab(value as SearchTab)}
			>
				{/* Connected tabs with border-bottom under all */}
				<div className="flex border-b-[2px] border-foreground -mx-1 sm:mx-0 overflow-x-auto scrollbar-hide">
					{([
						["all", "ALL"],
						["track", "TRACKS"],
						["album", "ALBUMS"],
						["artist", "ARTISTS"],
						["playlist", "PLAYLISTS"],
					] as const).map(([value, label]) => (
						<button
							key={value}
							onClick={() => setTab(value)}
							className={`shrink-0 px-4 py-2.5 border-r-[2px] border-foreground last:border-r-0 font-mono text-[11px] font-bold tracking-[0.14em] cursor-pointer transition-colors ${
								tab === value
									? "bg-foreground text-background"
									: "bg-transparent text-foreground hover:bg-accent/40"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				{loading && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				)}

				{!loading && results && (
					<>
						<TabsContent value="all">
							<AllResults results={results} albumMap={albumMap} />
						</TabsContent>
						<TabsContent value="track">
							<TrackResults data={results} />
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
						<TabsContent value="album">
							<AlbumResults data={results} albumMap={albumMap} />
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
						<TabsContent value="artist">
							<ArtistResults data={results} />
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
						<TabsContent value="playlist">
							<PlaylistResults data={results} />
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
					</>
				)}

				{!loading && !results && term && (
					<div className="border-2 sm:border-[3px] border-foreground bg-card flex flex-col items-center justify-center py-20 px-6 gap-3 mt-6 shadow-[var(--shadow-brutal)]">
						<div className="text-3xl font-black tracking-[0.2em]">∅</div>
						<p className="text-sm font-black uppercase tracking-[0.14em]">NO RESULTS</p>
						<p className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
							Try a different search term.
						</p>
					</div>
				)}
			</Tabs>
		</div>
	);
}

function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
	return (
		<div className="flex justify-center pt-6">
			<Button
				variant="outline"
				onClick={onClick}
				disabled={loading}
				className="gap-2"
			>
				{loading ? (
					<>
						<Loader2 className="size-3.5 animate-spin" />
						Loading...
					</>
				) : (
					"Load more"
				)}
			</Button>
		</div>
	);
}

function AllResults({
	results,
	albumMap,
}: {
	results: any;
	albumMap: Map<string, string>;
}) {
	const tracks = results?.TRACK?.data?.slice(0, 15) || [];
	const albums = results?.ALBUM?.data?.slice(0, 18) || [];
	const artists = results?.ARTIST?.data?.slice(0, 12) || [];
	const playlists = results?.PLAYLIST?.data?.slice(0, 12) || [];

	if (tracks.length === 0 && albums.length === 0 && artists.length === 0 && playlists.length === 0) {
		return <EmptyTabState />;
	}

	return (
		<div className="space-y-10 mt-6">
			{tracks.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								TRACKS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{results?.TRACK?.total || tracks.length} RESULTS
							</span>
						</div>
					</div>
					<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
						{tracks.map((track: any) => (
							<SearchTrackRow key={track.SNG_ID || track.id} track={track} />
						))}
					</div>
				</section>
			)}
			{albums.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								ALBUMS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{results?.ALBUM?.total || albums.length} RESULTS
							</span>
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
						{albums.map((album: any) => {
							const deezerAlbumId = String(album.ALB_ID || album.id);
							return (
								<AlbumCard
									key={deezerAlbumId}
									album={album}
									myAlbumId={albumMap.get(deezerAlbumId)}
								/>
							);
						})}
					</div>
				</section>
			)}
			{artists.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								ARTISTS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{results?.ARTIST?.total || artists.length} RESULTS
							</span>
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
						{artists.map((artist: any) => (
							<ArtistCard
								key={artist.ART_ID || artist.id}
								artist={artist}
							/>
						))}
					</div>
				</section>
			)}
			{playlists.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								PLAYLISTS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{results?.PLAYLIST?.total || playlists.length} RESULTS
							</span>
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
						{playlists.map((pl: any) => (
							<PlaylistCard key={pl.PLAYLIST_ID || pl.id} playlist={pl} />
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function SearchTrackRow({ track }: { track: any }) {
	const normalized = trackFromDeezerRaw(track);
	return <TrackRow track={normalized} />;
}

function AlbumCard({
	album,
	myAlbumId,
}: {
	album: any;
	myAlbumId?: string;
}) {
	const id = album.ALB_ID || album.id;
	const title = album.ALB_TITLE || album.title;
	const artistName = album.ART_NAME || album.artist?.name;
	const artistId = album.ART_ID || album.artist?.id;
	const cover =
		album.cover_medium ||
		album.cover_big ||
		getCoverUrl(album.ALB_PICTURE, 250) ||
		"/placeholder.jpg";
	const albumHref = `/album?id=${id}`;

	return (
		<div className="group border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all bg-card overflow-hidden">
			<div className="relative">
				<Link href={albumHref}>
					<CoverImage
						src={cover}
						alt={title}
						loading="lazy"
						className="w-full aspect-square border-0"
					/>
				</Link>
				{myAlbumId && (
					<span className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-accent text-foreground text-[10px] font-bold uppercase px-1.5 py-0.5 border-2 border-foreground">
						<CheckCircle2 className="size-3" />
						Saved
					</span>
				)}
			</div>
			<div className="mt-2 px-2 pb-2">
				<Link
					href={albumHref}
					className="text-sm font-bold truncate block hover:underline"
				>
					{title}
				</Link>
				{artistId ? (
					<Link href={`/artist?id=${artistId}`} className="text-xs text-muted-foreground font-medium truncate block hover:underline hover:text-foreground transition-colors">
						{artistName}
					</Link>
				) : (
					<p className="text-xs text-muted-foreground font-medium truncate">{artistName}</p>
				)}
			</div>
		</div>
	);
}

function ArtistCard({ artist }: { artist: any }) {
	const id = artist.ART_ID || artist.id;
	const name = artist.ART_NAME || artist.name;
	const picture =
		artist.picture_xl ||
		artist.picture_medium ||
		getArtistUrl(artist.ART_PICTURE, 250) ||
		"/placeholder.jpg";

	return (
		<div className="group text-center border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all bg-card overflow-hidden">
			<Link href={`/artist?id=${id}`}>
				<div className="overflow-hidden aspect-square">
					<CoverImage
						src={picture}
						alt={name}
						loading="lazy"
						className="w-full h-full border-0"
					/>
				</div>
			</Link>
			<div className="mt-2 pb-2">
				<Link
					href={`/artist?id=${id}`}
					className="text-sm font-bold truncate block hover:underline"
				>
					{name}
				</Link>
			</div>
		</div>
	);
}

function TrackResults({
	data,
}: {
	data: any;
}) {
	const tracks = data?.data || [];
	if (tracks.length === 0) return <EmptyTabState />;
	return (
		<div className="mt-4 border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
			{tracks.map((track: any) => (
				<SearchTrackRow key={track.SNG_ID || track.id} track={track} />
			))}
		</div>
	);
}

function AlbumResults({
	data,
	albumMap,
}: {
	data: any;
	albumMap: Map<string, string>;
}) {
	const albums = data?.data || [];
	if (albums.length === 0) return <EmptyTabState />;
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mt-4">
			{albums.map((album: any) => {
				const deezerAlbumId = String(album.ALB_ID || album.id);
				return (
					<AlbumCard
						key={deezerAlbumId}
						album={album}
						myAlbumId={albumMap.get(deezerAlbumId)}
					/>
				);
			})}
		</div>
	);
}

function ArtistResults({ data }: { data: any }) {
	const artists = data?.data || [];
	if (artists.length === 0) return <EmptyTabState />;
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 mt-4">
			{artists.map((artist: any) => (
				<ArtistCard
					key={artist.ART_ID || artist.id}
					artist={artist}
				/>
			))}
		</div>
	);
}

function EmptyTabState() {
	return (
		<div className="flex flex-col items-center justify-center py-24 gap-2">
			<p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No results</p>
			<p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No matches found for this category.</p>
		</div>
	);
}

function PlaylistCard({ playlist: pl }: { playlist: any }) {
	const id = pl.PLAYLIST_ID || pl.id;
	const title = pl.TITLE || pl.title;
	const nbTracks = pl.NB_SONG || pl.nb_tracks;
	const picture =
		pl.picture_xl ||
		pl.picture_medium ||
		getCoverUrl(pl.PLAYLIST_PICTURE, 250) ||
		"/placeholder.jpg";

	return (
		<div className="group border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all bg-card overflow-hidden">
			<div className="relative">
				<Link href={`/playlist?id=${id}`}>
					<CoverImage
						src={picture}
						alt={title}
						loading="lazy"
						className="w-full aspect-square border-0"
					/>
				</Link>
			</div>
			<div className="mt-2 px-2 pb-2">
				<Link
					href={`/playlist?id=${id}`}
					className="text-sm font-bold truncate block hover:underline"
				>
					{title}
				</Link>
				{nbTracks != null && (
					<p className="text-xs text-muted-foreground font-mono font-medium truncate">{nbTracks} tracks</p>
				)}
			</div>
		</div>
	);
}

function PlaylistResults({ data }: { data: any }) {
	const playlists = data?.data || [];
	if (playlists.length === 0) return <EmptyTabState />;
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mt-4">
			{playlists.map((pl: any) => (
				<PlaylistCard key={pl.PLAYLIST_ID || pl.id} playlist={pl} />
			))}
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<SearchContent />
		</Suspense>
	);
}
