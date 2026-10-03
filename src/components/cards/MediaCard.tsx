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
import { SectionTitle } from "@/components/expressive/Section";

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
				album: t.album ?? null,
				albumId: t.albumId ?? null,
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
	const shape = round ? "rounded-full" : "rounded-xl";

	return (
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "0px 0px -20px 0px" }}
			whileTap={{ scale: 0.96 }}
			transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.035, ease: [0.05, 0.7, 0.1, 1] }}
			className="group relative rounded-2xl p-1.5 transition-colors duration-300 hover:bg-surface-high/70"
		>
			<div className={cn("relative aspect-square overflow-hidden bg-surface-highest shadow-[0_4px_14px_-6px_rgb(0_0_0/0.35)] transition-shadow duration-300 group-hover:shadow-[0_10px_24px_-8px_rgb(0_0_0/0.45)]", shape)}>
				<Link href={href} aria-label={title} className="absolute inset-0 block">
					{mosaic ? (
						<div className="grid h-full w-full grid-cols-2 grid-rows-2 transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.05]">
							{mosaic.map((src, i) => (
								<CoverImage key={i} src={src} loading="lazy" className="h-full w-full rounded-none" />
							))}
						</div>
					) : single ? (
						<CoverImage
							src={single}
							alt={title}
							loading="lazy"
							className={cn("h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.05]", shape)}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
							<Music className="size-10" />
						</div>
					)}
				</Link>
				{badge && <div className="pointer-events-none absolute right-2 top-2">{badge}</div>}
				{collection && (
					<div className="absolute bottom-2 right-2 flex translate-y-3 items-center gap-1.5 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 max-sm:hidden">
						<button
							type="button"
							aria-label={`Download ${title}`}
							title="Download"
							onClick={() => void download(collection.type, collection.id)}
							className="flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-90"
						>
							{busy === "download" ? <Spinner size={14} /> : <DownloadGlyph />}
						</button>
						<button
							type="button"
							aria-label={`Play ${title}`}
							title="Play"
							onClick={() => void play(collection.type, collection.id)}
							className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--primary)_60%,transparent)] transition-transform hover:scale-105 active:scale-90"
						>
							{busy === "play" ? <Spinner size={14} /> : <PlayPauseIcon playing={false} className="size-5" />}
						</button>
					</div>
				)}
			</div>
			{typeof subtitle === "string" || !subtitle ? (
				<Link href={href} className={cn("mt-2 block min-w-0 px-0.5 no-underline", round && "text-center")}>
					<p className="truncate text-sm font-semibold text-foreground">{title}</p>
					{subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
				</Link>
			) : (
				// A rich subtitle carries its own links (artist names) — it can't sit inside the card link.
				<div className={cn("mt-2 min-w-0 px-0.5", round && "text-center")}>
					<Link href={href} className="block truncate text-sm font-semibold text-foreground no-underline">
						{title}
					</Link>
					<p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
				</div>
			)}
		</motion.div>
	);
}

export function CardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={cn("-mx-1.5 grid grid-cols-2 gap-x-1 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6", className)}>{children}</div>
	);
}

/** Section heading (delegates to the expressive `SectionTitle`). */
export function SectionHeader({
	title,
	count,
	action,
	eyebrow,
}: {
	title: string;
	count?: number | string;
	action?: React.ReactNode;
	eyebrow?: string;
}) {
	return <SectionTitle title={title} eyebrow={eyebrow} count={typeof count === "number" ? count : count != null ? Number(count) || null : null} action={action} className="mt-0" />;
}
