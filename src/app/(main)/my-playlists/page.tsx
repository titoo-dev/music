"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Download, ListMusic, LogIn, Music, Plus, Trash2 } from "lucide-react";
import { fetchData, postToServer } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";
import { CardGrid, MediaCard } from "@/components/cards/MediaCard";
import { ArtworkWall, Count, Medallion, entrance, swap } from "@/components/expressive";
import { ImportSpotifyDialog } from "@/components/playlists/ImportSpotifyDialog";
import { DeletePlaylistDialog, PlaylistEditDialog, filledButton, tonalButton } from "@/components/playlists/PlaylistDialogs";
import { CardGridSkeleton, NewPlaylistTile } from "@/components/playlists/PlaylistTiles";
import { plural, uniqueCovers } from "@/components/playlists/format";

interface PlaylistItem {
	id: string;
	title: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	_count: { tracks: number };
	covers?: string[];
}

/** Tonal stat pill (primaryContainer / tertiaryContainer). */
function StatusPill({ icon: Icon, value, label, tone }: { icon: typeof Music; value: number | null; label: string; tone: "primary" | "tertiary" }) {
	return (
		<span
			className={cn(
				"inline-flex h-8 items-center gap-1.5 rounded-full pl-2.5 pr-3.5 text-sm font-semibold",
				tone === "primary" ? "bg-primary-container text-on-primary-container" : "bg-tertiary-container text-on-tertiary-container"
			)}
		>
			<Icon className="size-4" strokeWidth={2.25} />
			{value == null ? "–" : <Count value={value} className="font-semibold" />}
			<span className="opacity-85">{label}</span>
		</span>
	);
}

/** Artwork wall veiled by the surface, eyebrow, display title, pills, actions. */
function PlaylistsHero({
	covers,
	playlists,
	tracks,
	onCreate,
	onImport,
	createRef,
}: {
	covers: string[];
	playlists: number | null;
	tracks: number | null;
	onCreate: () => void;
	onImport: () => void;
	createRef: React.Ref<HTMLButtonElement>;
}) {
	return (
		<div className="relative mx-[calc(50%-50vw)] -mt-[calc(var(--header-h)+24px)] sm:-mt-[calc(var(--header-h)+32px)] px-[calc(50vw-50%)] pt-[calc(var(--header-h)+24px)] sm:pt-[calc(var(--header-h)+32px)]">
			<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
				<AnimatePresence>
					{covers.length > 0 && (
						<motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }} className="absolute inset-0">
							<ArtworkWall urls={covers} columns={7} tilt={-14} period={90} />
							{/* A surface veil, not an opacity layer: the wall keeps compositing cheaply. */}
							<div className="absolute inset-0 bg-background/[0.62] dark:bg-background/50" />
						</motion.div>
					)}
				</AnimatePresence>
				<div className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_80%_at_0%_0%,color-mix(in_srgb,var(--brand-indigo)_22%,transparent),transparent_70%)]" />
				<div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--background)_10%,transparent),color-mix(in_srgb,var(--background)_65%,transparent)_55%,var(--background)_92%)]" />
			</div>

			<div className="relative flex min-h-[220px] flex-col gap-5 pb-6 pt-10 sm:min-h-[280px] md:flex-row md:items-end md:justify-between">
				<div className="min-w-0">
					<motion.p {...entrance(0, 10)} className="type-eyebrow tracking-[0.2em] text-primary">
						Your mixes
					</motion.p>
					<motion.h1 {...entrance(1)} className="type-display mt-2 text-[2.75rem] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
						Playlists
					</motion.h1>
					<motion.div {...entrance(2, 8)} className="mt-4 flex flex-wrap gap-2">
						<StatusPill icon={ListMusic} value={playlists} label={playlists === 1 ? "playlist" : "playlists"} tone="primary" />
						<StatusPill icon={Music} value={tracks} label={tracks === 1 ? "track" : "tracks"} tone="tertiary" />
					</motion.div>
				</div>
				<motion.div {...entrance(3, 8)} className={cn("flex flex-wrap gap-2", playlists === 0 && "hidden")}>
					<button type="button" onClick={onImport} className={cn(tonalButton, "h-11")}>
						<Download />
						Import from Spotify
					</button>
					<button ref={createRef} type="button" onClick={onCreate} className={cn(filledButton, "h-11")}>
						<Plus />
						New playlist
					</button>
				</motion.div>
			</div>
		</div>
	);
}

/**
 * Extended FAB "New playlist": shows once the hero's button has scrolled
 * away; folds to an icon while scrolling down, unfolds scrolling up.
 */
function NewPlaylistFab({ visible, onClick }: { visible: boolean; onClick: () => void }) {
	const [extended, setExtended] = useState(true);
	useEffect(() => {
		let last = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			if (Math.abs(y - last) < 8) return;
			setExtended(y < last);
			last = y;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	return (
		<AnimatePresence>
			{visible && (
				<motion.button
					type="button"
					aria-label="New playlist"
					onClick={onClick}
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0, opacity: 0 }}
					whileTap={{ scale: 0.92 }}
					transition={{ type: "spring", stiffness: 420, damping: 24 }}
					className="fixed bottom-[calc(var(--player-offset)+var(--player-h)+16px)] right-4 z-30 flex h-14 items-center rounded-2xl bg-primary-container px-4 text-on-primary-container shadow-[0_8px_24px_-6px_color-mix(in_srgb,var(--primary)_55%,transparent),0_2px_6px_rgb(0_0_0/0.18)] transition-colors hover:bg-primary-container/90 sm:right-6 lg:right-8"
				>
					<Plus className="size-6 shrink-0" />
					<motion.span
						initial={false}
						animate={{ width: extended ? "auto" : 0, opacity: extended ? 1 : 0, marginLeft: extended ? 12 : 0 }}
						transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
						className="overflow-hidden whitespace-nowrap text-sm font-semibold"
					>
						New playlist
					</motion.span>
				</motion.button>
			)}
		</AnimatePresence>
	);
}

export default function MyPlaylistsPage() {
	const router = useRouter();
	const [list, setList] = useState<PlaylistItem[] | null>(null);
	const [creating, setCreating] = useState(false);
	const [importing, setImporting] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<PlaylistItem | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [fab, setFab] = useState(false);
	const createRef = useRef<HTMLButtonElement>(null);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const authLoading = useAuthStore((s) => s.isLoading);
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const stopPlayer = usePlayerStore((s) => s.stop);

	const loadPlaylists = useCallback(
		() =>
			fetchData("playlists")
				.then((data) => setList(data || []))
				.catch(() => setList((prev) => prev ?? [])),
		[]
	);

	useEffect(() => {
		if (isAuthenticated) void loadPlaylists();
	}, [isAuthenticated, loadPlaylists]);

	const loading = isAuthenticated && list === null;
	const playlists = useMemo(() => list ?? [], [list]);

	// The FAB takes over once the hero's "New playlist" button is off screen.
	useEffect(() => {
		const el = createRef.current;
		if (!el) return;
		const io = new IntersectionObserver(([e]) => setFab(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-64px 0px 0px 0px" });
		io.observe(el);
		return () => io.disconnect();
	}, [isAuthenticated, loading]);

	const covers = useMemo(() => uniqueCovers([playlists.flatMap((p) => p.covers ?? [])], 30), [playlists]);
	const totalTracks = useMemo(() => playlists.reduce((n, p) => n + (p._count?.tracks ?? 0), 0), [playlists]);

	const handleCreate = async ({ title, description }: { title: string; description: string | null }) => {
		const p = (await postToServer("playlists", { title, description })) as PlaylistItem;
		router.push(`/my-playlists/${p.id}`);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		// Stop player in case it's playing a track from this playlist
		if (currentPlayerTrack) {
			stopPlayer();
		}
		try {
			await fetch(`/api/v1/playlists/${deleteTarget.id}`, { method: "DELETE" });
			setList((prev) => (prev ?? []).filter((p) => p.id !== deleteTarget.id));
		} catch {
			// ignore
		}
	};

	if (authLoading && !isAuthenticated) {
		return (
			<div>
				<PlaylistsHero covers={[]} playlists={null} tracks={null} onCreate={() => {}} onImport={() => {}} createRef={createRef} />
				<CardGridSkeleton count={10} />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<Medallion
				className="pt-[12vh]"
				icon={ListMusic}
				title="Your playlists"
				message="Sign in to create playlists and import them from Spotify."
				action={
					<Link href="/login" className={filledButton}>
						<LogIn />
						Sign in
					</Link>
				}
			/>
		);
	}

	return (
		<div>
			<PlaylistsHero
				covers={covers}
				playlists={loading ? null : playlists.length}
				tracks={loading ? null : totalTracks}
				onCreate={() => setCreating(true)}
				onImport={() => setImporting(true)}
				createRef={createRef}
			/>

			<AnimatePresence mode="wait" initial={false}>
				<motion.div key={loading ? "loading" : playlists.length === 0 ? "empty" : "grid"} variants={swap} initial="initial" animate="animate" exit="exit">
					{loading ? (
						<CardGridSkeleton count={10} />
					) : playlists.length === 0 ? (
						<Medallion
							icon={ListMusic}
							title="No playlists yet"
							message="Create one, or bring your playlists over from Spotify."
							action={
								<>
									<button type="button" className={filledButton} onClick={() => setCreating(true)}>
										<Plus />
										New playlist
									</button>
									<button type="button" className={tonalButton} onClick={() => setImporting(true)}>
										<Download />
										Import from Spotify
									</button>
								</>
							}
						/>
					) : (
						<CardGrid>
							<NewPlaylistTile onClick={() => setCreating(true)} />
							<AnimatePresence initial={false}>
								{playlists.map((pl, i) => (
									<motion.div key={pl.id} layout exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }} className="group/pl relative min-w-0">
										<MediaCard index={i + 1} href={`/my-playlists/${pl.id}`} title={pl.title} subtitle={plural(pl._count.tracks, "track")} covers={pl.covers} />
										<button
											type="button"
											aria-label={`Delete ${pl.title}`}
											title="Delete playlist"
											onClick={() => {
												setDeleteTarget(pl);
												setDeleteOpen(true);
											}}
											className="absolute right-3.5 top-3.5 z-10 flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-[opacity,transform,background-color] hover:bg-destructive active:scale-90 focus-visible:opacity-100 md:opacity-0 md:[@media(hover:hover)]:group-hover/pl:opacity-100"
										>
											<Trash2 className="size-4" aria-hidden />
										</button>
									</motion.div>
								))}
							</AnimatePresence>
						</CardGrid>
					)}
				</motion.div>
			</AnimatePresence>

			<NewPlaylistFab visible={fab && !loading && playlists.length > 0} onClick={() => setCreating(true)} />

			<PlaylistEditDialog open={creating} onOpenChange={setCreating} mode="create" onSubmit={handleCreate} />
			<ImportSpotifyDialog open={importing} onOpenChange={setImporting} onImported={loadPlaylists} />
			<DeletePlaylistDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={deleteTarget?.title ?? ""}
				trackCount={deleteTarget?._count.tracks ?? 0}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
