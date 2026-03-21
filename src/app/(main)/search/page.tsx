"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchData, postToServer } from "@/utils/api";
import { convertDuration } from "@/utils/helpers";
import Link from "next/link";

type SearchTab = "all" | "track" | "album" | "artist" | "playlist";

function SearchContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const term = searchParams.get("term") || "";
	const [tab, setTab] = useState<SearchTab>("all");
	const [results, setResults] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const doSearch = useCallback(async () => {
		if (!term) return;
		setLoading(true);
		try {
			if (tab === "all") {
				const data = await fetchData("main-search", { term });
				setResults(data);
			} else {
				const data = await fetchData("search", { term, type: tab, start: "0", nb: "30" });
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

	const handleDownload = (id: string | number, type: string) => {
		const url = `https://www.deezer.com/${type}/${id}`;
		postToServer("add-to-queue", { url, bitrate: null });
	};

	if (!term) {
		return (
			<div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
				Type something to search
			</div>
		);
	}

	const tabs: { key: SearchTab; label: string }[] = [
		{ key: "all", label: "All" },
		{ key: "track", label: "Tracks" },
		{ key: "album", label: "Albums" },
		{ key: "artist", label: "Artists" },
		{ key: "playlist", label: "Playlists" },
	];

	return (
		<div>
			<h1 className="text-xl font-bold mb-4">
				Results for &quot;{term}&quot;
			</h1>

			{/* Tabs */}
			<div className="flex gap-2 mb-6">
				{tabs.map((t) => (
					<button
						key={t.key}
						onClick={() => setTab(t.key)}
						className="px-4 py-2 rounded-full text-sm transition-colors cursor-pointer"
						style={{
							background: tab === t.key ? "var(--primary)" : "var(--bg-tertiary)",
							color: tab === t.key ? "white" : "var(--text-secondary)",
						}}
					>
						{t.label}
					</button>
				))}
			</div>

			{loading && (
				<div className="py-8 text-center" style={{ color: "var(--text-muted)" }}>
					Searching...
				</div>
			)}

			{!loading && results && tab === "all" && <AllResults results={results} onDownload={handleDownload} />}
			{!loading && results && tab === "track" && <TrackResults data={results} onDownload={handleDownload} />}
			{!loading && results && tab === "album" && <AlbumResults data={results} onDownload={handleDownload} />}
			{!loading && results && tab === "artist" && <ArtistResults data={results} />}
			{!loading && results && tab === "playlist" && <PlaylistResults data={results} onDownload={handleDownload} />}
		</div>
	);
}

function AllResults({ results, onDownload }: { results: any; onDownload: (id: string, type: string) => void }) {
	const tracks = results?.TRACK?.data?.slice(0, 6) || [];
	const albums = results?.ALBUM?.data?.slice(0, 6) || [];
	const artists = results?.ARTIST?.data?.slice(0, 6) || [];

	return (
		<div className="space-y-8">
			{tracks.length > 0 && (
				<section>
					<h2 className="text-lg font-semibold mb-3">Tracks</h2>
					<div className="space-y-1">
						{tracks.map((track: any) => (
							<TrackRow key={track.SNG_ID || track.id} track={track} onDownload={onDownload} />
						))}
					</div>
				</section>
			)}
			{albums.length > 0 && (
				<section>
					<h2 className="text-lg font-semibold mb-3">Albums</h2>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{albums.map((album: any) => (
							<AlbumCard key={album.ALB_ID || album.id} album={album} onDownload={onDownload} />
						))}
					</div>
				</section>
			)}
			{artists.length > 0 && (
				<section>
					<h2 className="text-lg font-semibold mb-3">Artists</h2>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{artists.map((artist: any) => (
							<ArtistCard key={artist.ART_ID || artist.id} artist={artist} />
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function TrackRow({ track, onDownload }: { track: any; onDownload: (id: string, type: string) => void }) {
	const id = track.SNG_ID || track.id;
	const title = track.SNG_TITLE || track.title;
	const artist = track.ART_NAME || track.artist?.name;
	const album = track.ALB_TITLE || track.album?.title;
	const duration = track.DURATION || track.duration;
	const cover = track.ALB_PICTURE
		? `https://e-cdns-images.dzcdn.net/images/cover/${track.ALB_PICTURE}/56x56-000000-80-0-0.jpg`
		: track.album?.cover_small;

	return (
		<div
			className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group cursor-pointer"
			style={{ background: "transparent" }}
			onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
			onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
		>
			{cover && <img src={cover} alt="" className="w-10 h-10 rounded" />}
			<div className="flex-1 min-w-0">
				<div className="text-sm truncate">{title}</div>
				<div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
					{artist} {album ? `- ${album}` : ""}
				</div>
			</div>
			<span className="text-xs" style={{ color: "var(--text-muted)" }}>
				{duration ? convertDuration(duration) : ""}
			</span>
			<button
				onClick={() => onDownload(id, "track")}
				className="opacity-0 group-hover:opacity-100 transition-opacity btn btn-primary text-xs py-1 px-2"
			>
				DL
			</button>
		</div>
	);
}

function AlbumCard({ album, onDownload }: { album: any; onDownload: (id: string, type: string) => void }) {
	const id = album.ALB_ID || album.id;
	const title = album.ALB_TITLE || album.title;
	const artist = album.ART_NAME || album.artist?.name;
	const cover = album.ALB_PICTURE
		? `https://e-cdns-images.dzcdn.net/images/cover/${album.ALB_PICTURE}/250x250-000000-80-0-0.jpg`
		: album.cover_medium;

	return (
		<div>
			<div className="cover-container">
				<Link href={`/album?id=${id}`}>
					<img src={cover || "/placeholder.jpg"} alt={title} loading="lazy" />
				</Link>
				<div className="overlay">
					<button onClick={() => onDownload(id, "album")} className="btn btn-primary text-sm">
						Download
					</button>
				</div>
			</div>
			<Link href={`/album?id=${id}`} className="block mt-2 text-sm truncate no-underline" style={{ color: "var(--text-primary)" }}>
				{title}
			</Link>
			<span className="text-xs" style={{ color: "var(--text-secondary)" }}>
				{artist}
			</span>
		</div>
	);
}

function ArtistCard({ artist }: { artist: any }) {
	const id = artist.ART_ID || artist.id;
	const name = artist.ART_NAME || artist.name;
	const picture = artist.ART_PICTURE
		? `https://e-cdns-images.dzcdn.net/images/artist/${artist.ART_PICTURE}/250x250-000000-80-0-0.jpg`
		: artist.picture_medium;

	return (
		<div className="text-center">
			<Link href={`/artist?id=${id}`}>
				<div className="cover-container rounded-full mx-auto" style={{ maxWidth: "150px" }}>
					<img src={picture || "/placeholder.jpg"} alt={name} loading="lazy" className="rounded-full" />
				</div>
			</Link>
			<Link href={`/artist?id=${id}`} className="block mt-2 text-sm truncate no-underline" style={{ color: "var(--text-primary)" }}>
				{name}
			</Link>
		</div>
	);
}

function TrackResults({ data, onDownload }: { data: any; onDownload: (id: string, type: string) => void }) {
	const tracks = data?.data || [];
	return (
		<div className="space-y-1">
			{tracks.map((track: any) => (
				<TrackRow key={track.SNG_ID || track.id} track={track} onDownload={onDownload} />
			))}
		</div>
	);
}

function AlbumResults({ data, onDownload }: { data: any; onDownload: (id: string, type: string) => void }) {
	const albums = data?.data || [];
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
			{albums.map((album: any) => (
				<AlbumCard key={album.ALB_ID || album.id} album={album} onDownload={onDownload} />
			))}
		</div>
	);
}

function ArtistResults({ data }: { data: any }) {
	const artists = data?.data || [];
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			{artists.map((artist: any) => (
				<ArtistCard key={artist.ART_ID || artist.id} artist={artist} />
			))}
		</div>
	);
}

function PlaylistResults({ data, onDownload }: { data: any; onDownload: (id: string, type: string) => void }) {
	const playlists = data?.data || [];
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
			{playlists.map((pl: any) => {
				const id = pl.PLAYLIST_ID || pl.id;
				const title = pl.TITLE || pl.title;
				const picture = pl.PLAYLIST_PICTURE
					? `https://e-cdns-images.dzcdn.net/images/playlist/${pl.PLAYLIST_PICTURE}/250x250-000000-80-0-0.jpg`
					: pl.picture_medium;
				return (
					<div key={id}>
						<div className="cover-container">
							<img src={picture || "/placeholder.jpg"} alt={title} loading="lazy" />
							<div className="overlay">
								<button onClick={() => onDownload(id, "playlist")} className="btn btn-primary text-sm">
									Download
								</button>
							</div>
						</div>
						<span className="block mt-2 text-sm truncate">{title}</span>
					</div>
				);
			})}
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense fallback={<div style={{ color: "var(--text-muted)" }}>Loading...</div>}>
			<SearchContent />
		</Suspense>
	);
}
