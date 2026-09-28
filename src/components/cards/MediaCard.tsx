"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoverImage } from "@/components/ui/cover-image";
import { DownloadGlyph, PlayPauseIcon, Spinner } from "@/components/motion/icons";
import { fetchCollection, type CollectionType } from "@/lib/collection-tracks";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useDownloadStore } from "@/stores/useDownloadStore";
import { useAuthStore } from "@/stores/useAuthStore";

/** Play / download a Deezer album or playlist without opening it. */
export function useCollectionActions() {
	const playQueue = usePlayerStore((s) => s.playQueue);
	const enqueue = useDownloadStore((s) => s.enqueue);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const [busy, setBusy] = useState<"play" | "download" | null>(null);

	const load = async (type: CollectionType, id: string) => {
		try {
			return await fetchCollection(type, id);
		} catch {
			toast.error(`Couldn't load this ${type}`);
			return null;
		}
	};

	const play = async (type: CollectionType, id: string) => {
		setBusy("play");
		const info = await load(type, id);
		setBusy(null);
		if (!info || info.tracks.length === 0) return;
		playQueue(
			info.tracks.map((t) => ({
				trackId: t.trackId,
				title: t.title,
				artist: t.artist,
				artistId: t.artistId ?? null,
				cover: t.cover,
				duration: t.duration ?? null,
			})),
			0
		);
	};

	const download = async (type: CollectionType, id: string) => {
		if (!isAuthenticated) {
			toast("Sign in to download");
			return;
		}
		setBusy("download");
		const info = await load(type, id);
		setBusy(null);
		if (!info) return;
		const n = enqueue(info.tracks, `${type === "album" ? "Album" : "Playlist"} · ${info.title}`);
		toast.success(n ? `Downloading ${n} tracks` : "Already in your downloads", { description: info.title });
	};

	return { play, download, busy };
}

export interface MediaCardProps {
	href: string;
	title: string;
	subtitle?: React.ReactNode;
	cover?: string | null;
	/** Up to four covers render as a mosaic (user playlists). */
	covers?: string[];
	round?: boolean;
	badge?: React.ReactNode;
	/** Deezer collection → enables hover Play + Download. */
	collection?: { type: CollectionType; id: string };
	index?: number;
}

export function MediaCard({ href, title, subtitle, cover, covers, round, badge, collection, index = 0 }: MediaCardProps) {
	const { play, download, busy } = useCollectionActions();
	const mosaic = covers && covers.length >= 4 ? covers.slice(0, 4) : null;
	const single = cover ?? covers?.[0] ?? null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.03, ease: [0.22, 1, 0.36, 1] }}
			className="group relative"
		>
			<div className={cn("relative aspect-square overflow-hidden bg-muted", round ? "rounded-full" : "rounded-lg")}>
				<Link href={href} aria-label={title} className="absolute inset-0 block">
					{mosaic ? (
						<div className="grid h-full w-full grid-cols-2 grid-rows-2 transition-transform duration-500 group-hover:scale-[1.03]">
							{mosaic.map((src, i) => (
								<CoverImage key={i} src={src} loading="lazy" className="h-full w-full rounded-none" />
							))}
						</div>
					) : single ? (
						<CoverImage
							src={single}
							alt={title}
							loading="lazy"
							className={cn("h-full w-full transition-transform duration-500 group-hover:scale-[1.03]", round ? "rounded-full" : "rounded-lg")}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
							<Music className="size-10" />
						</div>
					)}
				</Link>
				<div className={cn("pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5", round ? "rounded-full" : "rounded-lg")} />
				{badge && <div className="pointer-events-none absolute left-2 top-2">{badge}</div>}
				{collection && (
					<div className="absolute bottom-2 right-2 flex translate-y-2 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 max-sm:hidden">
						<button
							type="button"
							aria-label={`Download ${title}`}
							title="Download"
							onClick={() => void download(collection.type, collection.id)}
							className="glass flex size-9 items-center justify-center rounded-full border border-border text-foreground shadow-sm transition-transform hover:scale-105"
						>
							{busy === "download" ? <Spinner size={14} /> : <DownloadGlyph />}
						</button>
						<button
							type="button"
							aria-label={`Play ${title}`}
							title="Play"
							onClick={() => void play(collection.type, collection.id)}
							className="flex size-9 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-transform hover:scale-105"
						>
							{busy === "play" ? <Spinner size={14} /> : <PlayPauseIcon playing={false} className="size-4" />}
						</button>
					</div>
				)}
			</div>
			<Link href={href} className={cn("mt-2.5 block min-w-0 no-underline", round && "text-center")}>
				<p className="truncate text-sm font-medium text-foreground">{title}</p>
				{subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
			</Link>
		</motion.div>
	);
}

export function CardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={cn("grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5", className)}>{children}</div>
	);
}

export function SectionHeader({
	title,
	count,
	action,
}: {
	title: string;
	count?: number | string;
	action?: React.ReactNode;
}) {
	return (
		<div className="mb-4 flex items-baseline justify-between gap-3">
			<div className="flex items-baseline gap-2">
				<h2 className="text-base font-semibold tracking-tight">{title}</h2>
				{count !== undefined && <span className="font-mono text-xs tabular-nums text-muted-foreground">{count}</span>}
			</div>
			{action}
		</div>
	);
}
