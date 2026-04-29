"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowDownUp } from "lucide-react";
import Link from "next/link";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";
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

	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "";
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

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

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3 min-w-0">
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					onClick={() => router.back()}
				>
					<ArrowLeft className="size-4" />
				</Button>
				<div className="flex-1 min-w-0">
					<h1 className="text-brutal-lg">{playlist.title}</h1>
					{playlist.description && (
						<p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>
					)}
					<p className="text-xs text-muted-foreground mt-0.5 font-mono font-bold">
						{playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{playlist.tracks.length > 1 && (
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5"
							onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
						>
							<ArrowDownUp className="size-3.5" />
							{sortOrder === "asc" ? "Oldest first" : "Newest first"}
						</Button>
					)}
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
				<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
					{(() => {
						const normalized: TrackRowTrack[] = sortedTracks.map((track) => ({
							trackId: track.trackId,
							title: track.title,
							artist: track.artist,
							album: track.album,
							cover: track.coverUrl,
							duration: track.duration,
							bitrateLabel: null,
						}));
						return sortedTracks.map((track, idx) => (
							<TrackRow
								key={track.id}
								track={normalized[idx]}
								trackNumber={idx + 1}
								showBitrate={false}
								showDuration
								onDelete={() => handleRemoveTrack(track.trackId)}
								queue={normalized}
							/>
						));
					})()}
				</div>
			)}
		</div>
	);
}
