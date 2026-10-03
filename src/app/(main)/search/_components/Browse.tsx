"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	AudioWaveform,
	Coffee,
	Dices,
	Flame,
	Globe,
	Heart,
	History,
	Martini,
	MicVocal,
	Piano,
	Sparkles,
	Star,
	Sun,
	X,
	Zap,
	type LucideIcon,
} from "lucide-react";
import { fetchData } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { useDiscover } from "@/hooks/useDiscover";
import { Art, ArtworkWall, Aurora, DUR, EASE, QuickTile, SectionTitle, coverThemeStyle, entrance, heroPrimaryButton, type Palette } from "@/components/expressive";
import { GENRES, randomGenre, seedFromHex, type GenreGlyph } from "../_lib/search-model";
import { recentSearches, useRecentSearches } from "../_lib/useRecentSearches";
import { useMediaQuery } from "./bits";

const GLYPHS: Record<GenreGlyph, LucideIcon> = {
	star: Star,
	mic: MicVocal,
	zap: Zap,
	wave: AudioWaveform,
	heart: Heart,
	martini: Martini,
	globe: Globe,
	coffee: Coffee,
	piano: Piano,
	sun: Sun,
	sparkles: Sparkles,
	flame: Flame,
};

const SPOTLIGHT: Palette = { base: "#14102e", lights: ["#38bdf8", "#818cf8", "#f472b6"] };

interface RecentPlay {
	trackId: string;
	title: string;
	artist: string;
	artistId?: string | null;
	coverUrl: string | null;
	duration: number | null;
}

/** The idle page: spotlight hero, recent searches, jump back in, genres. */
export function Browse({ onSearch }: { onSearch: (term: string) => void }) {
	return (
		<div>
			<Spotlight onSearch={onSearch} />
			<RecentSearches onSearch={onSearch} />
			<JumpBackIn />
			<SectionTitle eyebrow="Moods & genres" title="Browse all" />
			<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
				{GENRES.map((g, i) => (
					<GenreTile key={g.name} index={i} name={g.name} icon={GLYPHS[g.glyph]} seed={g.seed} onTap={onSearch} />
				))}
			</div>
		</div>
	);
}

/** Aurora + drifting wall of fresh covers, with a "Surprise me" shortcut. */
function Spotlight({ onSearch }: { onSearch: (term: string) => void }) {
	const { showcase } = useDiscover();
	const wide = useMediaQuery("(min-width: 768px)");
	return (
		<motion.section
			{...entrance(0)}
			className="relative isolate h-[196px] overflow-hidden rounded-[28px] text-white sm:h-[240px] lg:h-[280px]"
			style={{ boxShadow: "0 12px 28px -8px rgb(129 140 248 / 0.32)", ["--hero-base" as string]: SPOTLIGHT.base }}
		>
			<Aurora palette={SPOTLIGHT} className="-z-10" />
			<AnimatePresence>
				{showcase.length >= 8 && (
					<motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DUR.long * 2 }} className="absolute inset-0 -z-10">
						<ArtworkWall urls={showcase} columns={wide ? 12 : 6} period={70} />
						<div
							className="absolute inset-0"
							style={{ background: `linear-gradient(to left, color-mix(in srgb, ${SPOTLIGHT.base} 25%, transparent), color-mix(in srgb, ${SPOTLIGHT.base} 92%, transparent) 78%)` }}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<div className="relative flex h-full flex-col justify-end p-5 sm:p-8 lg:p-10">
				<h2 className="type-display text-[1.75rem] leading-[1.05] text-white sm:text-5xl lg:text-6xl">
					<span className="block">Find your next</span>
					{/* w-fit: the gradient spans the word, not the whole card. */}
					<span className="brand-text block w-fit pb-[0.08em]">obsession.</span>
				</h2>
				<motion.button
					type="button"
					whileTap={{ scale: 0.95 }}
					onClick={() => onSearch(randomGenre())}
					className={`${heroPrimaryButton} group mt-4 self-start sm:mt-6`}
				>
					<Dices className="transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:rotate-[200deg]" />
					Surprise me
				</motion.button>
			</div>
		</motion.section>
	);
}

function RecentSearches({ onSearch }: { onSearch: (term: string) => void }) {
	const recent = useRecentSearches();
	return (
		<AnimatePresence initial={false}>
			{recent.length > 0 && (
				<motion.section
					key="recent"
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: DUR.medium, ease: EASE.emphasized }}
					className="overflow-hidden"
				>
					<SectionTitle
						title="Recent searches"
						action={
							<motion.button
								type="button"
								whileTap={{ scale: 0.94 }}
								onClick={recentSearches.clear}
								className="inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
							>
								Clear
							</motion.button>
						}
					/>
					<div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
						<AnimatePresence initial={false} mode="popLayout">
							{recent.map((term, i) => (
								<motion.div
									key={term}
									layout
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04, duration: 0.3, ease: EASE.decelerate } }}
									exit={{ opacity: 0, scale: 0.8 }}
									whileTap={{ scale: 0.95 }}
									className="flex h-10 shrink-0 items-center rounded-full bg-surface-high transition-colors hover:bg-surface-highest"
								>
									<button type="button" onClick={() => onSearch(term)} className="flex h-full items-center gap-2 rounded-full pl-3 pr-1 text-sm font-medium">
										<History className="size-[18px] text-primary" />
										<span className="max-w-[14rem] truncate">{term}</span>
									</button>
									<button
										type="button"
										aria-label={`Remove “${term}”`}
										onClick={() => recentSearches.remove(term)}
										className="mr-1 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
									>
										<X className="size-4" />
									</button>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</motion.section>
			)}
		</AnimatePresence>
	);
}

/** Signed-in only: the last few plays as quick tiles. */
function JumpBackIn() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const [plays, setPlays] = useState<RecentPlay[]>([]);
	const current = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const play = usePlayerStore((s) => s.play);
	const toggle = usePlayerStore((s) => s.toggle);

	useEffect(() => {
		if (!isAuthenticated) return;
		let live = true;
		fetchData("recent-plays", { limit: "12" })
			.then((d: { items?: RecentPlay[] }) => live && setPlays(d?.items ?? []))
			.catch(() => {});
		return () => {
			live = false;
		};
	}, [isAuthenticated]);

	const tracks = useMemo<PlayerTrack[]>(() => {
		const seen = new Set<string>();
		return plays
			.filter((p) => (seen.has(p.trackId) ? false : (seen.add(p.trackId), true)))
			.slice(0, 6)
			.map((p) => ({ trackId: p.trackId, title: p.title, artist: p.artist, artistId: p.artistId ?? null, cover: p.coverUrl, duration: p.duration }));
	}, [plays]);

	if (!isAuthenticated || tracks.length === 0) return null;
	return (
		<section>
			<SectionTitle eyebrow="Recently played" title="Jump back in" />
			<div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
				{tracks.map((t, i) => (
					<QuickTile
						key={t.trackId}
						index={i}
						title={t.title}
						subtitle={t.artist}
						art={<Art src={t.cover} className="size-full" size={120} />}
						current={current?.trackId === t.trackId}
						playing={isPlaying}
						onClick={() => (current?.trackId === t.trackId ? toggle() : play(t, tracks))}
					/>
				))}
			</div>
		</section>
	);
}

/** Genre tile on its seed's tonal gradient; the glyph straightens on press. */
function GenreTile({ name, icon: Icon, seed, index, onTap }: { name: string; icon: LucideIcon; seed: string; index: number; onTap: (term: string) => void }) {
	const style = useMemo(() => coverThemeStyle(seedFromHex(seed)), [seed]);
	return (
		<motion.div {...entrance(index + 2, 12)}>
			<motion.button
				type="button"
				initial="rest"
				animate="rest"
				whileHover="hover"
				whileTap="press"
				variants={{ rest: { scale: 1 }, hover: { scale: 1 }, press: { scale: 0.95 } }}
				transition={{ type: "spring", stiffness: 600, damping: 22 }}
				onClick={() => onTap(name)}
				aria-label={`Search ${name}`}
				className="cover-theme relative block h-[108px] w-full overflow-hidden rounded-[20px] text-left shadow-[0_2px_8px_-4px_rgb(0_0_0/0.25)] outline-none transition-shadow duration-300 hover:shadow-[0_10px_24px_-10px_color-mix(in_oklch,var(--m3-primary)_60%,transparent)] focus-visible:ring-4 focus-visible:ring-ring/50 lg:h-[124px]"
				style={{ ...style, backgroundImage: "linear-gradient(135deg, var(--m3-primary-container), var(--m3-tertiary-container))" }}
			>
				<motion.span
					aria-hidden
					className="absolute -bottom-4 -right-3 text-primary/40"
					variants={{ rest: { rotate: 21.6, scale: 1 }, hover: { rotate: 8, scale: 1.06 }, press: { rotate: 0, scale: 1.12 } }}
					transition={{ type: "spring", stiffness: 380, damping: 14 }}
				>
					<Icon className="size-[92px]" strokeWidth={1.75} />
				</motion.span>
				<span className="relative block p-4 text-[1.375rem] font-semibold leading-tight tracking-[-0.02em] text-on-primary-container">{name}</span>
			</motion.button>
		</motion.div>
	);
}
