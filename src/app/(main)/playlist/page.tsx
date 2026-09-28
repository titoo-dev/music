"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { EntityHero, HeroPlayButton } from "@/components/layout/EntityHero";
import { EmptyState, Spinner } from "@/components/motion/icons";
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
			<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
				<Spinner size={20} />
			</div>
		);
	if (!playlist)
		return (
			<EmptyState
				className="mt-8"
				title="Playlist not found"
				description="The playlist you're looking for doesn't exist or is unavailable."
			/>
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
				eyebrow="Playlist"
				title={playlistTitle}
				subtitle={
					creatorName ? (
						<span>
							By <span className="font-medium text-foreground">{creatorName}</span>
						</span>
					) : undefined
				}
				meta={`${playlist.nb_tracks || tracks.length} tracks`}
				coverSrc={playlistCover}
				coverAlt={playlistTitle}
				primaryAction={
					<HeroPlayButton
						onPlay={handlePlayAll}
						trackIds={playableTracks.map((t) => t.trackId)}
						disabled={playableTracks.length === 0}
						label="Play playlist"
					/>
				}
				secondaryActions={
					<Button
						onClick={handleShuffleAll}
						disabled={playableTracks.length === 0}
						variant="outline"
						size="icon-touch"
						className="rounded-full"
						aria-label="Shuffle playlist"
					>
						<Shuffle className="size-4" aria-hidden />
					</Button>
				}
			/>

			{/* Tracklist */}
			<section>
				<div className="mb-3 flex items-baseline gap-2">
					<h2 className="text-sm font-medium m-0">Tracklist</h2>
					<span className="text-xs text-muted-foreground tabular-nums">{tracks.length}</span>
				</div>
				{tracks.length === 0 ? (
					<EmptyState
						title="No tracks"
						description="The tracklist for this playlist is unavailable."
					/>
				) : (
				<div className="divide-y divide-border border-y border-border">
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
			</section>
		</div>
	);
}

export default function PlaylistPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
					<Spinner size={20} />
				</div>
			}
		>
			<PlaylistContent />
		</Suspense>
	);
}
