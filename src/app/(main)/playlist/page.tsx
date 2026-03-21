"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData, postToServer } from "@/utils/api";
import { convertDuration } from "@/utils/helpers";

function PlaylistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [playlist, setPlaylist] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		async function loadPlaylist() {
			try {
				const data = await fetchData("tracklist", { id, type: "playlist" });
				setPlaylist(data);
				setTracks(data?.tracks || []);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadPlaylist();
	}, [id]);

	const handleDownloadAll = () => {
		const url = `https://www.deezer.com/playlist/${id}`;
		postToServer("add-to-queue", { url, bitrate: null });
	};

	const handleDownloadTrack = (trackId: string) => {
		const url = `https://www.deezer.com/track/${trackId}`;
		postToServer("add-to-queue", { url, bitrate: null });
	};

	if (loading) return <div style={{ color: "var(--text-muted)" }}>Loading...</div>;
	if (!playlist) return <div style={{ color: "var(--text-muted)" }}>Playlist not found</div>;

	return (
		<div>
			<div className="flex gap-6 mb-8">
				<div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
					<img
						src={playlist.picture_xl || playlist.picture_big || "/placeholder.jpg"}
						alt={playlist.title}
						className="w-full h-full object-cover"
					/>
				</div>
				<div className="flex flex-col justify-end">
					<span className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
						Playlist
					</span>
					<h1 className="text-3xl font-bold mb-2">{playlist.title}</h1>
					{playlist.creator && (
						<p style={{ color: "var(--text-secondary)" }}>by {playlist.creator?.name}</p>
					)}
					<p className="text-sm" style={{ color: "var(--text-muted)" }}>
						{playlist.nb_tracks || tracks.length} tracks
					</p>
					<button onClick={handleDownloadAll} className="btn btn-primary mt-4 w-fit">
						Download Playlist
					</button>
				</div>
			</div>

			<div className="space-y-1">
				{tracks.map((track: any, idx: number) => (
					<div
						key={track.id || track.SNG_ID || idx}
						className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group"
						onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
						onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
					>
						<span className="text-sm w-8 text-right" style={{ color: "var(--text-muted)" }}>
							{idx + 1}
						</span>
						{(track.album?.cover_small || track.ALB_PICTURE) && (
							<img
								src={
									track.album?.cover_small ||
									`https://e-cdns-images.dzcdn.net/images/cover/${track.ALB_PICTURE}/56x56-000000-80-0-0.jpg`
								}
								alt=""
								className="w-10 h-10 rounded"
							/>
						)}
						<div className="flex-1 min-w-0">
							<div className="text-sm truncate">{track.title || track.SNG_TITLE}</div>
							<div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
								{track.artist?.name || track.ART_NAME}
							</div>
						</div>
						<span className="text-xs" style={{ color: "var(--text-muted)" }}>
							{convertDuration(track.duration || track.DURATION || 0)}
						</span>
						<button
							onClick={() => handleDownloadTrack(track.id || track.SNG_ID)}
							className="opacity-0 group-hover:opacity-100 btn btn-primary text-xs py-1 px-2"
						>
							DL
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

export default function PlaylistPage() {
	return (
		<Suspense fallback={<div style={{ color: "var(--text-muted)" }}>Loading...</div>}>
			<PlaylistContent />
		</Suspense>
	);
}
