"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CoverImage } from "@/components/ui/cover-image";
import { Heart, Loader2 } from "lucide-react";
import { useSavedAlbums } from "@/hooks/useLibrary";
import { TrackRow, trackFromDeezerRaw } from "@/components/tracks/TrackRow";

function getCoverUrl(picture: string, size = 500) {
	if (!picture) return "/placeholder.jpg";
	if (picture.startsWith("http")) return picture;
	return `https://e-cdns-images.dzcdn.net/images/cover/${picture}/${size}x${size}-000000-80-0-0.jpg`;
}

function AlbumSaveButton({
	saved,
	saving,
	onClick,
}: {
	saved: boolean;
	saving: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			onClick={onClick}
			disabled={saving}
			variant={saved ? "outline" : "default"}
			className="w-fit mt-1 gap-2"
		>
			{saving ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				<Heart className={`size-4 ${saved ? "fill-primary text-primary" : ""}`} />
			)}
			{saved ? "Saved" : "Save album"}
		</Button>
	);
}

function AlbumContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [album, setAlbum] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const { isSaved, save, unsave } = useSavedAlbums(id ? [id] : []);
	const albumSaved = id ? isSaved(id) : false;

	useEffect(() => {
		if (!id) return;
		async function loadAlbum() {
			try {
				const data = await fetchData("content/tracklist", { id, type: "album" });
				const albumData = data?.DATA || data;
				const trackList = data?.tracks || data?.SONGS?.data || [];
				setAlbum(albumData);
				setTracks(trackList);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadAlbum();
	}, [id]);

	const handleToggleSave = async () => {
		if (!id || !album) return;
		setSaving(true);
		try {
			if (albumSaved) {
				// We need the internal Album.id to unsave; fetch the saved albums
				const res = await fetch("/api/v1/library/albums", { credentials: "include" });
				const json = await res.json();
				const items = (json?.data?.items as any[]) || [];
				const match = items.find((a) => String(a.deezerAlbumId) === String(id));
				if (match) {
					await unsave(String(match.id), String(id));
				}
			} else {
				const albumTitle = album.ALB_TITLE || album.title || "";
				const artistName = album.ART_NAME || album.artist?.name || "";
				const albumCover = album.cover_xl || album.cover_big || getCoverUrl(album.ALB_PICTURE, 500);
				await save({
					deezerAlbumId: String(id),
					title: albumTitle,
					artist: artistName,
					coverUrl: albumCover,
					tracks: tracks.map((t: any, idx: number) => ({
						trackId: String(t.SNG_ID || t.id),
						title: t.SNG_TITLE || t.title || "",
						artist: t.ART_NAME || t.artist?.name || "",
						coverUrl:
							t.album?.cover_small ||
							(t.ALB_PICTURE
								? `https://e-cdns-images.dzcdn.net/images/cover/${t.ALB_PICTURE}/56x56-000000-80-0-0.jpg`
								: null),
						duration: t.DURATION ? Number(t.DURATION) : t.duration ?? null,
						trackNumber: Number(t.TRACK_NUMBER || t.track_position || idx + 1),
					})),
				});
			}
		} catch (e) {
			console.error("[album save] failed:", e);
		}
		setSaving(false);
	};

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	if (!album)
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-bold uppercase text-muted-foreground">Album not found</p>
				<p className="text-xs font-bold uppercase text-muted-foreground">The album you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
			</div>
		);

	// Handle both GW format (ALB_PICTURE, ALB_TITLE) and standard API format (cover_xl, title)
	const title = album.ALB_TITLE || album.title || "";
	const artistName = album.ART_NAME || album.artist?.name || "";
	const cover = album.cover_xl || album.cover_big || getCoverUrl(album.ALB_PICTURE, 500);
	const nbTracks = album.NUMBER_TRACK || album.nb_tracks;
	const releaseDate = album.PHYSICAL_RELEASE_DATE || album.DIGITAL_RELEASE_DATE || album.release_date;
	const recordType = album.TYPE === "0" ? "Single" : album.TYPE === "1" ? "Album" : album.TYPE === "2" ? "Compilation" : album.record_type || "Album";

	return (
		<div className="space-y-8">
			{/* Album Header */}
			<div className="flex flex-col md:flex-row gap-8">
				<CoverImage
					src={cover}
					alt={title}
					className="w-32 h-32 sm:w-48 sm:h-48 border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] flex-shrink-0"
				/>
				<div className="flex flex-col justify-end gap-3">
					<Badge variant="secondary" className="w-fit">
						{recordType}
					</Badge>
					<h1 className="text-brutal-lg">
						{title}
					</h1>
					<div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
						<span>{artistName}</span>
						{nbTracks && (
							<>
								<span className="text-border">·</span>
								<span>{nbTracks} tracks</span>
							</>
						)}
						{releaseDate && (
							<>
								<span className="text-border">·</span>
								<span>{releaseDate}</span>
							</>
						)}
					</div>
					<AlbumSaveButton
						saved={albumSaved}
						saving={saving}
						onClick={handleToggleSave}
					/>
				</div>
			</div>

			<Separator />

			{/* Tracklist */}
			<div>
				<h2 className="text-xs font-black text-foreground uppercase tracking-[0.15em] mb-4">
					Tracklist
				</h2>
				{tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<p className="text-sm font-bold uppercase text-muted-foreground">No tracks</p>
						<p className="text-xs font-bold uppercase text-muted-foreground">The tracklist for this album is unavailable.</p>
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
					{tracks.map((track: any, idx: number) => {
						const normalized = trackFromDeezerRaw(track);
						const trackNum = track.TRACK_NUMBER || track.track_position || idx + 1;
						const trackId = normalized.trackId;
						return (
							<TrackRow
								key={trackId || idx}
								track={normalized}
								trackNumber={Number(trackNum)}
							/>
						);
					})}
				</div>
				)}
			</div>
		</div>
	);
}

export default function AlbumPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<AlbumContent />
		</Suspense>
	);
}
