"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Shuffle } from "lucide-react";
import { EntityHero } from "@/components/layout/EntityHero";
import { TrackRow, trackFromDeezerRaw } from "@/components/tracks/TrackRow";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";

function getCoverUrl(hash: string, size = 500) {
	if (!hash) return "";
	if (hash.startsWith("http")) return hash;
	return `https://e-cdns-images.dzcdn.net/images/cover/${hash}/${size}x${size}-000000-80-0-0.jpg`;
}

function PlaylistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [playlist, setPlaylist] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const playerPlay = usePlayerStore((s) => s.play);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

	useEffect(() => {
		if (!id) return;
		async function loadPlaylist() {
			try {
				const data = await fetchData("content/tracklist", { id, type: "playlist" });
				const playlistData = data?.DATA || data;
				setPlaylist(playlistData);
				setTracks(data?.tracks || data?.SONGS?.data || []);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadPlaylist();
	}, [id]);


	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	if (!playlist)
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-bold uppercase text-muted-foreground">Playlist not found</p>
				<p className="text-xs font-bold uppercase text-muted-foreground">The playlist you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
			</div>
		);

	const playlistCover =
		playlist.picture_xl ||
		playlist.picture_big ||
		playlist.picture_medium ||
		getCoverUrl(playlist.PLAYLIST_PICTURE, 500) ||
		"/placeholder.jpg";

	const playlistTitle = playlist.title || playlist.TITLE || "Playlist";
	const creatorName = playlist.creator?.name;

	const playableTracks: PlayerTrack[] = tracks.map((t: any) => {
		const n = trackFromDeezerRaw(t);
		return {
			trackId: n.trackId,
			title: n.title,
			artist: n.artist,
			artistId: n.artistId ?? null,
			cover: n.cover,
			duration: n.duration ?? null,
		};
	});

	const handlePlayAll = () => {
		if (playableTracks.length === 0) return;
		playerPlay(playableTracks[0], playableTracks);
	};

	const handleShuffleAll = () => {
		if (playableTracks.length === 0) return;
		const wasShuffled = usePlayerStore.getState().shuffle;
		if (!wasShuffled) toggleShuffle();
		playerPlay(playableTracks[0], playableTracks);
	};

	return (
		<div className="space-y-10">
			<EntityHero
				eyebrow={`PLAYLIST${creatorName ? ` · BY ${String(creatorName).toUpperCase()}` : " · PERSONAL"}`}
				title={playlistTitle}
				subtitle={
					creatorName ? (
						<span className="font-bold">
							BY <span className="text-primary">{creatorName}</span>
						</span>
					) : undefined
				}
				meta={`${playlist.nb_tracks || tracks.length} TRACKS`}
				coverSrc={playlistCover}
				coverAlt={playlistTitle}
				primaryAction={
					<Button
						onClick={handlePlayAll}
						disabled={playableTracks.length === 0}
						className="h-12 md:h-10 w-full md:w-auto px-6 gap-2"
					>
						<Play className="size-4" aria-hidden />
						PLAY
					</Button>
				}
				secondaryActions={
					<Button
						onClick={handleShuffleAll}
						disabled={playableTracks.length === 0}
						variant="ghost"
						size="icon-touch"
						aria-label="Shuffle playlist"
					>
						<Shuffle className="size-4" aria-hidden />
					</Button>
				}
			/>

			{/* Tracklist */}
			<div>
				<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
					<div className="flex items-baseline gap-3">
						<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
							TRACKLIST
						</h2>
						<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
							{tracks.length} TRACK{tracks.length !== 1 ? "S" : ""}
						</span>
					</div>
				</div>
				{tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<p className="text-sm font-bold uppercase text-muted-foreground">No tracks</p>
						<p className="text-xs font-bold uppercase text-muted-foreground">The tracklist for this playlist is unavailable.</p>
					</div>
				) : (
				<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
					{/* Column header */}
					<div className="hidden sm:grid grid-cols-[28px_40px_1fr_auto_60px_64px] gap-3 items-center px-3 py-2 border-b-[2px] border-foreground font-mono text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
						<span className="text-right">#</span>
						<span />
						<span>TITLE / ARTIST</span>
						<span>FORMAT</span>
						<span className="text-right">TIME</span>
						<span />
					</div>
					{(() => {
						const normalizedTracks = tracks.map((t: any) => trackFromDeezerRaw(t));
						return tracks.map((track: any, idx: number) => {
							const normalized = normalizedTracks[idx];
							const trackId = normalized.trackId;
							return (
								<TrackRow
									key={trackId || idx}
									track={normalized}
									trackNumber={idx + 1}
									queue={normalizedTracks}
								/>
							);
						});
					})()}
				</div>
				)}
			</div>
		</div>
	);
}

export default function PlaylistPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<PlaylistContent />
		</Suspense>
	);
}
