"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData, postToServer } from "@/utils/api";
import Link from "next/link";

function ArtistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [artist, setArtist] = useState<any>(null);
	const [releases, setReleases] = useState<any>({});
	const [tab, setTab] = useState("all");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		async function loadArtist() {
			try {
				const data = await fetchData("tracklist", { id, type: "artist" });
				setArtist(data?.artist || data);
				setReleases(data?.releases || {});
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadArtist();
	}, [id]);

	const handleDownload = (albumId: string) => {
		const url = `https://www.deezer.com/album/${albumId}`;
		postToServer("add-to-queue", { url, bitrate: null });
	};

	if (loading) return <div style={{ color: "var(--text-muted)" }}>Loading...</div>;
	if (!artist) return <div style={{ color: "var(--text-muted)" }}>Artist not found</div>;

	const tabKeys = Object.keys(releases).filter((k) => releases[k]?.length > 0);
	const currentReleases = releases[tab] || [];

	return (
		<div>
			<div className="flex gap-6 mb-8">
				{(artist.picture_xl || artist.picture_big) && (
					<div className="w-48 h-48 rounded-full overflow-hidden flex-shrink-0">
						<img
							src={artist.picture_xl || artist.picture_big}
							alt={artist.name}
							className="w-full h-full object-cover"
						/>
					</div>
				)}
				<div className="flex flex-col justify-end">
					<span className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
						Artist
					</span>
					<h1 className="text-3xl font-bold mb-2">{artist.name}</h1>
					{artist.nb_fan && (
						<p className="text-sm" style={{ color: "var(--text-muted)" }}>
							{artist.nb_fan.toLocaleString()} fans
						</p>
					)}
				</div>
			</div>

			{tabKeys.length > 0 && (
				<div className="flex gap-2 mb-6">
					{tabKeys.map((key) => (
						<button
							key={key}
							onClick={() => setTab(key)}
							className="px-4 py-2 rounded-full text-sm transition-colors capitalize cursor-pointer"
							style={{
								background: tab === key ? "var(--primary)" : "var(--bg-tertiary)",
								color: tab === key ? "white" : "var(--text-secondary)",
							}}
						>
							{key} ({releases[key].length})
						</button>
					))}
				</div>
			)}

			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
				{currentReleases.map((album: any) => (
					<div key={album.id}>
						<div className="cover-container">
							<Link href={`/album?id=${album.id}`}>
								<img
									src={album.cover_medium || album.cover_big || "/placeholder.jpg"}
									alt={album.title}
									loading="lazy"
								/>
							</Link>
							<div className="overlay">
								<button onClick={() => handleDownload(album.id)} className="btn btn-primary text-sm">
									Download
								</button>
							</div>
						</div>
						<Link
							href={`/album?id=${album.id}`}
							className="block mt-2 text-sm truncate no-underline"
							style={{ color: "var(--text-primary)" }}
						>
							{album.title}
						</Link>
						<span className="text-xs" style={{ color: "var(--text-muted)" }}>
							{album.release_date} {album.nb_tracks ? `- ${album.nb_tracks} tracks` : ""}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default function ArtistPage() {
	return (
		<Suspense fallback={<div style={{ color: "var(--text-muted)" }}>Loading...</div>}>
			<ArtistContent />
		</Suspense>
	);
}
