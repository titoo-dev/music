"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { currentLoginHref } from "@/lib/login-redirect";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { toast } from "sonner";
import {
	ArrowRight,
	CornerDownLeft,
	Disc3,
	Home,
	Info,
	Library,
	ListMusic,
	ListEnd,
	ListStart,
	Moon,
	RotateCw,
	Settings,
	Sun,
	User as UserIcon,
	X,
	type LucideIcon,
} from "lucide-react";
import { fetchData } from "@/utils/api";
import { cn } from "@/lib/utils";
import { AlbumLink, ArtistLink, ArtistLinks, isPlainClick } from "@/components/links/EntityLink";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { leaveOverlays, useOverlayStack } from "@/lib/overlay-history";
import { startNavProgress } from "@/lib/nav-progress";
import { useCommandStore, type CommandView } from "@/stores/useCommandStore";
import {
	useDownloadStore,
	selectActiveCount,
	selectOverallProgress,
	type DownloadItem,
} from "@/stores/useDownloadStore";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { parseDeezerLink, fetchCollection, type DeezerLink, type CollectionInfo } from "@/lib/collection-tracks";
import { applyThemePreference } from "@/lib/theme";
import type { DownloadableTrack } from "@/lib/download";
import type { SuggestAlbum, SuggestArtist, SuggestTrack } from "@/lib/deezer/suggest";
import { CoverImage } from "@/components/ui/cover-image";
import {
	DownloadGlyph,
	DrawCheck,
	ProgressRing,
	SearchGlyph,
	SlideSwap,
	Spinner,
	WaveLine,
} from "@/components/motion/icons";

const MIN_QUERY = 2;

const noopSubscribe = () => () => {};
/** false during SSR + hydration, true after — without a setState-in-effect. */
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

interface SuggestResponse {
	tracks: SuggestTrack[];
	albums: SuggestAlbum[];
	artists: SuggestArtist[];
}

interface Row {
	key: string;
	group: string;
	title: string;
	/** Text, or artist / album links (they close the palette on their own). */
	subtitle?: React.ReactNode;
	cover?: string | null;
	icon?: LucideIcon;
	round?: boolean;
	/** Enter */
	onSelect: () => void;
	/** The page a navigation row opens: Ctrl / ⌘ / middle click and ⌘+Enter open it in a new tab. */
	href?: string;
	/** Shift+Enter — only for downloadable rows. */
	onDownload?: () => void;
	onQueue?: () => void;
	onPlayNext?: () => void;
	hint?: string;
}

const PAGES: { href: string; label: string; icon: LucideIcon; auth?: boolean; keywords: string }[] = [
	{ href: "/", label: "All music", icon: Home, keywords: "home all music tracks" },
	{ href: "/library", label: "Library", icon: Library, auth: true, keywords: "library saved liked recent following" },
	{ href: "/my-playlists", label: "My playlists", icon: ListMusic, auth: true, keywords: "playlists" },
	{ href: "/settings", label: "Settings", icon: Settings, keywords: "settings preferences quality" },
	{ href: "/about", label: "About", icon: Info, keywords: "about" },
];

function toPlayerTrack(t: SuggestTrack): PlayerTrack {
	return {
		trackId: t.deezerTrackId,
		title: t.title,
		artist: t.artists.join(", "),
		artistId: t.artistId,
		album: t.album || null,
		albumId: t.albumId,
		cover: t.coverUrl,
		duration: t.durationMs ? Math.round(t.durationMs / 1000) : null,
	};
}

function toDownloadable(t: SuggestTrack): DownloadableTrack {
	return {
		trackId: t.deezerTrackId,
		title: t.title,
		artist: t.artists.join(", "),
		album: t.album,
		cover: t.coverUrl,
		duration: t.durationMs ? Math.round(t.durationMs / 1000) : null,
	};
}

export function CommandPalette() {
	const isOpen = useCommandStore((s) => s.isOpen);
	const close = useCommandStore((s) => s.close);
	const mounted = useIsClient();

	// Lock page scroll while open.
	useEffect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isOpen]);

	// Give the focus back to whatever opened the palette, unless it navigated away.
	const opener = useRef<HTMLElement | null>(null);
	const navigated = useRef(false);
	const markNavigated = useCallback(() => {
		navigated.current = true;
	}, []);
	useEffect(
		// Read at open() time, before the input takes the focus.
		() =>
			useCommandStore.subscribe((s, p) => {
				if (!s.isOpen || p.isOpen) return;
				opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				navigated.current = false;
			}),
		[]
	);
	useEffect(() => {
		if (isOpen) return;
		const el = opener.current;
		opener.current = null;
		if (el && !navigated.current && el.isConnected && el !== document.body) el.focus();
	}, [isOpen]);

	if (!mounted) return null;
	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[12vh] sm:pt-[14vh]">
					<motion.div
						key="overlay"
						className="absolute inset-0 bg-black/45 backdrop-blur-[6px]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						onClick={close}
					/>
					<motion.div
						key="panel"
						role="dialog"
						aria-modal="true"
						aria-label="Command palette"
						initial={{ opacity: 0, scale: 0.94, y: -12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.97, y: -6, transition: { duration: 0.15, ease: [0.3, 0, 0.8, 0.15] } }}
						transition={{ type: "spring", stiffness: 420, damping: 32 }}
						className="relative flex max-h-[72vh] w-full max-w-[680px] origin-top flex-col overflow-hidden rounded-[28px] bg-surface-container text-foreground shadow-popover ring-1 ring-outline-variant/40"
					>
						<PaletteBody onNavigate={markNavigated} />
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		document.body
	);
}

function PaletteBody({ onNavigate }: { onNavigate: () => void }) {
	const router = useRouter();
	const query = useCommandStore((s) => s.query);
	const setQuery = useCommandStore((s) => s.setQuery);
	const view = useCommandStore((s) => s.view);
	const setView = useCommandStore((s) => s.setView);
	const close = useCommandStore((s) => s.close);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const items = useDownloadStore((s) => s.items);
	const enqueue = useDownloadStore((s) => s.enqueue);
	const play = usePlayerStore((s) => s.play);
	const playQueue = usePlayerStore((s) => s.playQueue);
	const addToQueue = usePlayerStore((s) => s.addToQueue);
	const addNext = usePlayerStore((s) => s.addNext);

	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState(0);
	const [suggest, setSuggest] = useState<{ term: string; data: SuggestResponse | null } | null>(null);
	const [loaded, setLoaded] = useState<{ key: string; info: CollectionInfo | null; error?: string } | null>(null);

	const trimmed = query.trim();
	const link = useMemo(() => parseDeezerLink(trimmed), [trimmed]);
	const debounced = useDebouncedValue(trimmed, 180);
	const activeCount = selectActiveCount(items);
	const overall = selectOverallProgress(items);

	useEffect(() => {
		inputRef.current?.focus();
		inputRef.current?.select();
	}, [view]);

	// Suggestions (state is keyed by term; data/loading are derived from it).
	const suggesting = view === "search" && !link && debounced.length >= MIN_QUERY;
	useEffect(() => {
		if (!suggesting) return;
		let cancelled = false;
		fetchData("search/suggest", { term: debounced })
			.then((res: SuggestResponse) => !cancelled && setSuggest({ term: debounced, data: res }))
			.catch(() => !cancelled && setSuggest({ term: debounced, data: null }));
		return () => {
			cancelled = true;
		};
	}, [debounced, suggesting]);
	const data = suggesting ? (suggest?.data ?? null) : null;
	const loading = suggesting && suggest?.term !== debounced;
	// The rows on screen still belong to an earlier query (debounce / request in flight): Enter must not act on them.
	const stale = suggesting && suggest?.term !== trimmed;

	// Pasted Deezer link → preview the collection
	const linkKey = link ? `${link.type}:${link.id}` : null;
	const isCollectionLink = !!link && (link.type === "album" || link.type === "playlist");
	useEffect(() => {
		if (!link || !linkKey || (link.type !== "album" && link.type !== "playlist")) return;
		let cancelled = false;
		fetchCollection(link.type, link.id)
			.then((info) => !cancelled && setLoaded({ key: linkKey, info }))
			.catch((e) => !cancelled && setLoaded({ key: linkKey, info: null, error: e instanceof Error ? e.message : "Not found" }));
		return () => {
			cancelled = true;
		};
		// linkKey captures the link's identity; the object itself changes per keystroke.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [linkKey]);
	const collection = useMemo<{ link: DeezerLink; info: CollectionInfo | null; error?: string } | null>(() => {
		if (!link) return null;
		if (!isCollectionLink || loaded?.key !== linkKey) return { link, info: null };
		return { link, info: loaded.info, error: loaded.error };
	}, [link, isCollectionLink, loaded, linkKey]);

	// The palette owns a history entry while open (Back closes it): a navigation replaces that entry and
	// closes the palette without going Back, which would race the navigation.
	const go = useCallback(
		(href: string) => {
			const replace = useOverlayStack.getState().ids.length > 0;
			onNavigate();
			startNavProgress(href);
			leaveOverlays(close);
			if (replace) router.replace(href);
			else router.push(href);
		},
		[close, router, onNavigate]
	);

	const requireAuth = useCallback(() => {
		if (isAuthenticated) return true;
		toast("Sign in to download", {
			action: { label: "Sign in", onClick: () => go(currentLoginHref()) },
		});
		return false;
	}, [isAuthenticated, go]);

	const download = useCallback(
		(tracks: DownloadableTrack[], group: string | null = null) => {
			if (!requireAuth()) return;
			const n = enqueue(tracks, group);
			if (n === 0) {
				toast("Already in your downloads");
				return;
			}
			toast.success(n === 1 ? `Downloading “${tracks[0].title}”` : `Downloading ${n} tracks`, {
				description: group ?? undefined,
			});
		},
		[enqueue, requireAuth]
	);

	const downloadCollection = useCallback(
		async (type: "album" | "playlist", id: string, label: string) => {
			if (!requireAuth()) return;
			const t = toast.loading(`Fetching ${type}…`);
			try {
				const info = await fetchCollection(type, id);
				toast.dismiss(t);
				download(info.tracks, `${type === "album" ? "Album" : "Playlist"} · ${info.title || label}`);
			} catch {
				toast.error(`Couldn't load this ${type}`, { id: t });
			}
		},
		[download, requireAuth]
	);

	const rows = useMemo<Row[]>(() => {
		if (view !== "search") return [];
		const out: Row[] = [];

		if (collection) {
			const { link: l, info } = collection;
			if ((l.type === "album" || l.type === "playlist") && info) {
				const group = `${l.type === "album" ? "Album" : "Playlist"} · ${info.title}`;
				out.push({
					key: "link-download",
					group: "Deezer link",
					title: `Download ${info.tracks.length} tracks`,
					subtitle: `${info.title}${info.subtitle ? ` — ${info.subtitle}` : ""}`,
					cover: info.cover,
					onSelect: () => download(info.tracks, group),
					hint: "Download",
				});
				out.push({
					key: "link-play",
					group: "Deezer link",
					title: `Play ${l.type}`,
					subtitle: info.title,
					icon: ArrowRight,
					onSelect: () => {
						const q = info.tracks.map((t) => ({ trackId: t.trackId, title: t.title, artist: t.artist, artistId: t.artistId ?? null, album: t.album ?? null, albumId: t.albumId ?? null, cover: t.cover, duration: t.duration ?? null }));
						if (q.length) playQueue(q, 0);
						close();
					},
				});
			}
			// There is no track page to open: say so rather than searching the URL.
			if (l.type === "track") {
				out.push({
					key: "link-track",
					group: "Deezer link",
					title: "Track links aren’t supported",
					subtitle: "Paste an album, playlist or artist link instead.",
					icon: Info,
					onSelect: () => {},
				});
				return out;
			}
			out.push({
				key: "link-open",
				group: "Deezer link",
				title: `Open ${l.type}`,
				subtitle: collection.error ?? `deezer.com/${l.type}/${l.id}`,
				icon: l.type === "artist" ? UserIcon : Disc3,
				href: `/${l.type}?id=${l.id}`,
				onSelect: () => go(`/${l.type}?id=${l.id}`),
			});
			return out;
		}

		if (trimmed.length >= MIN_QUERY && data) {
			for (const t of data.tracks) {
				out.push({
					key: `t-${t.sourceId}`,
					group: "Tracks",
					title: t.title,
					subtitle: (
						<>
							<ArtistLinks artists={t.artists.map((name, i) => ({ id: i === 0 ? t.artistId : null, name }))} onClick={close} />
							{t.album && (
								<>
									{" · "}
									<AlbumLink id={t.albumId} title={t.album} artist={t.artists[0]} onClick={close} />
								</>
							)}
						</>
					),
					cover: t.coverUrl,
					onSelect: () => {
						play(toPlayerTrack(t));
						close();
					},
					onPlayNext: () => {
						addNext(toPlayerTrack(t));
						toast(`“${t.title}” plays next`);
					},
					onQueue: () => {
						toast(addToQueue(toPlayerTrack(t)) ? `Added “${t.title}” to queue` : `“${t.title}” is already up next`);
					},
					onDownload: () => download([toDownloadable(t)]),
					hint: "Play",
				});
			}
			for (const a of data.albums) {
				out.push({
					key: `a-${a.sourceId}`,
					group: "Albums",
					title: a.title,
					subtitle: <ArtistLinks artists={a.artists.map((name) => ({ name }))} onClick={close} />,
					cover: a.coverUrl,
					href: `/album?id=${a.deezerAlbumId}`,
					onSelect: () => go(`/album?id=${a.deezerAlbumId}`),
					onDownload: () => void downloadCollection("album", a.deezerAlbumId, a.title),
					hint: "Open",
				});
			}
			for (const a of data.artists) {
				out.push({
					key: `r-${a.sourceId}`,
					group: "Artists",
					title: a.name,
					cover: a.imageUrl,
					round: true,
					href: `/artist?id=${a.deezerArtistId}`,
					onSelect: () => go(`/artist?id=${a.deezerArtistId}`),
					hint: "Open",
				});
			}
		}

		if (trimmed.length >= MIN_QUERY) {
			out.push({
				key: "all-results",
				group: "Search",
				title: `See all results for “${trimmed}”`,
				icon: ArrowRight,
				href: `/search?term=${encodeURIComponent(trimmed)}`,
				onSelect: () => go(`/search?term=${encodeURIComponent(trimmed)}`),
			});
		}

		const q = trimmed.toLowerCase();
		const pages = PAGES.filter((p) => (!p.auth || isAuthenticated) && (!q || p.label.toLowerCase().includes(q) || p.keywords.includes(q)));
		for (const p of pages) {
			out.push({ key: `p-${p.href}`, group: "Go to", title: p.label, icon: p.icon, href: p.href, onSelect: () => go(p.href) });
		}
		if (!q || "theme dark light mode".includes(q)) {
			out.push({
				key: "theme",
				group: "Preferences",
				title: "Toggle theme",
				icon: typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? Sun : Moon,
				onSelect: () => {
					const dark = document.documentElement.classList.contains("dark");
					applyThemePreference(dark ? "light" : "dark");
				},
			});
		}
		return out;
	}, [view, collection, trimmed, data, isAuthenticated, download, downloadCollection, go, play, playQueue, addToQueue, addNext, close]);

	// Back to the first row whenever the list changes (adjusted during render).
	const resetKey = `${rows.length}\u0000${trimmed}\u0000${view}\u0000${suggest?.term ?? ""}`;
	const [seenKey, setSeenKey] = useState(resetKey);
	if (seenKey !== resetKey) {
		setSeenKey(resetKey);
		setActive(0);
	}

	// Keep the active row in view.
	useEffect(() => {
		listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`)?.scrollIntoView({ block: "nearest" });
	}, [active]);

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			close();
			return;
		}
		if (e.key === "Tab") {
			e.preventDefault();
			setView(view === "search" ? "downloads" : "search");
			return;
		}
		if (view !== "search" || rows.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActive((i) => (i + 1) % rows.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
		} else if (e.key === "Enter") {
			e.preventDefault();
			const row = rows[active];
			if (!row) return;
			if (stale && /^[tar]-/.test(row.key)) {
				rows.find((r) => r.key === "all-results")?.onSelect();
				return;
			}
			if (e.shiftKey && row.onDownload) row.onDownload();
			else if ((e.metaKey || e.ctrlKey) && row.onQueue) row.onQueue();
			else if ((e.metaKey || e.ctrlKey) && row.href) openInNewTab(row.href);
			else row.onSelect();
		}
	};

	const busy = loading || (!!collection && !collection.info && !collection.error && (collection.link.type === "album" || collection.link.type === "playlist"));

	return (
		<div
			className="flex min-h-0 flex-1 flex-col"
			onKeyDown={onKeyDown}
			// Clicks keep the focus in the input, so Escape / arrows / Enter keep working.
			onMouseDown={(e) => e.target !== inputRef.current && e.preventDefault()}
		>
			{/* Input */}
			<div className="p-3 pb-2">
			<div className="flex h-14 items-center gap-3 rounded-full bg-surface-high pl-5 pr-2 shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--primary)_30%,transparent)]">
				<SearchGlyph busy={busy} className="size-5 shrink-0 text-primary" />
				<input
					ref={inputRef}
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						if (view !== "search") setView("search");
					}}
					placeholder="Search tracks, albums, artists — or paste a Deezer link"
					aria-label="Search"
					autoComplete="off"
					autoCorrect="off"
					spellCheck={false}
					className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
				/>
				{query && (
					<button
						type="button"
						aria-label="Clear"
						onClick={() => {
							setQuery("");
							inputRef.current?.focus();
						}}
						className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-90"
					>
						<X className="size-5" />
					</button>
				)}
				<kbd className="kbd mr-2 hidden sm:inline-flex">esc</kbd>
			</div>
			</div>

			{/* View switch */}
			<LayoutGroup id="palette-views">
				<div className="flex items-center gap-1.5 border-b border-outline-variant/40 px-3 pb-2.5">
					{(["search", "downloads"] as CommandView[]).map((v) => (
						<button
							key={v}
							type="button"
							onClick={() => setView(v)}
							className={cn(
								"relative flex h-9 items-center gap-2 rounded-full px-4 text-sm transition-colors duration-300 active:scale-95",
								view === v ? "font-semibold text-secondary-foreground" : "font-medium text-muted-foreground hover:bg-surface-high hover:text-foreground"
							)}
						>
							{view === v && (
								<motion.span layoutId="palette-view-pill" className="absolute inset-0 rounded-full bg-secondary" transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.9 }} />
							)}
							<span className="relative flex items-center gap-2">
								{v === "search" ? "Search" : "Downloads"}
								{v === "downloads" && activeCount > 0 && (
									<ProgressRing value={overall ?? 0} size={16} stroke={2} className="text-highlight" />
								)}
								{v === "downloads" && items.length > 0 && (
									<span className="inline-flex h-5 items-center rounded-full bg-primary-container px-1.5 text-[11px] font-semibold tabular-nums text-on-primary-container">
										<SlideSwap id={items.length}>{items.length}</SlideSwap>
									</span>
								)}
							</span>
						</button>
					))}
					<span className="ml-auto hidden items-center gap-1.5 pr-2 text-[11px] text-muted-foreground sm:flex">
						<kbd className="kbd">tab</kbd> switch
					</span>
				</div>
			</LayoutGroup>

			<div ref={listRef} aria-busy={stale || undefined} className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain transition-opacity", stale && "opacity-60")}>
				<AnimatePresence mode="wait" initial={false}>
					{view === "search" ? (
						<motion.div key="search" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }}>
							<SearchRows rows={rows} active={active} setActive={setActive} loading={loading} query={trimmed} hasData={!!data} />
						</motion.div>
					) : (
						<motion.div key="downloads" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.12 }}>
							<DownloadsView items={items} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Footer */}
			<div className="hidden items-center gap-4 border-t border-outline-variant/40 bg-surface-low px-5 py-2.5 text-[11px] text-muted-foreground sm:flex">
				<span className="flex items-center gap-1.5">
					<kbd className="kbd">↑</kbd>
					<kbd className="kbd">↓</kbd> navigate
				</span>
				<span className="flex items-center gap-1.5">
					<kbd className="kbd">
						<CornerDownLeft className="size-3" />
					</kbd>
					select
				</span>
				<span className="flex items-center gap-1.5">
					<kbd className="kbd">⇧</kbd>
					<kbd className="kbd">
						<CornerDownLeft className="size-3" />
					</kbd>
					download
				</span>
				<span className="flex items-center gap-1.5">
					<ModKey />
					<kbd className="kbd">
						<CornerDownLeft className="size-3" />
					</kbd>
					queue
				</span>
			</div>
		</div>
	);
}

function SearchRows({
	rows,
	active,
	setActive,
	loading,
	query,
	hasData,
}: {
	rows: Row[];
	active: number;
	setActive: (i: number) => void;
	loading: boolean;
	query: string;
	hasData: boolean;
}) {
	const showSkeleton = loading && !hasData && query.length >= MIN_QUERY;

	return (
		<div className="p-2">
			{showSkeleton && (
				<div className="space-y-1 p-1">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3 px-2.5 py-2">
							<div className="size-11 animate-pulse rounded-xl bg-surface-highest" />
							<div className="flex-1 space-y-2">
								<div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-highest" />
								<div className="h-2.5 w-1/3 animate-pulse rounded-full bg-surface-highest" />
							</div>
						</div>
					))}
				</div>
			)}
			{!showSkeleton && query.length >= MIN_QUERY && hasData && !rows.some((r) => ["Tracks", "Albums", "Artists"].includes(r.group)) && (
				<p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches on Deezer.</p>
			)}
			{query.length < MIN_QUERY && (
				<div className="px-3 pb-1 pt-3 text-muted-foreground/60">
					<WaveLine className="h-6" amplitude={6} />
				</div>
			)}
			{rows.map((row, i) => {
				const header = i === 0 || rows[i - 1].group !== row.group ? row.group : null;
				return (
					<div key={row.key}>
						{header && <div className="type-eyebrow px-3 pb-1.5 pt-4 text-primary first:pt-1">{header}</div>}
						<PaletteRow row={row} index={i} active={i === active} onHover={() => setActive(i)} />
					</div>
				);
			})}
		</div>
	);
}

/** Rows are listbox options, not links (they hold artist links): open a new tab the way a link would. */
function openInNewTab(href: string) {
	window.open(href, "_blank", "noopener");
}

function PaletteRow({ row, index, active, onHover }: { row: Row; index: number; active: boolean; onHover: () => void }) {
	const Icon = row.icon;
	return (
		<div
			data-row={index}
			role="option"
			aria-selected={active}
			onMouseMove={onHover}
			onClick={(e) => {
				if (row.href && !isPlainClick(e)) openInNewTab(row.href);
				else row.onSelect();
			}}
			onAuxClick={(e) => {
				if (e.button !== 1 || !row.href) return;
				e.preventDefault();
				openInNewTab(row.href);
			}}
			className="relative flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2"
		>
			{active && (
				<motion.span layoutId="palette-active-row" className="absolute inset-0 rounded-2xl bg-secondary" transition={{ type: "spring", stiffness: 600, damping: 42 }} />
			)}
			<span className="relative shrink-0">
				{row.cover !== undefined ? (
					<CoverImage src={row.cover} className={cn("size-11 rounded-xl", row.round && "rounded-full")} />
				) : Icon ? (
					<span className={cn("flex size-11 items-center justify-center rounded-xl transition-colors", active ? "bg-primary text-primary-foreground" : "bg-surface-high text-primary")}>
						<Icon className="size-5" />
					</span>
				) : null}
			</span>
			<span className="relative min-w-0 flex-1">
				<span className={cn("block truncate text-sm font-medium", active ? "text-secondary-foreground" : "text-foreground")}>{row.title}</span>
				{row.subtitle && <span className={cn("block truncate text-xs", active ? "text-secondary-foreground/75" : "text-muted-foreground")}>{row.subtitle}</span>}
			</span>
			<span className="relative flex shrink-0 items-center gap-0.5">
				{row.onPlayNext && (
					<RowAction label="Play next" onClick={row.onPlayNext} visible={active}>
						<ListStart className="size-4" />
					</RowAction>
				)}
				{row.onQueue && (
					<RowAction label="Add to queue" onClick={row.onQueue} visible={active}>
						<ListEnd className="size-4" />
					</RowAction>
				)}
				{row.onDownload && (
					<RowAction label="Download" onClick={row.onDownload} visible={active}>
						<DownloadGlyph />
					</RowAction>
				)}
				{active && row.hint && (
					<motion.span initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} className="ml-1 hidden h-6 items-center gap-1 rounded-full bg-surface-lowest/60 px-2 text-[11px] font-semibold text-secondary-foreground sm:flex">
						{row.hint}
						<CornerDownLeft className="size-3" />
					</motion.span>
				)}
			</span>
		</div>
	);
}

function RowAction({ label, onClick, visible, children }: { label: string; onClick: () => void; visible: boolean; children: React.ReactNode }) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			className={cn(
				"flex size-9 items-center justify-center rounded-full text-muted-foreground transition-[opacity,background-color,transform] hover:bg-surface-lowest/70 hover:text-foreground active:scale-90",
				visible ? "opacity-100" : "opacity-100 sm:opacity-0"
			)}
		>
			{children}
		</button>
	);
}

// ─── Downloads view ─────────────────────────────────────────────────────────

function DownloadsView({ items }: { items: DownloadItem[] }) {
	const clearFinished = useDownloadStore((s) => s.clearFinished);
	const hasFinished = items.some((i) => i.status !== "queued" && i.status !== "downloading");

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
				<motion.div
					initial={{ scale: 0.6, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 14 }}
					className="bg-tonal-gradient flex size-16 items-center justify-center rounded-full text-on-primary-container shadow-[0_0_32px_2px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
				>
					<DownloadGlyph className="size-7" />
				</motion.div>
				<div>
					<p className="text-lg font-semibold tracking-tight">No downloads yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Search a track and press <kbd className="kbd">⇧</kbd> <kbd className="kbd">↵</kbd>, or paste an album link.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-2">
			<div className="flex items-center justify-between px-2.5 pb-1 pt-1">
				<span className="type-eyebrow text-primary">{items.length} item{items.length === 1 ? "" : "s"}</span>
				{hasFinished && (
					<button type="button" onClick={clearFinished} className="h-8 rounded-full px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-95">
						Clear finished
					</button>
				)}
			</div>
			<motion.ul layout className="space-y-0.5">
				<AnimatePresence initial={false}>
					{items.map((item) => (
						<DownloadRow key={item.id} item={item} />
					))}
				</AnimatePresence>
			</motion.ul>
		</div>
	);
}

function formatBytes(n: number) {
	if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function DownloadRow({ item }: { item: DownloadItem }) {
	const close = useCommandStore((s) => s.close);
	const cancel = useDownloadStore((s) => s.cancel);
	const retry = useDownloadStore((s) => s.retry);
	const remove = useDownloadStore((s) => s.remove);
	const pct = item.total ? item.loaded / item.total : 0;

	let status: React.ReactNode;
	switch (item.status) {
		case "queued":
			status = "Queued";
			break;
		case "downloading":
			status = item.total ? `${Math.round(pct * 100)}% · ${formatBytes(item.loaded)} of ${formatBytes(item.total)}` : item.loaded ? formatBytes(item.loaded) : "Starting…";
			break;
		case "done":
			status = <span className="text-success">Saved to your device</span>;
			break;
		case "error":
			status = <span className="text-destructive">{item.error ?? "Failed"}</span>;
			break;
		case "canceled":
			status = "Canceled";
			break;
	}

	return (
		<motion.li
			layout
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: "auto" }}
			exit={{ opacity: 0, height: 0 }}
			transition={{ type: "spring", stiffness: 500, damping: 40 }}
			className="group flex items-center gap-3 overflow-hidden rounded-2xl px-2.5 py-2 transition-colors hover:bg-surface-high"
		>
			<span className="relative shrink-0">
				<CoverImage src={item.cover ?? null} className="size-11 rounded-xl" />
				<span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-surface-container ring-2 ring-surface-container">
					{item.status === "downloading" ? (
						item.total ? (
							<ProgressRing value={pct} size={16} stroke={2} className="text-highlight" />
						) : (
							<Spinner size={12} className="text-highlight" />
						)
					) : item.status === "done" ? (
						<DrawCheck className="size-3 text-success" />
					) : item.status === "queued" ? (
						<span className="size-1.5 rounded-full bg-muted-foreground/50" />
					) : (
						<X className="size-3 text-destructive" />
					)}
				</span>
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-sm font-medium">{item.title}</span>
				<span className="block truncate text-xs text-muted-foreground">
					<ArtistLink name={item.artist} onClick={close} className="transition-colors hover:text-foreground" />
					{item.group ? ` · ${item.group}` : ""}
				</span>
				<span className="block truncate font-mono text-[11px] tabular-nums text-muted-foreground">{status}</span>
				{item.status === "downloading" && (
					<span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-primary/15">
						<motion.span
							className="block h-full rounded-full bg-primary"
							initial={false}
							animate={item.total ? { width: `${pct * 100}%`, x: 0 } : { width: "30%", x: ["-100%", "330%"] }}
							transition={item.total ? { type: "spring", stiffness: 120, damping: 24 } : { repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
						/>
					</span>
				)}
			</span>
			<span className="flex shrink-0 items-center gap-0.5">
				{(item.status === "error" || item.status === "canceled") && (
					<IconBtn label="Retry" onClick={() => retry(item.id)}>
						<RotateCw className="size-3.5" />
					</IconBtn>
				)}
				{item.status === "queued" || item.status === "downloading" ? (
					<IconBtn label="Cancel" onClick={() => cancel(item.id)}>
						<X className="size-3.5" />
					</IconBtn>
				) : (
					<IconBtn label="Remove" onClick={() => remove(item.id)}>
						<X className="size-3.5" />
					</IconBtn>
				)}
			</span>
		</motion.li>
	);
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
	return (
		<button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[background-color,transform] hover:bg-surface-highest hover:text-foreground active:scale-90">
			{children}
		</button>
	);
}

/** Header trigger — looks like a search field, opens the palette. */
export function CommandTrigger({ className }: { className?: string }) {
	const open = useCommandStore((s) => s.open);
	const items = useDownloadStore((s) => s.items);
	const activeCount = selectActiveCount(items);
	const overall = selectOverallProgress(items);

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<button
				type="button"
				onClick={() => open()}
				aria-label="Search and download (Command K)"
				className="group flex h-9 w-full items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:bg-muted sm:w-72"
			>
				<SearchGlyph className="size-4" />
				<span className="flex-1 truncate text-left">Search or paste a link…</span>
				<span className="hidden items-center gap-0.5 sm:flex">
					<ModKey />
					<kbd className="kbd">K</kbd>
				</span>
			</button>
			<AnimatePresence>
				{items.length > 0 && (
					<motion.button
						type="button"
						initial={{ opacity: 0, scale: 0.6, width: 0 }}
						animate={{ opacity: 1, scale: 1, width: 44 }}
						exit={{ opacity: 0, scale: 0.6, width: 0 }}
						onClick={() => open(undefined, "downloads")}
						aria-label={activeCount > 0 ? `${activeCount} downloads in progress` : "Downloads"}
						title="Downloads"
						className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-high text-muted-foreground transition-colors hover:bg-surface-highest hover:text-foreground"
					>
						{activeCount > 0 ? (
							<ProgressRing value={overall ?? 0} size={22} stroke={2} className="text-highlight">
								<DownloadGlyph active className="size-3 text-foreground" />
							</ProgressRing>
						) : (
							<DownloadGlyph className="size-4" />
						)}
					</motion.button>
				)}
			</AnimatePresence>
		</div>
	);
}


/** ⌘ on Apple platforms, Ctrl elsewhere (⌘ during SSR, corrected after hydration). */
export function ModKey() {
	const isMac = useSyncExternalStore(noopSubscribe, () => /Mac|iPhone|iPad/.test(navigator.platform), () => true);
	return <kbd className="kbd">{isMac ? "⌘" : "Ctrl"}</kbd>;
}
