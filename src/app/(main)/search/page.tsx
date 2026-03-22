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
	TabsContent,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2 } from "lucide-react";
import { TrackDownloadStatus } from "@/components/downloads/TrackDownloadStatus";
import { useLongPress } from "@/hooks/useLongPress";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { PreviewButton } from "@/components/audio/PreviewButton";
import { CoverImage } from "@/components/ui/cover-image";
import { useDownloadedTracks } from "@/hooks/useDownloadedTracks";
import { AddToPlaylist } from "@/components/playlists/AddToPlaylist";
import { PlaybackIndicator } from "@/components/audio/PlaybackIndicator";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

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
	const handleDownload = (id: string | number, type: string) => {
		download(deezerUrl(id, type));
	};
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

	const { downloaded } = useDownloadedTracks(allTrackIds);

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
				<h1 className="text-brutal-lg">
					Search results for &ldquo;{term}&rdquo;
				</h1>
			</div>

			<Tabs
				value={tab}
				onValueChange={(value) => setTab(value as SearchTab)}
			>
				<div className="flex flex-wrap gap-1.5">
					{([
						["all", "All"],
						["track", "Tracks"],
						["album", "Albums"],
						["artist", "Artists"],
						["playlist", "Playlists"],
					] as const).map(([value, label]) => (
						<button
							key={value}
							onClick={() => setTab(value)}
							className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-foreground transition-colors ${
								tab === value
									? "bg-foreground text-background"
									: "bg-muted text-foreground hover:bg-accent"
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
							<AllResults
								results={results}
								onDownload={handleDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
								downloaded={downloaded}
							/>
						</TabsContent>
						<TabsContent value="track">
							<TrackResults
								data={results}
								onDownload={handleDownload}
								isLoading={isLoading}
								deezerUrl={deezerUrl}
								downloaded={downloaded}
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
	downloaded,
}: {
	results: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
	downloaded: Set<string>;
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
					<h2 className="text-xs font-black text-foreground uppercase tracking-[0.15em]">
						Tracks
					</h2>
					<div className="border-2 sm:border-[3px] border-foreground overflow-hidden">
						{tracks.map((track: any, idx: number) => (
							<div key={track.SNG_ID || track.id}>
								<TrackRow track={track} onDownload={onDownload} isLoading={isLoading} deezerUrl={deezerUrl} downloaded={downloaded} />
								{idx < tracks.length - 1 && <Separator />}
							</div>
						))}
					</div>
				</section>
			)}
			{albums.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-xs font-black text-foreground uppercase tracking-[0.15em]">
						Albums
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
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
					<h2 className="text-xs font-black text-foreground uppercase tracking-[0.15em]">
						Artists
					</h2>
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
				<section className="space-y-3">
					<h2 className="text-xs font-black text-foreground uppercase tracking-[0.15em]">
						Playlists
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
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
	downloaded,
}: {
	track: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
	downloaded?: Set<string>;
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
	const previewUrl = (track.MEDIA?.[0]?.HREF || track.preview || "").replace("http://", "https://");

	const previewTrack = usePreviewStore((s) => s.currentTrack);
	const previewPlaying = usePreviewStore((s) => s.isPlaying);
	const playerTrack = usePlayerStore((s) => s.currentTrack);
	const playerPlaying = usePlayerStore((s) => s.isPlaying);
	const isPreviewActive = previewTrack?.id === String(id) && previewPlaying;
	const isPlayerActive = playerTrack?.trackId === String(id) && playerPlaying;
	const isActive = isPreviewActive || isPlayerActive;
	const isPaused = (previewTrack?.id === String(id) && !previewPlaying) || (playerTrack?.trackId === String(id) && !playerPlaying);

	const openSheet = useTrackActionStore((s) => s.openSheet);
	const longPress = useLongPress(() => {
		openSheet(
			{
				id: String(id),
				title,
				artist: artistName,
				cover: cover || undefined,
				duration: duration ? Number(duration) : undefined,
				albumId: albumId ? String(albumId) : undefined,
				albumTitle,
				artistId: artistId ? String(artistId) : undefined,
				previewUrl: previewUrl || undefined,
			},
			{ onDownload: () => onDownload(id, "track") }
		);
	});

	return (
		<div {...longPress} className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 overflow-hidden group transition-colors select-none ${isActive || isPaused ? "bg-accent/20" : "hover:bg-accent/20"}`}>
			<div className="relative">
				<CoverImage src={cover} className={`size-9 sm:size-10 border-0 transition-opacity ${isActive ? "opacity-50" : ""}`} />
				{(isActive || isPaused) && (
					<div className="absolute inset-0 flex items-center justify-center">
						<PlaybackIndicator paused={isPaused} />
					</div>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className={`text-sm font-bold truncate ${isActive || isPaused ? "text-primary" : ""}`}>{title}</p>
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
			<span className="hidden sm:inline text-xs text-muted-foreground font-mono tabular-nums">
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
			<TrackDownloadStatus
				trackId={id}
				isAlreadyDownloaded={downloaded?.has(String(id)) ?? false}
				apiLoading={isLoading(deezerUrl(id, "track"))}
				onDownload={() => onDownload(id, "track")}
			/>
			<AddToPlaylist
				track={{
					trackId: String(id),
					title,
					artist: artistName,
					album: albumTitle,
					coverUrl: cover,
					duration: duration ? Number(duration) : null,
				}}
				className="hidden sm:flex size-7"
			/>
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
	const artistName = album.ART_NAME || album.artist?.name;
	const artistId = album.ART_ID || album.artist?.id;
	const cover =
		album.cover_medium ||
		album.cover_big ||
		getCoverUrl(album.ALB_PICTURE, 250) ||
		"/placeholder.jpg";

	return (
		<div className="group border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all bg-card overflow-hidden">
			<div className="relative">
				<Link href={`/album?id=${id}`}>
					<CoverImage
						src={cover}
						alt={title}
						loading="lazy"
						className="w-full aspect-square border-0"
					/>
				</Link>
				<div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
					<Button
						size="sm"
						onClick={() => onDownload(id, "album")}
						disabled={isLoading(deezerUrl(id, "album"))}
						className="gap-1.5 pointer-events-auto"
					>
						{isLoading(deezerUrl(id, "album")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
						{isLoading(deezerUrl(id, "album")) ? "Adding..." : "Download"}
					</Button>
				</div>
			</div>
			<div className="mt-2 px-2 pb-2">
				<Link
					href={`/album?id=${id}`}
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
	onDownload,
	isLoading,
	deezerUrl,
	downloaded,
}: {
	data: any;
	onDownload: (id: string, type: string) => void;
	isLoading: (url: string) => boolean;
	deezerUrl: (id: string | number, type: string) => string;
	downloaded?: Set<string>;
}) {
	const tracks = data?.data || [];
	if (tracks.length === 0) return <EmptyTabState />;
	return (
		<div className="mt-4 border-2 sm:border-[3px] border-foreground overflow-hidden">
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
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mt-4">
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
				<div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
					<Button
						size="sm"
						onClick={() => onDownload(id, "playlist")}
						disabled={isLoading(deezerUrl(id, "playlist"))}
						className="gap-1.5 pointer-events-auto"
					>
						{isLoading(deezerUrl(id, "playlist")) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
						{isLoading(deezerUrl(id, "playlist")) ? "Adding..." : "Download"}
					</Button>
				</div>
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
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mt-4">
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
