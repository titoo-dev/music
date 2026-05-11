"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Play, Shuffle, Heart } from "lucide-react";
import { useDownloadedAlbums } from "@/hooks/useDownloadedAlbums";
import { CoverImage } from "@/components/ui/cover-image";
import { EntityHero } from "@/components/layout/EntityHero";
import { TrackRow, trackFromDeezerRaw } from "@/components/tracks/TrackRow";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";

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

function ArtistContent() {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [artist, setArtist] = useState<any>(null);
	const [topTracks, setTopTracks] = useState<any[]>([]);
	const [discography, setDiscography] = useState<any>({});
	const [loading, setLoading] = useState(true);
	const [isFollowed, setIsFollowed] = useState(false);
	const [followBusy, setFollowBusy] = useState(false);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const { albumMap } = useDownloadedAlbums();

	useEffect(() => {
		if (!id) return;
		async function loadArtist() {
			try {
				const data = await fetchData("content/tracklist", { id, type: "artist" });
				setArtist(data?.DATA || data);
				setTopTracks(data?.topTracks || []);
				setDiscography(data?.discography || {});
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadArtist();
	}, [id]);

	// Resolve follow status once per (auth, artist) — uses the full list as the
	// single source of truth. Cheap enough on the typical "few hundred followed
	// artists" scale; a batched status endpoint can replace this if the list
	// grows past that.
	useEffect(() => {
		if (!isAuthenticated || !id) {
			setIsFollowed(false);
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/v1/library/artists", { credentials: "include" });
				if (!res.ok) return;
				const json = await res.json();
				if (cancelled || !json.success) return;
				const items = (json.data?.items as Array<{ deezerArtistId: string }>) || [];
				setIsFollowed(items.some((a) => a.deezerArtistId === id));
			} catch {
				// ignore — UI defaults to "not followed"
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id, isAuthenticated]);

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	if (!artist)
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
				<p className="text-sm font-bold uppercase text-muted-foreground">Artist not found</p>
				<p className="text-xs font-bold uppercase text-muted-foreground">The artist you&apos;re looking for doesn&apos;t exist or is unavailable.</p>
			</div>
		);

	const artistPicture =
		artist.picture_xl ||
		artist.picture_big ||
		artist.picture_medium ||
		getArtistUrl(artist.ART_PICTURE, 500);

	const artistName = artist.name || artist.ART_NAME;
	const nbFan = artist.nb_fan || artist.NB_FAN;
	const playerPlay = usePlayerStore((s) => s.play);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

	const playableTopTracks: PlayerTrack[] = topTracks.slice(0, 10).map((t: any) => {
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

	const handlePlayTop = () => {
		if (playableTopTracks.length === 0) return;
		playerPlay(playableTopTracks[0], playableTopTracks);
	};

	const handleShuffleTop = () => {
		if (playableTopTracks.length === 0) return;
		const wasShuffled = usePlayerStore.getState().shuffle;
		if (!wasShuffled) toggleShuffle();
		playerPlay(playableTopTracks[0], playableTopTracks);
	};

	const handleToggleFollow = async () => {
		if (!id || !isAuthenticated || followBusy) return;
		const wasFollowed = isFollowed;
		setIsFollowed(!wasFollowed);
		setFollowBusy(true);
		try {
			if (wasFollowed) {
				const res = await fetch(`/api/v1/library/artists/${encodeURIComponent(id)}`, {
					method: "DELETE",
					credentials: "include",
				});
				if (!res.ok) throw new Error("unfollow failed");
			} else {
				const res = await fetch("/api/v1/library/artists", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						deezerArtistId: id,
						name: artistName,
						pictureUrl: artistPicture,
					}),
				});
				if (!res.ok) throw new Error("follow failed");
			}
		} catch {
			setIsFollowed(wasFollowed);
		}
		setFollowBusy(false);
	};

	// Filter discography tabs that have content, preferred order
	const tabOrder = ["all", "album", "single", "ep", "featured", "more"];
	const tabLabels: Record<string, string> = {
		all: "All",
		album: "Albums",
		single: "Singles",
		ep: "EPs",
		featured: "Featured",
		more: "More",
	};
	const tabKeys = tabOrder.filter((k) => discography[k]?.length > 0);

	return (
		<div className="space-y-10">
			<EntityHero
				eyebrow={`ARTIST${nbFan != null ? ` · ${Number(nbFan).toLocaleString()} FANS` : ""}`}
				title={artistName}
				coverSrc={artistPicture}
				coverAlt={artistName}
				meta={nbFan != null ? `${Number(nbFan).toLocaleString()} FANS · DEEZER` : null}
				primaryAction={
					playableTopTracks.length > 0 ? (
						<Button
							onClick={handlePlayTop}
							className="h-12 md:h-10 w-full md:w-auto px-6 gap-2"
						>
							<Play className="size-4" aria-hidden />
							PLAY TOP TRACKS
						</Button>
					) : undefined
				}
				secondaryActions={
					<>
						{isAuthenticated && (
							<Button
								onClick={handleToggleFollow}
								disabled={followBusy}
								variant={isFollowed ? "outline" : "secondary"}
								size="icon-touch"
								aria-label={isFollowed ? "Unfollow artist" : "Follow artist"}
								aria-pressed={isFollowed}
							>
								{followBusy ? (
									<Loader2 className="size-4 animate-spin" aria-hidden />
								) : (
									<Heart
										className={`size-4 ${isFollowed ? "fill-primary text-primary" : ""}`}
										aria-hidden
									/>
								)}
							</Button>
						)}
						{playableTopTracks.length > 0 && (
							<Button
								onClick={handleShuffleTop}
								variant="ghost"
								size="icon-touch"
								aria-label="Shuffle top tracks"
							>
								<Shuffle className="size-4" aria-hidden />
							</Button>
						)}
					</>
				}
			/>

			{/* Top Tracks */}
			{topTracks.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								TOP TRACKS
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{Math.min(10, topTracks.length)} RESULTS
							</span>
						</div>
					</div>
					<div className="border-2 sm:border-[3px] border-foreground bg-card overflow-hidden">
						{/* Column header */}
						<div className="hidden sm:grid grid-cols-[28px_40px_1fr_auto_60px_64px] gap-3 items-center px-3 py-2 border-b-[2px] border-foreground font-mono text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
							<span className="text-right">#</span>
							<span />
							<span>TITLE / ALBUM</span>
							<span>FORMAT</span>
							<span className="text-right">TIME</span>
							<span />
						</div>
						{(() => {
							const top = topTracks.slice(0, 10);
							const normalizedTop = top.map((t: any) => trackFromDeezerRaw(t));
							return top.map((track: any, idx: number) => {
								const normalized = normalizedTop[idx];
								const trackId = normalized.trackId;
								return (
									<TrackRow
										key={trackId || idx}
										track={normalized}
										trackNumber={idx + 1}
										queue={normalizedTop}
									/>
								);
							});
						})()}
					</div>
				</section>
			)}

			{/* Discography Tabs */}
			{tabKeys.length > 0 && (
				<section>
					<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">
						<div className="flex items-baseline gap-3">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">
								DISCOGRAPHY
							</h2>
							<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{tabKeys.reduce((sum, k) => sum + (discography[k]?.length || 0), 0)} TOTAL
							</span>
						</div>
					</div>
					<Tabs defaultValue={tabKeys[0]}>
						<TabsList>
							{tabKeys.map((key) => (
								<TabsTrigger key={key} value={key}>
									{tabLabels[key] || key} ({discography[key].length})
								</TabsTrigger>
							))}
						</TabsList>

						{tabKeys.map((key) => (
							<TabsContent key={key} value={key} className="mt-6">
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
									{discography[key].map((album: any) => {
										const albumId = album.id || album.ALB_ID;
										const albumTitle = album.title || album.ALB_TITLE;
										const albumCover =
											album.cover_medium ||
											album.cover_big ||
											getCoverUrl(album.ALB_PICTURE || album.md5_image, 250) ||
											"/placeholder.jpg";
										const myAlbumId = albumMap.get(String(albumId));
										const albumHref = `/album?id=${albumId}`;

										return (
											<div key={albumId} className="group space-y-2">
												<div className="relative overflow-hidden border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] [@media(hover:hover)]:hover:shadow-[var(--shadow-brutal-hover)] [@media(hover:hover)]:hover:-translate-x-[1px] [@media(hover:hover)]:hover:-translate-y-[1px] transition-all bg-card">
													<Link href={albumHref}>
														<CoverImage
															src={albumCover}
															alt={albumTitle}
															loading="lazy"
															className="w-full aspect-square border-0"
														/>
													</Link>
													{myAlbumId && (
														<span className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-accent text-foreground text-[10px] font-bold uppercase px-1.5 py-0.5 border-2 border-foreground">
															<CheckCircle2 className="size-3" />
															Saved
														</span>
													)}
												</div>
												<div>
													<Link
														href={albumHref}
														className="text-sm font-medium truncate block text-foreground hover:underline"
													>
														{albumTitle}
													</Link>
													<p className="text-xs text-muted-foreground font-mono">
														{album.release_date || album.PHYSICAL_RELEASE_DATE}
														{album.nb_tracks ? ` · ${album.nb_tracks} tracks` : ""}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</TabsContent>
						))}
					</Tabs>
				</section>
			)}

			{/* Fallback if nothing */}
			{topTracks.length === 0 && tabKeys.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-bold uppercase text-muted-foreground">No content</p>
					<p className="text-xs font-bold uppercase text-muted-foreground">No tracks or discography found for this artist.</p>
				</div>
			)}
		</div>
	);
}

export default function ArtistPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh]">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ArtistContent />
		</Suspense>
	);
}
