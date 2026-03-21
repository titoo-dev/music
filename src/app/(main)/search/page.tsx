"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { convertDuration } from "@/utils/helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2 } from "lucide-react";
import { PreviewButton } from "@/components/audio/PreviewButton";
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

type SearchTab = "all" | "track" | "album" | "artist" | "playlist";

function SearchContent() {
	const searchParams = useSearchParams();
	const term = searchParams.get("term") || "";
	const [tab, setTab] = useState<SearchTab>("all");
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

	const { download, isLoading } = useDownload();
	const deezerUrl = (id: string | number, type: string) => `https://www.deezer.com/${type}/${id}`;
	const handleDownload = (id: string | number, type: string) => download(deezerUrl(id, type));
	const hasMore = tab !== "all" && results?.data && results?.total && results.data.length < results.total;

	if (!term) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-medium text-muted-foreground">No search query</p>
				<p className="text-xs text-muted-foreground">Type something in the search bar to get started.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Search results for &ldquo;{term}&rdquo;
				</h1>
			</div>

			<Tabs
				value={tab}
				onValueChange={(value) => setTab(value as SearchTab)}
			>
				<TabsList>
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="track">Tracks</TabsTrigger>
					<TabsTrigger value="album">Albums</TabsTrigger>
					<TabsTrigger value="artist">Artists</TabsTrigger>
					<TabsTrigger value="playlist">Playlists</TabsTrigger>
				</TabsList>

				{loading && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				)}

				{!loading && results && (
					<>
						<TabsContent value="all">
							<AllResults
								results={results}
								onDownload={handleDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
							/>
						</TabsContent>
						<TabsContent value="track">
							<TrackResults
								data={results}
								onDownload={handleDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
							/>
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
						<TabsContent value="album">
							<AlbumResults
								data={results}
								onDownload={handleDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
							/>
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
						<TabsContent value="artist">
							<ArtistResults data={results} />
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
						<TabsContent value="playlist">
							<PlaylistResults
								data={results}
								onDownload={handleDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
							/>
							{hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
						</TabsContent>
					</>
				)}

				{!loading && !results && term && (
					<div className="flex flex-col items-center justify-center py-24 gap-2">
						<p className="text-sm font-medium text-muted-foreground">No results found</p>
						<p className="text-xs text-muted-foreground">Try a different search term.</p>
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
	onDownload,
	isLoading,
	deezerUrl,
}: {
	results: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
}) {
	const tracks = results?.TRACK?.data?.slice(0, 15) || [];
	const albums = results?.ALBUM?.data?.slice(0, 18) || [];
	const artists = results?.ARTIST?.data?.slice(0, 12) || [];
	const playlists = results?.PLAYLIST?.data?.slice(0, 12) || [];

	if (tracks.length === 0 && albums.length === 0 && artists.length === 0 && playlists.length === 0) {
		return <EmptyTabState />;
	}

	return (
		<div className="space-y-8 mt-4">
			{tracks.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Tracks
					</h2>
					<div className="rounded-lg border border-border overflow-hidden">
						{tracks.map((track: any, idx: number) => (
							<div key={track.SNG_ID || track.id}>
								<TrackRow track={track} onDownload={onDownload} isLoading={isLoading} deezerUrl={deezerUrl} />
								{idx < tracks.length - 1 && <Separator />}
							</div>
						))}
					</div>
				</section>
			)}
			{albums.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Albums
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{albums.map((album: any) => (
							<AlbumCard
								key={album.ALB_ID || album.id}
								album={album}
								onDownload={onDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
							/>
						))}
					</div>
				</section>
			)}
			{artists.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Artists
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Playlists
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{playlists.map((pl: any) => (
							<PlaylistCard
								key={pl.PLAYLIST_ID || pl.id}
								playlist={pl}
								onDownload={onDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
							/>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function TrackRow({
	track,
	onDownload,
	isLoading,
	deezerUrl,
}: {
	track: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
}) {
	const id = track.SNG_ID || track.id;
	const title = track.SNG_TITLE || track.title;
	const artistName = track.ART_NAME || track.artist?.name;
	const artistId = track.ART_ID || track.artist?.id;
	const albumTitle = track.ALB_TITLE || track.album?.title;
	const albumId = track.ALB_ID || track.album?.id;
	const duration = track.DURATION || track.duration;
	const cover =
		track.album?.cover_small ||
		getCoverUrl(track.ALB_PICTURE, 56);
	const previewUrl = track.MEDIA?.[0]?.HREF || track.preview || "";

	return (
		<div className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/50 transition-colors">
			<CoverImage src={cover} className="w-10 h-10 rounded-md" />
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium truncate">{title}</p>
				<p className="text-xs text-muted-foreground truncate">
					{artistId ? (
						<Link href={`/artist?id=${artistId}`} className="hover:underline hover:text-foreground transition-colors">
							{artistName}
						</Link>
					) : artistName}
					{albumTitle ? (
						<>
							{" · "}
							{albumId ? (
								<Link href={`/album?id=${albumId}`} className="hover:underline hover:text-foreground transition-colors">
									{albumTitle}
								</Link>
							) : albumTitle}
						</>
					) : ""}
				</p>
			</div>
			<span className="text-xs text-muted-foreground tabular-nums">
				{duration ? convertDuration(duration) : ""}
			</span>
			<PreviewButton
				track={{
					id,
					title,
					artist: artistName,
					cover: cover || "",
					previewUrl,
				}}
			/>
			<Button
				size="icon-sm"
				variant="ghost"
				onClick={() => onDownload(id, "track")}
				disabled={isLoading(deezerUrl(id, "track"))}
				className="opacity-0 group-hover:opacity-100 transition-opacity"
			>
				{isLoading(deezerUrl(id, "track")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
			</Button>
		</div>
	);
}

function AlbumCard({
	album,
	onDownload,
	isLoading,
	deezerUrl,
}: {
	album: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
}) {
	const id = album.ALB_ID || album.id;
	const title = album.ALB_TITLE || album.title;
	const artist = album.ART_NAME || album.artist?.name;
	const cover =
		album.cover_medium ||
		album.cover_big ||
		getCoverUrl(album.ALB_PICTURE, 250) ||
		"/placeholder.jpg";

	return (
		<div className="group">
			<div className="relative rounded-xl overflow-hidden bg-muted/30">
				<Link href={`/album?id=${id}`}>
					<CoverImage
						src={cover}
						alt={title}
						loading="lazy"
						className="w-full aspect-square transition-transform duration-200 group-hover:scale-[1.02]"
					/>
				</Link>
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
					<Button
						size="sm"
						onClick={() => onDownload(id, "album")}
						disabled={isLoading(deezerUrl(id, "album"))}
						className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1.5"
					>
						{isLoading(deezerUrl(id, "album")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
						{isLoading(deezerUrl(id, "album")) ? "Adding..." : "Download"}
					</Button>
				</div>
			</div>
			<div className="mt-2 px-0.5">
				<Link
					href={`/album?id=${id}`}
					className="text-sm font-medium truncate block hover:underline"
				>
					{title}
				</Link>
				<p className="text-xs text-muted-foreground truncate">{artist}</p>
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
		<div className="group text-center">
			<Link href={`/artist?id=${id}`}>
				<div className="rounded-full overflow-hidden bg-muted/30 aspect-square">
					<CoverImage
						src={picture}
						alt={name}
						loading="lazy"
						className="w-full h-full transition-transform duration-200 group-hover:scale-[1.05]"
					/>
				</div>
			</Link>
			<div className="mt-2">
				<Link
					href={`/artist?id=${id}`}
					className="text-sm font-medium truncate block hover:underline"
				>
					{name}
				</Link>
			</div>
		</div>
	);
}

function TrackResults({
	data,
	onDownload,
	isLoading,
	deezerUrl,
}: {
	data: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
}) {
	const tracks = data?.data || [];
	if (tracks.length === 0) return <EmptyTabState />;
	return (
		<div className="mt-4 rounded-lg border border-border overflow-hidden">
			{tracks.map((track: any, idx: number) => (
				<div key={track.SNG_ID || track.id}>
					<TrackRow track={track} onDownload={onDownload} isLoading={isLoading} deezerUrl={deezerUrl} />
					{idx < tracks.length - 1 && <Separator />}
				</div>
			))}
		</div>
	);
}

function AlbumResults({
	data,
	onDownload,
	isLoading,
	deezerUrl,
}: {
	data: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
}) {
	const albums = data?.data || [];
	if (albums.length === 0) return <EmptyTabState />;
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
			{albums.map((album: any) => (
				<AlbumCard
					key={album.ALB_ID || album.id}
					album={album}
					onDownload={onDownload}
					isLoading={isLoading}
					deezerUrl={deezerUrl}
				/>
			))}
		</div>
	);
}

function ArtistResults({ data }: { data: any }) {
	const artists = data?.data || [];
	if (artists.length === 0) return <EmptyTabState />;
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
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
			<p className="text-sm font-medium text-muted-foreground">No results</p>
			<p className="text-xs text-muted-foreground">No matches found for this category.</p>
		</div>
	);
}

function PlaylistCard({
	playlist: pl,
	onDownload,
	isLoading,
	deezerUrl,
}: {
	playlist: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
}) {
	const id = pl.PLAYLIST_ID || pl.id;
	const title = pl.TITLE || pl.title;
	const nbTracks = pl.NB_SONG || pl.nb_tracks;
	const picture =
		pl.picture_xl ||
		pl.picture_medium ||
		getCoverUrl(pl.PLAYLIST_PICTURE, 250) ||
		"/placeholder.jpg";

	return (
		<div className="group">
			<div className="relative rounded-xl overflow-hidden bg-muted/30">
				<Link href={`/playlist?id=${id}`}>
					<CoverImage
						src={picture}
						alt={title}
						loading="lazy"
						className="w-full aspect-square transition-transform duration-200 group-hover:scale-[1.02]"
					/>
				</Link>
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center pointer-events-none">
					<Button
						size="sm"
						onClick={() => onDownload(id, "playlist")}
						disabled={isLoading(deezerUrl(id, "playlist"))}
						className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1.5 pointer-events-auto"
					>
						{isLoading(deezerUrl(id, "playlist")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
						{isLoading(deezerUrl(id, "playlist")) ? "Adding..." : "Download"}
					</Button>
				</div>
			</div>
			<div className="mt-2 px-0.5">
				<Link
					href={`/playlist?id=${id}`}
					className="text-sm font-medium truncate block hover:underline"
				>
					{title}
				</Link>
				{nbTracks != null && (
					<p className="text-xs text-muted-foreground truncate">{nbTracks} tracks</p>
				)}
			</div>
		</div>
	);
}

function PlaylistResults({
	data,
	onDownload,
	isLoading,
	deezerUrl,
}: {
	data: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
}) {
	const playlists = data?.data || [];
	if (playlists.length === 0) return <EmptyTabState />;
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
			{playlists.map((pl: any) => (
				<PlaylistCard
					key={pl.PLAYLIST_ID || pl.id}
					playlist={pl}
					onDownload={onDownload}
					isLoading={isLoading}
					deezerUrl={deezerUrl}
				/>
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
