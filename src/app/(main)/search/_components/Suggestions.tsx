"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, ChevronRight, History, Link as LinkIcon, SearchX, User, X } from "lucide-react";
import { fetchData } from "@/utils/api";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { parseDeezerLink, fetchCollection, type CollectionInfo, type DeezerLink } from "@/lib/collection-tracks";
import type { SuggestAlbum, SuggestArtist, SuggestTrack } from "@/lib/deezer/suggest";
import { TrackRow, type TrackRowTrack } from "@/components/tracks/TrackRow";
import { DownloadGlyph, PlayPauseIcon, SearchGlyph, Spinner } from "@/components/motion/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Art, CoverTheme, Medallion, entrance, swap } from "@/components/expressive";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useDownloadStore } from "@/stores/useDownloadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCommandStore } from "@/stores/useCommandStore";
import { plural } from "../_lib/search-model";
import { recentSearches, useRecentSearches } from "../_lib/useRecentSearches";
import { KindPill } from "./bits";

const MIN_QUERY = 2;

interface SuggestResponse {
	tracks: SuggestTrack[];
	albums: SuggestAlbum[];
	artists: SuggestArtist[];
}

function suggestToRow(t: SuggestTrack): TrackRowTrack {
	return {
		trackId: t.deezerTrackId,
		title: t.title,
		artist: t.artists.join(", "),
		artistId: t.artistId,
		album: t.album,
		albumId: t.albumId,
		cover: t.coverUrl,
		duration: t.durationMs ? Math.round(t.durationMs / 1000) : null,
	};
}

/** While typing: a "Search for" CTA + live suggestions, or a pasted link. */
export function Suggestions({ term, onSubmit }: { term: string; onSubmit: (term: string) => void }) {
	const link = useMemo(() => parseDeezerLink(term), [term]);
	if (link) return <DeezerLinkCard key={`${link.type}:${link.id}`} link={link} />;
	if (term.length < MIN_QUERY) return <RecentList onSubmit={onSubmit} />;
	return <SuggestList term={term} onSubmit={onSubmit} />;
}

function RecentList({ onSubmit }: { onSubmit: (term: string) => void }) {
	const recent = useRecentSearches();
	if (recent.length === 0) return null;
	return (
		<ul className="max-w-4xl space-y-0.5 pt-2">
			<AnimatePresence initial={false}>
				{recent.map((r, i) => (
					<motion.li key={r} {...entrance(i, 8)} exit={{ opacity: 0, height: 0 }} className="group flex items-center gap-1 rounded-2xl transition-colors hover:bg-surface-high">
						<button type="button" onClick={() => onSubmit(r)} className="flex min-w-0 flex-1 items-center gap-4 px-3 py-3 text-left">
							<History className="size-5 shrink-0 text-muted-foreground" />
							<span className="truncate text-[15px]">{r}</span>
						</button>
						<button
							type="button"
							aria-label={`Remove “${r}”`}
							onClick={() => recentSearches.remove(r)}
							className="mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
						>
							<X className="size-[18px]" />
						</button>
					</motion.li>
				))}
			</AnimatePresence>
		</ul>
	);
}

function SuggestList({ term, onSubmit }: { term: string; onSubmit: (term: string) => void }) {
	const debounced = useDebouncedValue(term, 180);
	const [state, setState] = useState<{ term: string; data: SuggestResponse | null; error: boolean } | null>(null);

	useEffect(() => {
		if (debounced.length < MIN_QUERY) return;
		let live = true;
		fetchData("search/suggest", { term: debounced })
			.then((data: SuggestResponse) => live && setState({ term: debounced, data, error: false }))
			.catch(() => live && setState({ term: debounced, data: null, error: true }));
		return () => {
			live = false;
		};
	}, [debounced]);

	const fresh = state?.term === debounced && debounced === term;
	const data = state?.data ?? null;
	const loading = !fresh;
	const rows = useMemo(() => (data?.tracks ?? []).map(suggestToRow), [data]);
	const empty = fresh && !!data && !data.tracks.length && !data.albums.length && !data.artists.length;
	let i = 1;

	return (
		<div className="max-w-4xl pt-1">
			<SearchFor term={term} onTap={() => onSubmit(term)} />
			<div className="h-3 px-8 pt-2">
				<AnimatePresence>
					{loading && (
						<motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[3px] overflow-hidden rounded-full bg-primary/15">
							<motion.div className="h-full w-1/3 rounded-full bg-primary" animate={{ x: ["-100%", "300%"] }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
			{!data && loading && (
				<div className="space-y-1 px-2 pt-1">
					{Array.from({ length: 5 }, (_, k) => (
						<div key={k} className="flex items-center gap-3 px-2 py-2">
							<Skeleton className="size-12 rounded-lg" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-3.5 w-1/2" />
								<Skeleton className="h-3 w-1/3" />
							</div>
						</div>
					))}
				</div>
			)}
			{data && (
				<div className={cn("transition-opacity duration-300", !fresh && "opacity-60")}>
					<div className="-mx-2 sm:mx-0">
						{rows.map((t) => (
							<motion.div key={t.trackId} {...entrance(i++, 10)}>
								<TrackRow track={t} queue={[t]} showBitrate={false} />
							</motion.div>
						))}
					</div>
					{data.albums.map((a) => (
						<motion.div key={`a${a.deezerAlbumId}`} {...entrance(i++, 10)}>
							<SuggestionRow href={`/album?id=${a.deezerAlbumId}`} art={<Art src={a.coverUrl} className="size-12" rounded="rounded-lg" size={120} />} title={a.title} subtitle={a.artists.join(", ")} kind="Album" onOpen={() => recentSearches.add(term)} />
						</motion.div>
					))}
					{data.artists.map((a) => (
						<motion.div key={`r${a.deezerArtistId}`} {...entrance(i++, 10)}>
							<SuggestionRow href={`/artist?id=${a.deezerArtistId}`} art={<Art src={a.imageUrl} className="size-12" rounded="rounded-full" size={120} />} title={a.name} kind="Artist" onOpen={() => recentSearches.add(term)} />
						</motion.div>
					))}
				</div>
			)}
			{empty && <Medallion icon={SearchX} title="No suggestions" message="Press Enter to look everywhere." className="py-10" />}
			{fresh && state?.error && <Medallion icon={SearchX} title="Suggestions are unavailable" message="Press Enter to search anyway." className="py-10" />}
		</div>
	);
}

/** "Search for “term”" call to action at the top of the suggestions. */
function SearchFor({ term, onTap }: { term: string; onTap: () => void }) {
	return (
		<motion.button
			type="button"
			{...entrance(0, 8)}
			whileTap={{ scale: 0.97 }}
			onClick={onTap}
			className="group flex w-full items-center gap-3.5 rounded-[20px] bg-primary-container py-3.5 pl-4 pr-3 text-left text-on-primary-container transition-shadow duration-300 hover:shadow-[0_8px_20px_-8px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
		>
			<SearchGlyph className="size-5 shrink-0" />
			<span className="min-w-0 flex-1 truncate text-sm sm:text-[15px]">
				Search for <span className="font-semibold">“{term}”</span>
			</span>
			<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0.5">
				<ArrowRight className="size-[18px]" />
			</span>
		</motion.button>
	);
}


function SuggestionRow({ href, art, title, subtitle, kind, onOpen }: { href: string; art: React.ReactNode; title: string; subtitle?: string; kind: string; onOpen: () => void }) {
	return (
		<Link href={href} onClick={onOpen} className="group flex items-center gap-3 rounded-2xl px-2 py-2 no-underline transition-colors hover:bg-surface-high active:scale-[0.99]">
			<span className="shrink-0 overflow-hidden">{art}</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[15px] text-foreground">{title}</span>
				<span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
					<KindPill>{kind}</KindPill>
					{subtitle && <span className="truncate">{subtitle}</span>}
				</span>
			</span>
			<ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}

// ─── Pasted Deezer link ─────────────────────────────────────────────────────

function DeezerLinkCard({ link }: { link: DeezerLink }) {
	const router = useRouter();
	if (link.type === "track") {
		return <Medallion icon={LinkIcon} title="Track links aren’t supported" message="Paste an album, playlist or artist link instead." />;
	}
	if (link.type === "artist") {
		return (
			<Medallion
				icon={User}
				title="Deezer artist"
				action={
					<motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => router.push(`/artist?id=${link.id}`)} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">
						Open artist
					</motion.button>
				}
			/>
		);
	}
	return <CollectionLinkCard type={link.type} id={link.id} />;
}

function CollectionLinkCard({ type, id }: { type: "album" | "playlist"; id: string }) {
	const router = useRouter();
	const [state, setState] = useState<{ info: CollectionInfo | null; error: string | null } | null>(null);
	const playQueue = usePlayerStore((s) => s.playQueue);
	const enqueue = useDownloadStore((s) => s.enqueue);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const openPalette = useCommandStore((s) => s.open);
	const isAlbum = type === "album";

	useEffect(() => {
		let live = true;
		fetchCollection(type, id)
			.then((info) => live && setState({ info, error: null }))
			.catch((e) => live && setState({ info: null, error: e instanceof Error ? e.message : "Not found" }));
		return () => {
			live = false;
		};
	}, [type, id]);

	const open = () => router.push(`/${type}?id=${id}`);

	return (
		<AnimatePresence mode="wait" initial={false}>
			{!state ? (
				<motion.div key="loading" variants={swap} initial="initial" animate="animate" exit="exit" className="max-w-4xl pt-2">
					<Skeleton className="h-[420px] rounded-[28px] sm:h-[260px]" />
				</motion.div>
			) : !state.info ? (
				<motion.div key="error" variants={swap} initial="initial" animate="animate" exit="exit">
					<Medallion
						icon={LinkIcon}
						title={`Couldn’t load this ${type}`}
						message={state.error ?? undefined}
						action={
							<motion.button type="button" whileTap={{ scale: 0.95 }} onClick={open} className="inline-flex h-11 items-center rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground">
								Open anyway
							</motion.button>
						}
					/>
				</motion.div>
			) : (
				<motion.div key="card" variants={swap} initial="initial" animate="animate" exit="exit" className="max-w-4xl pt-2">
					<CoverTheme src={state.info.cover}>
						<div className="flex flex-col items-center gap-5 rounded-[28px] bg-[linear-gradient(to_bottom,var(--m3-primary-container),var(--m3-surface-container-high))] p-5 text-center sm:flex-row sm:items-end sm:gap-7 sm:p-7 sm:text-left">
							<motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="shrink-0">
								<Art src={state.info.cover} size={500} rounded="rounded-[20px]" className="size-[180px] shadow-[0_10px_24px_-4px_rgb(0_0_0/0.3)] sm:size-[200px]" />
							</motion.div>
							<div className="flex min-w-0 flex-1 flex-col items-center sm:items-start">
								<KindPill tone="primary" className="h-6 px-2.5 text-xs">{isAlbum ? "Album link" : "Playlist link"}</KindPill>
								<h2 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-[-0.02em] text-on-primary-container sm:text-[2rem] sm:leading-tight">{state.info.title}</h2>
								<p className="mt-1 text-sm text-muted-foreground">{[state.info.subtitle, plural(state.info.tracks.length, "track")].filter(Boolean).join(" · ")}</p>
								<div className="mt-5 flex flex-wrap justify-center gap-2">
									<motion.button
										type="button"
										whileTap={{ scale: 0.95 }}
										disabled={!state.info.tracks.length}
										onClick={() => {
											const q = state.info!.tracks.map((t) => ({ trackId: t.trackId, title: t.title, artist: t.artist, artistId: t.artistId ?? null, cover: t.cover, duration: t.duration ?? null }));
											if (q.length) playQueue(q, 0);
										}}
										className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_6px_14px_-4px_color-mix(in_srgb,var(--primary)_50%,transparent)] disabled:opacity-50"
									>
										<PlayPauseIcon playing={false} className="size-[18px]" />
										{isAlbum ? "Play album" : "Play playlist"}
									</motion.button>
									<motion.button type="button" whileTap={{ scale: 0.95 }} onClick={open} className="inline-flex h-11 items-center rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
										Open
									</motion.button>
									<DownloadCollectionButton
										onDownload={() => {
											if (!isAuthenticated) {
												toast("Sign in to download", { action: { label: "Sign in", onClick: () => router.push("/login") } });
												return;
											}
											const n = enqueue(state.info!.tracks, `${isAlbum ? "Album" : "Playlist"} · ${state.info!.title}`);
											toast.success(n ? `Downloading ${n} tracks` : "Already in your downloads", {
												action: { label: "View", onClick: () => openPalette(undefined, "downloads") },
											});
										}}
									/>
								</div>
							</div>
						</div>
					</CoverTheme>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function DownloadCollectionButton({ onDownload }: { onDownload: () => void }) {
	const [busy, setBusy] = useState(false);
	return (
		<motion.button
			type="button"
			whileTap={{ scale: 0.9 }}
			aria-label="Download"
			title="Download"
			onClick={() => {
				setBusy(true);
				onDownload();
				setTimeout(() => setBusy(false), 600);
			}}
			className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
		>
			{busy ? <Spinner size={16} /> : <DownloadGlyph />}
		</motion.button>
	);
}
