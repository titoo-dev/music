"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchData } from "@/utils/api";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Check, Shuffle, ChevronDown } from "lucide-react";
import { useDownloadedAlbums } from "@/hooks/useDownloadedAlbums";
import { CoverImage } from "@/components/ui/cover-image";
import { EntityHero, HeroPlayButton } from "@/components/layout/EntityHero";
import { EmptyState, HeartGlyph, Spinner } from "@/components/motion/icons";
import { cn } from "@/lib/utils";
import { TrackRow, trackFromDeezerRaw } from "@/components/tracks/TrackRow";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";

// Deezer GW's deezer.pageArtist response is loosely typed and field names
// vary between regions and artist types. Probe the spots a bio is most
// likely to live; bail out and render nothing if none of them match.
function extractArtistBio(artist: any): string | null {
	if (!artist) return null;
	const candidates: unknown[] = [
		artist.BIO?.BIO,
		artist.BIO,
		artist.bio,
		artist.SUMMARY,
		artist.summary,
		artist.description,
		artist.DESCRIPTION,
	];
	for (const c of candidates) {
		if (typeof c === "string" && c.trim().length > 0) {
			return c.trim();
		}
	}
	return null;
}

function ArtistBio({ bio }: { bio: string }) {
	const [expanded, setExpanded] = useState(false);
	const isLong = bio.length > 320;
	const visible = expanded || !isLong ? bio : `${bio.slice(0, 320).trimEnd()}…`;

	return (
		<section>
			<SectionHeader title="About" />
			<div className="rounded-xl border border-border bg-card p-5">
				<p className="max-w-prose text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
					{visible}
				</p>
				{isLong && (
					<button
						type="button"
						onClick={() => setExpanded((v) => !v)}
						aria-expanded={expanded}
						className="mt-2 inline-flex items-center gap-1 min-h-11 md:min-h-8 rounded-md px-2 -ml-2 text-sm font-medium text-foreground [@media(hover:hover)]:hover:bg-accent transition-colors"
					>
						<ChevronDown
							className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
							aria-hidden
						/>
						{expanded ? "Show less" : "Show more"}
					</button>
				)}
			</div>
		</section>
	);
}

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

function SectionHeader({ title, count }: { title: string; count?: number }) {
	return (
		<div className="mb-3 flex items-baseline gap-2">
			<h2 className="text-sm font-medium m-0">{title}</h2>
			{count != null && (
				<span className="text-xs text-muted-foreground tabular-nums">{count}</span>
			)}
		</div>
	);
}

/** Segmented pill control with a motion-animated active indicator. */
function Segmented<T extends string>({
	id,
	value,
	options,
	onChange,
}: {
	id: string;
	value: T;
	options: { value: T; label: React.ReactNode }[];
	onChange: (v: T) => void;
}) {
	return (
		<div
			role="tablist"
			className="inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-lg border border-border bg-muted/50 p-0.5"
		>
			{options.map((opt) => {
				const active = opt.value === value;
				return (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange(opt.value)}
						className={cn(
							"relative h-7 shrink-0 rounded-md px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
							active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
						)}
					>
						{active && (
							<motion.span
								layoutId={`${id}-indicator`}
								className="absolute inset-0 rounded-md bg-background shadow-sm"
								transition={{ type: "spring", stiffness: 500, damping: 38 }}
							/>
						)}
						<span className="relative">{opt.label}</span>
					</button>
				);
			})}
		</div>
	);
}

function DiscographyTabs({
	tabKeys,
	tabLabels,
	discography,
	albumMap,
}: {
	tabKeys: string[];
	tabLabels: Record<string, string>;
	discography: Record<string, any[]>;
	albumMap: Map<string, string>;
}) {
	const [selected, setSelected] = useState(tabKeys[0]);
	const active = tabKeys.includes(selected) ? selected : tabKeys[0];

	return (
		<div>
			<Segmented
				id="artist-discography"
				value={active}
				onChange={setSelected}
				options={tabKeys.map((key) => ({
					value: key,
					label: (
						<>
							{tabLabels[key] || key}
							<span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
								{discography[key].length}
							</span>
						</>
					),
				}))}
			/>
			<motion.div
				key={active}
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25, ease: "easeOut" }}
				className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6"
			>
				{discography[active].map((album) => {
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
						<div key={albumId} className="group min-w-0">
							<div className="relative overflow-hidden rounded-lg bg-muted ring-1 ring-border">
								<Link href={albumHref}>
									<CoverImage
										src={albumCover}
										alt={albumTitle}
										loading="lazy"
										className="w-full aspect-square rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
									/>
								</Link>
								{myAlbumId && (
									<span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
										<Check className="size-3" aria-hidden />
										Saved
									</span>
								)}
							</div>
							<div className="mt-2">
								<Link
									href={albumHref}
									className="block truncate text-sm font-medium text-foreground hover:underline underline-offset-4"
								>
									{albumTitle}
								</Link>
								<p className="truncate text-xs text-muted-foreground tabular-nums">
									{album.release_date || album.PHYSICAL_RELEASE_DATE}
									{album.nb_tracks ? ` · ${album.nb_tracks} tracks` : ""}
								</p>
							</div>
						</div>
					);
				})}
			</motion.div>
		</div>
	);
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
	// Must stay above the early returns below — calling these hooks after a
	// conditional `return` makes the hook count vary between renders and crashes
	// React (#310 "Rendered fewer hooks than expected"). See rules-of-hooks.
	const playerPlay = usePlayerStore((s) => s.play);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

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
			<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
				<Spinner size={20} />
			</div>
		);
	if (!artist)
		return (
			<EmptyState
				className="mt-8"
				title="Artist not found"
				description="The artist you're looking for doesn't exist or is unavailable."
			/>
		);

	const artistPicture =
		artist.picture_xl ||
		artist.picture_big ||
		artist.picture_medium ||
		getArtistUrl(artist.ART_PICTURE, 500);

	const artistName = artist.name || artist.ART_NAME;
	const nbFan = artist.nb_fan || artist.NB_FAN;

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
	const artistBio = extractArtistBio(artist);

	return (
		<div className="space-y-12">
			<EntityHero
				eyebrow="Artist"
				title={artistName}
				coverSrc={artistPicture}
				coverAlt={artistName}
				coverShape="circle"
				meta={nbFan != null ? `${Number(nbFan).toLocaleString()} fans on Deezer` : null}
				primaryAction={
					playableTopTracks.length > 0 ? (
						<HeroPlayButton
							onPlay={handlePlayTop}
							trackIds={playableTopTracks.map((t) => t.trackId)}
							label="Play top tracks"
						/>
					) : undefined
				}
				secondaryActions={
					<>
						{isAuthenticated && (
							<Button
								onClick={handleToggleFollow}
								disabled={followBusy}
								variant="outline"
								size="icon-touch"
								className="rounded-full"
								aria-label={isFollowed ? "Unfollow artist" : "Follow artist"}
								aria-pressed={isFollowed}
							>
								{followBusy ? <Spinner /> : <HeartGlyph filled={isFollowed} />}
							</Button>
						)}
						{playableTopTracks.length > 0 && (
							<Button
								onClick={handleShuffleTop}
								variant="outline"
								size="icon-touch"
								className="rounded-full"
								aria-label="Shuffle top tracks"
							>
								<Shuffle className="size-4" aria-hidden />
							</Button>
						)}
					</>
				}
			/>

			{/* Bio — defensive: shown only if Deezer returned one for this artist */}
			{artistBio && <ArtistBio bio={artistBio} />}

			{/* Top Tracks */}
			{topTracks.length > 0 && (
				<section>
					<SectionHeader title="Top tracks" count={Math.min(10, topTracks.length)} />
					<div className="divide-y divide-border border-y border-border">
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
					<SectionHeader
						title="Discography"
						count={tabKeys.reduce((sum, k) => sum + (discography[k]?.length || 0), 0)}
					/>
					<DiscographyTabs
						key={id ?? ""}
						tabKeys={tabKeys}
						tabLabels={tabLabels}
						discography={discography}
						albumMap={albumMap}
					/>
				</section>
			)}

			{/* Fallback if nothing */}
			{topTracks.length === 0 && tabKeys.length === 0 && (
				<EmptyState
					title="No content"
					description="No tracks or discography found for this artist."
				/>
			)}
		</div>
	);
}

export default function ArtistPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
					<Spinner size={20} />
				</div>
			}
		>
			<ArtistContent />
		</Suspense>
	);
}
