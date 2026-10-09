"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ChevronDown, Disc3, Quote, TrendingUp, UserCheck, UserPlus, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrackRow, trackFromDeezerRaw, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { MediaCard } from "@/components/cards/MediaCard";
import { useTracklist } from "@/components/collection/useTracklist";
import { LoadFailed } from "@/components/collection/LoadFailed";
import { ArtistDetailSkeleton } from "@/components/skeletons";
import { useCollectionPlayback } from "@/components/collection/CollectionActions";
import { CardCarousel, CollectionScaffold, DUR, EASE, FilterPills, Medallion, SPRING, SavedBadge, SectionTitle, TonalIconButton, swap } from "@/components/expressive";
import { useSavedAlbums } from "@/hooks/useLibrary";
import { useAuthStore } from "@/stores/useAuthStore";
import { compactNumber, parseArtistPage, plural, type ArtistPageData } from "@/lib/collection-page";
import { pickArtistId, primaryArtistName } from "@/lib/entity-links";
import { fetchData } from "@/utils/api";

const TOP = 10;
const TOP_MORE = 25;

const rowReveal = {
	initial: { opacity: 0.2, y: 12 },
	whileInView: { opacity: 1, y: 0 },
	viewport: { once: true, margin: "0px 0px -24px 0px" },
	transition: { duration: 0.36, ease: [0.05, 0.7, 0.1, 1] },
} as const;

/**
 * `/artist?name=…` (library rows only keep the artist name): find the Deezer
 * artist through search and swap the URL for its `?id=`. Stays "loading" until
 * the replace lands, "missing" when search has no such artist, "error" when
 * the search failed (offer `retry`).
 */
function useArtistFromName(name: string | null) {
	const router = useRouter();
	const [attempt, setAttempt] = useState(0);
	const [outcome, setOutcome] = useState<{ key: string; status: "missing" | "error" } | null>(null);
	const key = name ? `${name}\u0000${attempt}` : null;

	useEffect(() => {
		if (!name) return;
		let cancelled = false;
		const k = `${name}\u0000${attempt}`;
		fetchData("search", { term: primaryArtistName(name), type: "artist", start: "0", nb: "10" })
			.then((res) => {
				if (cancelled) return;
				const id = pickArtistId(name, Array.isArray(res?.data) ? res.data : []);
				if (id) router.replace(`/artist?id=${encodeURIComponent(id)}`);
				else setOutcome({ key: k, status: "missing" });
			})
			.catch(() => !cancelled && setOutcome({ key: k, status: "error" }));
		return () => {
			cancelled = true;
		};
	}, [name, attempt, router]);

	const retry = useCallback(() => setAttempt((a) => a + 1), []);
	return { status: key && outcome?.key === key ? outcome.status : ("loading" as const), retry };
}

function ArtistContent() {
	const params = useSearchParams();
	const id = params.get("id");
	const name = params.get("name");
	const byName = useArtistFromName(id ? null : name);
	const tracklist = useTracklist("artist", id, parseArtistPage);
	const page = tracklist.page;
	const status = id ? tracklist.status : name ? byName.status : "missing";
	const retry = id ? tracklist.retry : byName.retry;

	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div key={status === "ready" ? `artist-${page?.id}` : status} variants={swap} initial="initial" animate="animate" exit="exit">
				{status === "loading" ? (
					<ArtistDetailSkeleton />
				) : status === "ready" && page ? (
					<ArtistView page={page} />
				) : status === "error" ? (
					<LoadFailed what="artist" onRetry={retry} />
				) : (
					<Medallion icon={UserRound} title="Artist not found" message="The artist you're looking for doesn't exist or is unavailable." className="mt-10" />
				)}
			</motion.div>
		</AnimatePresence>
	);
}

/** Follow state, resolved from the followed-artists list (single source of truth). */
function useFollow(page: ArtistPageData) {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const [following, setFollowing] = useState(false);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!isAuthenticated) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/v1/library/artists", { credentials: "include" });
				if (!res.ok) return;
				const json = await res.json();
				if (cancelled || !json.success) return;
				const items = (json.data?.items as Array<{ deezerArtistId: string }>) || [];
				setFollowing(items.some((a) => a.deezerArtistId === page.id));
			} catch {
				// ignore — defaults to "not followed"
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [page.id, isAuthenticated]);

	const toggle = async () => {
		if (!isAuthenticated || busy) return;
		const was = isAuthenticated && following;
		setFollowing(!was);
		setBusy(true);
		try {
			const res = was
				? await fetch(`/api/v1/library/artists/${encodeURIComponent(page.id)}`, { method: "DELETE", credentials: "include" })
				: await fetch("/api/v1/library/artists", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ deezerArtistId: page.id, name: page.name, pictureUrl: page.picture }),
					});
			if (!res.ok) throw new Error(was ? "unfollow failed" : "follow failed");
			toast(was ? `Unfollowed ${page.name}` : `Following ${page.name}`);
		} catch {
			setFollowing(was);
			toast.error("Couldn't update the artists you follow");
		}
		setBusy(false);
	};

	// Signed out: never "following" (the last answer may belong to the previous account).
	return { isAuthenticated, following: isAuthenticated && following, busy, toggle };
}

function ArtistView({ page }: { page: ArtistPageData }) {
	const follow = useFollow(page);
	const [showAllTop, setShowAllTop] = useState(false);
	const [tab, setTab] = useState(page.tabs[0]?.key ?? "");
	const activeTab = page.tabs.find((t) => t.key === tab) ?? page.tabs[0];

	const releaseIds = useMemo(() => [...new Set(page.tabs.flatMap((t) => t.releases.map((r) => r.id)))], [page]);
	const { isSaved } = useSavedAlbums(releaseIds);

	const topTracks = useMemo<TrackRowTrack[]>(() => page.topTracks.map((t) => trackFromDeezerRaw(t)), [page]);
	const playable = useMemo(() => topTracks.slice(0, TOP), [topTracks]);
	const { play, shuffle, trackIds } = useCollectionPlayback(playable);
	const shown = topTracks.slice(0, showAllTop ? TOP_MORE : TOP);

	const stats = [
		...(page.fans != null ? [{ icon: Users, label: `${compactNumber(page.fans)} fans` }] : []),
		...(page.albumCount != null ? [{ icon: Disc3, label: plural(page.albumCount, "album") }] : []),
		...(topTracks.length ? [{ icon: TrendingUp, label: `${topTracks.length} top tracks` }] : []),
	];

	const empty = topTracks.length === 0 && page.tabs.length === 0;

	return (
		<CollectionScaffold
			title={page.name}
			cover={page.picture}
			circle
			eyebrow="Artist"
			backdropCovers={page.covers}
			stats={stats}
			trackIds={trackIds}
			onPlay={play}
			onShuffle={shuffle}
			playLabel="Play top tracks"
			actions={
				follow.isAuthenticated ? (
					<TonalIconButton label={follow.following ? "Unfollow artist" : "Follow artist"} active={follow.following} onClick={follow.toggle} disabled={follow.busy}>
						<AnimatePresence mode="popLayout" initial={false}>
							<motion.span key={String(follow.following)} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }} transition={SPRING.pop} className="flex">
								{follow.following ? <UserCheck /> : <UserPlus />}
							</motion.span>
						</AnimatePresence>
					</TonalIconButton>
				) : null
			}
		>
			<div className={cn("grid items-start gap-x-10", page.bio && "lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]")}>
				{topTracks.length > 0 && (
					<section className="min-w-0">
						<SectionTitle eyebrow="Most played" title="Top tracks" count={topTracks.length} />
						<div className="-mx-2 space-y-0.5">
							<AnimatePresence initial={false}>
								{shown.map((t, i) => (
									<motion.div
										key={`${t.trackId}-${i}`}
										{...(i < TOP ? rowReveal : { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto" }, exit: { opacity: 0, height: 0 }, transition: { duration: DUR.medium, ease: EASE.emphasized, delay: (i - TOP) * 0.02 } })}
										className="flex items-center"
									>
										<span
											aria-hidden
											className={cn("w-9 shrink-0 pr-1 text-right text-[1.375rem] font-semibold tabular-nums tracking-[-0.06em]", i < 3 ? "text-primary" : "text-outline")}
										>
											{i + 1}
										</span>
										<div className="min-w-0 flex-1">
											<TrackRow track={t} queue={topTracks} />
										</div>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
						{topTracks.length > TOP && (
							<div className="mt-3 flex justify-center">
								<motion.button
									type="button"
									whileTap={{ scale: 0.95 }}
									onClick={() => setShowAllTop((v) => !v)}
									aria-expanded={showAllTop}
									className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
								>
									<motion.span animate={{ rotate: showAllTop ? 180 : 0 }} transition={{ duration: DUR.medium, ease: EASE.emphasized }} className="flex">
										<ChevronDown className="size-[18px]" />
									</motion.span>
									<AnimatePresence mode="popLayout" initial={false}>
										<motion.span key={String(showAllTop)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: DUR.short }}>
											{showAllTop ? "Show less" : "Show more"}
										</motion.span>
									</AnimatePresence>
								</motion.button>
							</div>
						)}
					</section>
				)}

				{page.bio && (
					<section className="min-w-0">
						<SectionTitle title="About" />
						<BioCard bio={page.bio} />
					</section>
				)}
			</div>

			{activeTab && (
				<section>
					<SectionTitle eyebrow="Releases" title="Discography" />
					<FilterPills
						ariaLabel="Release type"
						value={activeTab.key}
						onChange={setTab}
						items={page.tabs.map((t) => ({ value: t.key, label: t.label, count: t.releases.length }))}
						className="mb-3"
					/>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={activeTab.key}
							initial={{ opacity: 0, x: 24 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -12 }}
							transition={{ duration: DUR.medium, ease: EASE.emphasized }}
						>
							<CardCarousel>
								{activeTab.releases.map((a, i) => (
									<MediaCard
										key={a.id}
										index={i}
										href={`/album?id=${a.id}`}
										title={a.title}
										subtitle={[a.year, a.trackCount != null ? plural(a.trackCount, "track") : a.recordType].filter(Boolean).join(" · ") || undefined}
										cover={a.cover}
										collection={{ type: "album", id: a.id }}
										badge={isSaved(a.id) ? <SavedBadge /> : undefined}
									/>
								))}
							</CardCarousel>
						</motion.div>
					</AnimatePresence>
				</section>
			)}

			{page.related.length > 0 && (
				<section>
					<SectionTitle eyebrow="Similar artists" title="Fans also like" />
					<CardCarousel itemClassName="w-[128px] sm:w-[152px] lg:w-[164px]">
						{page.related.map((r, i) => (
							<MediaCard key={r.id} index={i} href={`/artist?id=${r.id}`} title={r.name} subtitle={r.fans != null ? `${compactNumber(r.fans)} fans` : undefined} cover={r.picture} round />
						))}
					</CardCarousel>
				</section>
			)}

			{empty && <Medallion icon={Disc3} title="No content" message="No tracks or discography found for this artist." />}
		</CollectionScaffold>
	);
}

/** Bio on a tonal card: quote mark, 5-line clamp, expands in place. */
function BioCard({ bio }: { bio: string }) {
	const [expanded, setExpanded] = useState(false);
	const long = bio.length > 280;
	return (
		<motion.button
			type="button"
			{...rowReveal}
			whileTap={long ? { scale: 0.98 } : undefined}
			onClick={() => long && setExpanded((v) => !v)}
			aria-expanded={long ? expanded : undefined}
			className={cn(
				"block w-full rounded-[28px] bg-linear-to-br from-secondary to-surface-high p-5 text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/40 sm:p-6",
				!long && "cursor-default"
			)}
		>
			<Quote className="size-8 fill-primary/15 text-primary" />
			<motion.div layout transition={{ duration: DUR.medium, ease: EASE.emphasized }} className="mt-2 overflow-hidden">
				<p className={cn("whitespace-pre-line text-base leading-[1.55] text-secondary-foreground", !expanded && "line-clamp-5")}>{bio}</p>
			</motion.div>
			{long && (
				<span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
					{expanded ? "Show less" : "Read more"}
					<motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: DUR.medium, ease: EASE.emphasized }} className="flex">
						<ChevronDown className="size-5" />
					</motion.span>
				</span>
			)}
		</motion.button>
	);
}

export default function ArtistPage() {
	return (
		<Suspense fallback={<ArtistDetailSkeleton />}>
			<ArtistContent />
		</Suspense>
	);
}
