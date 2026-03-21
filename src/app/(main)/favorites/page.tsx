"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { useLoginStore } from "@/stores/useLoginStore";
import { convertDuration } from "@/utils/helpers";
import Link from "next/link";

type FavTab = "playlists" | "albums" | "artists" | "tracks";

export default function FavoritesPage() {
	const loggedIn = useLoginStore((s) => s.loggedIn);
	const [tab, setTab] = useState<FavTab>("playlists");
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!loggedIn) {
			setLoading(false);
			return;
		}

		async function loadFavorites() {
			try {
				const res = await fetchData("user-favorites");
				setData(res);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadFavorites();
	}, [loggedIn]);

	const handleDownload = (id: string, type: string) => {
		const url = `https://www.deezer.com/${type}/${id}`;
		postToServer("add-to-queue", { url, bitrate: null });
	};

	if (!loggedIn) {
		return (
			<div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
				Please login to see your favorites
			</div>
		);
	}

	if (loading) {
		return <div style={{ color: "var(--text-muted)" }}>Loading favorites...</div>;
	}

	const tabs: { key: FavTab; label: string }[] = [
		{ key: "playlists", label: "Playlists" },
		{ key: "albums", label: "Albums" },
		{ key: "artists", label: "Artists" },
		{ key: "tracks", label: "Tracks" },
	];

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Favorites</h1>

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

			{tab === "playlists" && data?.playlists && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{data.playlists.map((pl: any) => (
						<div key={pl.id}>
							<div className="cover-container">
								<img src={pl.picture_medium || "/placeholder.jpg"} alt={pl.title} loading="lazy" />
								<div className="overlay">
									<button onClick={() => handleDownload(pl.id, "playlist")} className="btn btn-primary text-sm">
										Download
									</button>
								</div>
							</div>
							<span className="block mt-2 text-sm truncate">{pl.title}</span>
							<span className="text-xs" style={{ color: "var(--text-muted)" }}>
								{pl.nb_tracks} tracks
							</span>
						</div>
					))}
				</div>
			)}

			{tab === "albums" && data?.albums && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{data.albums.map((album: any) => (
						<div key={album.id}>
							<div className="cover-container">
								<Link href={`/album?id=${album.id}`}>
									<img src={album.cover_medium || "/placeholder.jpg"} alt={album.title} loading="lazy" />
								</Link>
								<div className="overlay">
									<button onClick={() => handleDownload(album.id, "album")} className="btn btn-primary text-sm">
										Download
									</button>
								</div>
							</div>
							<span className="block mt-2 text-sm truncate">{album.title}</span>
							<span className="text-xs" style={{ color: "var(--text-secondary)" }}>
								{album.artist?.name}
							</span>
						</div>
					))}
				</div>
			)}

			{tab === "artists" && data?.artists && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					{data.artists.map((artist: any) => (
						<div key={artist.id} className="text-center">
							<Link href={`/artist?id=${artist.id}`}>
								<div className="cover-container rounded-full mx-auto" style={{ maxWidth: "150px" }}>
									<img src={artist.picture_medium || "/placeholder.jpg"} alt={artist.name} loading="lazy" className="rounded-full" />
								</div>
							</Link>
							<span className="block mt-2 text-sm truncate">{artist.name}</span>
						</div>
					))}
				</div>
			)}

			{tab === "tracks" && data?.tracks && (
				<div className="space-y-1">
					{data.tracks.map((track: any) => (
						<div
							key={track.id}
							className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group"
							onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
							onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
						>
							{track.album?.cover_small && <img src={track.album.cover_small} alt="" className="w-10 h-10 rounded" />}
							<div className="flex-1 min-w-0">
								<div className="text-sm truncate">{track.title}</div>
								<div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
									{track.artist?.name}
								</div>
							</div>
							<span className="text-xs" style={{ color: "var(--text-muted)" }}>
								{track.duration ? convertDuration(track.duration) : ""}
							</span>
							<button
								onClick={() => handleDownload(track.id, "track")}
								className="opacity-0 group-hover:opacity-100 btn btn-primary text-xs py-1 px-2"
							>
								DL
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
