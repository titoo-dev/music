"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Reorder, useDragControls } from "motion/react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowDownUp, Play, Shuffle, GripVertical } from "lucide-react";
import Link from "next/link";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { EntityHero } from "@/components/layout/EntityHero";
import { preloadTrack } from "@/components/audio/AudioEngine";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePrefetch } from "@/hooks/usePrefetch";

interface PlaylistTrack {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	coverUrl: string | null;
	duration: number | null;
	position: number;
}

interface PlaylistDetail {
	id: string;
	title: string;
	description: string | null;
	tracks: PlaylistTrack[];
}

export default function PlaylistDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const { prefs, updatePrefs } = useUserPreferences();
	const sortOrder = prefs.playlistSortOrder ?? "asc";
	const setSortOrder = (order: "asc" | "desc") => updatePrefs({ playlistSortOrder: order });
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const stopPlayer = usePlayerStore((s) => s.stop);
	const playerPlay = usePlayerStore((s) => s.play);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

	// Background prefetch: warm IndexedDB for the first tracks so playback starts instantly
	const allTrackIds = playlist?.tracks.map((t) => t.trackId) || [];
	usePrefetch(allTrackIds);

	useEffect(() => {
		if (!isAuthenticated || !params.id) {
			setLoading(false);
			return;
		}
		async function load() {
			try {
				const res = await fetch(`/api/v1/playlists/${params.id}`);
				const json = await res.json();
				if (json.success) setPlaylist(json.data);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		load();
	}, [params.id, isAuthenticated]);

	// Preload first tracks so playback starts instantly
	useEffect(() => {
		if (!playlist || playlist.tracks.length === 0) return;
		for (const track of playlist.tracks.slice(0, 3)) {
			preloadTrack(track.trackId);
		}
	}, [playlist]);

	const handleRemoveTrack = async (trackId: string) => {
		if (!playlist) return;
		// Stop player if it's playing the track being removed
		if (currentPlayerTrack?.trackId === trackId) {
			stopPlayer();
		}
		try {
			await fetch(`/api/v1/playlists/${playlist.id}/tracks`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ trackIds: [trackId] }),
			});
			setPlaylist((prev) =>
				prev
					? { ...prev, tracks: prev.tracks.filter((t) => t.trackId !== trackId) }
					: null
			);
		} catch {
			// ignore
		}
	};

	// Drag-reorder persistence: optimistic local update on every onReorder
	// (fires continuously during drag), but POST the final order to the API
	// debounced so we don't spam the endpoint mid-drag.
	const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const playlistIdRef = useRef<string | null>(null);
	playlistIdRef.current = playlist?.id ?? null;

	useEffect(() => () => {
		if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
	}, []);

	const handleReorder = useCallback(
		(newOrderIds: string[]) => {
			// Optimistic local update — also rewrites .position so re-renders
			// in any sort order stay consistent until the API confirms.
			setPlaylist((prev) => {
				if (!prev) return prev;
				const byId = new Map(prev.tracks.map((t) => [t.trackId, t]));
				const next = newOrderIds
					.map((trackId, position) => {
						const t = byId.get(trackId);
						return t ? { ...t, position } : null;
					})
					.filter((t): t is PlaylistTrack => t !== null);
				return { ...prev, tracks: next };
			});

			// Debounce the API call until the drag settles (~250ms idle).
			if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
			reorderTimerRef.current = setTimeout(() => {
				const pid = playlistIdRef.current;
				if (!pid) return;
				void fetch(`/api/v1/playlists/${pid}/tracks`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ trackIds: newOrderIds }),
				}).catch(() => {
					// Persist failed — leave the optimistic state in place. A future
					// fetch on mount will re-sync from the server.
				});
			}, 250);
		},
		[]
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const sortedTracks = playlist
		? [...playlist.tracks].sort((a, b) =>
				sortOrder === "asc" ? a.position - b.position : b.position - a.position
			)
		: [];

	if (!playlist) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground font-bold">Playlist not found.</p>
				<Link href="/my-playlists">
					<Button variant="outline">Back to playlists</Button>
				</Link>
			</div>
		);
	}

	const playablePlaylistTracks: PlayerTrack[] = sortedTracks.map((t) => ({
		trackId: t.trackId,
		title: t.title,
		artist: t.artist,
		artistId: null,
		cover: t.coverUrl,
		duration: t.duration,
	}));

	const handlePlayAll = () => {
		if (playablePlaylistTracks.length === 0) return;
		playerPlay(playablePlaylistTracks[0], playablePlaylistTracks);
	};

	const handleShuffleAll = () => {
		if (playablePlaylistTracks.length === 0) return;
		const wasShuffled = usePlayerStore.getState().shuffle;
		if (!wasShuffled) toggleShuffle();
		playerPlay(playablePlaylistTracks[0], playablePlaylistTracks);
	};

	const normalized: TrackRowTrack[] = sortedTracks.map((track) => ({
		trackId: track.trackId,
		title: track.title,
		artist: track.artist,
		album: track.album,
		cover: track.coverUrl,
		duration: track.duration,
		bitrateLabel: null,
	}));

	// Drag-reorder is only correct when the display order matches the stored
	// position order (i.e. ascending). In "newest first" mode, dragging would
	// invert positions on save — disable until the user flips back to "asc".
	const reorderEnabled = sortOrder === "asc" && sortedTracks.length > 1;

	return (
		<div className="space-y-6">
			<div className="flex items-start gap-3 min-w-0">
				<Button
					variant="ghost"
					size="icon-touch"
					className="shrink-0"
					aria-label="Back"
					onClick={() => router.back()}
				>
					<ArrowLeft className="size-4" aria-hidden />
				</Button>
				<div className="flex-1 min-w-0">
					<EntityHero
						eyebrow="MY PLAYLIST"
						title={playlist.title}
						subtitle={
							playlist.description ? (
								<span className="text-sm text-muted-foreground">{playlist.description}</span>
							) : undefined
						}
						meta={`${playlist.tracks.length} TRACK${playlist.tracks.length !== 1 ? "S" : ""}`}
						primaryAction={
							playlist.tracks.length > 0 ? (
								<Button
									onClick={handlePlayAll}
									className="h-12 md:h-10 w-full md:w-auto px-6 gap-2"
								>
									<Play className="size-4" aria-hidden />
									PLAY
								</Button>
							) : undefined
						}
						secondaryActions={
							playlist.tracks.length > 0 ? (
								<>
									<Button
										onClick={handleShuffleAll}
										variant="ghost"
										size="icon-touch"
										aria-label="Shuffle playlist"
									>
										<Shuffle className="size-4" aria-hidden />
									</Button>
									{playlist.tracks.length > 1 && (
										<Button
											variant="outline"
											size="sm"
											className="gap-1.5 min-h-11 md:min-h-9"
											onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
											aria-label="Toggle sort order"
										>
											<ArrowDownUp className="size-3.5" aria-hidden />
											{sortOrder === "asc" ? "Oldest" : "Newest"}
										</Button>
									)}
								</>
							) : undefined
						}
					/>
				</div>
			</div>

			{playlist.tracks.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm text-muted-foreground font-bold uppercase">This playlist is empty.</p>
					<p className="text-xs text-muted-foreground font-bold uppercase">
						Add tracks from search results or album pages.
					</p>
				</div>
			) : (
				<Reorder.Group
					as="div"
					axis="y"
					values={sortedTracks.map((t) => t.trackId)}
					onReorder={handleReorder}
					className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden"
				>
					{sortedTracks.map((track, idx) => (
						<DraggableRow
							key={track.id}
							trackId={track.trackId}
							idx={idx}
							normalized={normalized[idx]}
							queue={normalized}
							onDelete={() => handleRemoveTrack(track.trackId)}
							canDrag={reorderEnabled}
						/>
					))}
				</Reorder.Group>
			)}
		</div>
	);
}

/** One reorderable row. Each instance owns a `useDragControls` so the drag
 *  surface stays scoped to the grip handle — touching the cover, title, or
 *  three-dot menu never starts a drag and never collides with long-press →
 *  TrackActionSheet on the underlying TrackRow. */
function DraggableRow({
	trackId,
	idx,
	normalized,
	queue,
	onDelete,
	canDrag,
}: {
	trackId: string;
	idx: number;
	normalized: TrackRowTrack;
	queue: TrackRowTrack[];
	onDelete: () => void;
	canDrag: boolean;
}) {
	const dragControls = useDragControls();

	return (
		<Reorder.Item
			as="div"
			value={trackId}
			dragListener={false}
			dragControls={dragControls}
			className="flex items-stretch border-b border-foreground/15 last:border-b-0 bg-card data-[dragging=true]:shadow-[var(--shadow-brutal-hover)] data-[dragging=true]:bg-accent/10"
		>
			{canDrag && (
				<button
					type="button"
					aria-label={`Drag to reorder track ${idx + 1}`}
					onPointerDown={(e) => {
						e.preventDefault();
						dragControls.start(e);
					}}
					className="shrink-0 flex items-center justify-center w-10 md:w-8 cursor-grab active:cursor-grabbing touch-none text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
				>
					<GripVertical className="size-4" aria-hidden />
				</button>
			)}
			<div className="flex-1 min-w-0">
				<TrackRow
					track={normalized}
					trackNumber={idx + 1}
					showBitrate={false}
					showDuration
					onDelete={onDelete}
					queue={queue}
				/>
			</div>
		</Reorder.Item>
	);
}
