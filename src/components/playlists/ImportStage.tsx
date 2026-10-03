"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { AlertTriangle, Check, Layers, ListMusic, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aurora, ArtworkWall, GlassPill, HeroTitle, M3_SPRING, type Palette } from "@/components/expressive";
import { LogoMark } from "@/components/motion/icons";
import { WavyProgress } from "@/components/motion/WavyProgress";
import { MAX_IMPORT_TRACKS, type ImportResult } from "@/lib/spotify/import";
import type { ImportSubject } from "@/lib/spotify/import-run";
import type { ReadProgress } from "@/lib/spotify/read-links";
import type { ImportPhase } from "@/stores/useSpotifyImportStore";

/** Night green: Spotify's colour drifting into the brand's sky and indigo. */
export const SPOTIFY_NIGHT: Palette = { base: "#03170c", lights: ["#1ed760", "#0ea5e9", "#818cf8"] };
const SPOTIFY_GREEN = "#1ed760";

const fmt = (n: number) => n.toLocaleString("en");

export function SpotifyGlyph({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden className={className}>
			<circle cx="12" cy="12" r="12" fill={SPOTIFY_GREEN} />
			<g fill="none" stroke="#03170c" strokeLinecap="round">
				<path d="M6.2 9.2c3.9-1.2 8.3-.9 11.7 1" strokeWidth="1.9" />
				<path d="M6.9 12.4c3.2-.9 6.7-.6 9.5 1" strokeWidth="1.6" />
				<path d="M7.5 15.4c2.6-.7 5.2-.4 7.4.8" strokeWidth="1.3" />
			</g>
		</svg>
	);
}

/** Count-up from 0, eased like the ring around it. */
function useCountUp(target: number) {
	const mv = useMotionValue(0);
	const rounded = useTransform(mv, (v) => Math.round(v));
	const [n, setN] = useState(0);
	useEffect(() => rounded.on("change", setN), [rounded]);
	useEffect(() => {
		const a = animate(mv, target, { duration: 0.9, ease: [0.05, 0.7, 0.1, 1] });
		return () => a.stop();
	}, [mv, target]);
	return n;
}

/** Wavy ring filling to matched / total while the number counts up. */
export function MatchRing({ matched, total, failed, className, tone = "surface" }: { matched: number; total: number; failed: boolean; className?: string; tone?: "surface" | "hero" }) {
	const n = useCountUp(matched);
	const hero = tone === "hero";
	return (
		<WavyProgress
			value={total > 0 ? matched / total : 0}
			still
			size={200}
			fluid
			className={cn("size-[132px]", className)}
			trackClassName={hero ? "stroke-white/20" : "stroke-surface-highest"}
			indicatorClassName={failed ? (hero ? "stroke-[#ffb4ab]" : "stroke-destructive") : hero ? "stroke-[#1ed760]" : "stroke-primary"}
			testId="match-arc"
		>
			<span className={cn("type-display text-[2.4em] tabular-nums", hero && "text-white")}>{fmt(n)}</span>
			<span className={cn("text-xs font-medium", hero ? "text-white/70" : "text-muted-foreground")}>of {fmt(total)}</span>
		</WavyProgress>
	);
}

type Visual = "intro" | "run" | "done" | "error";
const visualOf = (phase: ImportPhase): Visual => (phase === "idle" ? "intro" : phase === "done" ? "done" : phase === "error" ? "error" : "run");

const stageSwap = {
	initial: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
	animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: M3_SPRING.defaultSpatial },
	exit: { opacity: 0, scale: 1.04, filter: "blur(6px)", transition: { duration: 0.15 } },
};

/**
 * The immersive half of the import dialog: a Spotify-green aurora that fills
 * with the covers of matched tracks, over the visual of the current phase.
 */
export function ImportStage({
	phase,
	subject,
	reading,
	matching,
	matched,
	missed,
	covers,
	result,
	className,
}: {
	phase: ImportPhase;
	subject: ImportSubject | null;
	reading: ReadProgress | null;
	matching: { done: number; total: number };
	matched: number;
	missed: number;
	covers: string[];
	result: ImportResult | null;
	className?: string;
}) {
	const visual = visualOf(phase);
	const wall = covers.length >= 6;

	return (
		<section className={cn("relative isolate overflow-hidden text-white", className)} style={{ ["--hero-base" as string]: SPOTIFY_NIGHT.base }}>
			<Aurora palette={SPOTIFY_NIGHT} className="-z-10" />
			<AnimatePresence>
				{wall && (
					<motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0 -z-10">
						<ArtworkWall urls={covers} columns={4} period={70} />
						<div
							className="absolute inset-0"
							style={{ background: `radial-gradient(ellipse at center, color-mix(in srgb, ${SPOTIFY_NIGHT.base} 62%, transparent), color-mix(in srgb, ${SPOTIFY_NIGHT.base} 90%, transparent) 75%)` }}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence mode="wait" initial={false}>
				<motion.div key={visual} {...stageSwap} className="relative flex h-full flex-col">
					{visual === "intro" && <Intro />}
					{visual === "run" && <Running phase={phase} subject={subject} reading={reading} matching={matching} matched={matched} missed={missed} />}
					{visual === "done" && result && <Done result={result} />}
					{visual === "error" && <Failed />}
				</motion.div>
			</AnimatePresence>
		</section>
	);
}

function Intro() {
	return (
		<div className="flex h-full flex-col justify-end gap-5 p-6 md:p-10">
			<div className="flex items-center gap-3" aria-hidden>
				<motion.span initial={{ scale: 0.5, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={M3_SPRING.fastSpatial} className="drop-shadow-[0_10px_24px_rgb(30_215_96/0.45)]">
					<SpotifyGlyph className="size-12 md:size-14" />
				</motion.span>
				<span className="relative h-[3px] w-14 overflow-hidden rounded-full bg-white/15 md:w-20">
					<motion.span
						className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-linear-to-r from-transparent via-white to-transparent"
						initial={{ x: "-100%" }}
						animate={{ x: "200%" }}
						transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
					/>
				</span>
				<motion.span initial={{ scale: 0.5, rotate: 30 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...M3_SPRING.fastSpatial, delay: 0.08 }} className="drop-shadow-[0_10px_24px_rgb(129_140_248/0.45)]">
					<LogoMark animated className="size-12 md:size-14" />
				</motion.span>
			</div>
			<HeroTitle as="h2" first="Your Spotify playlists," second="now on wavelet." className="text-[1.9rem] leading-[1.05] sm:text-[2.6rem] md:text-5xl" />
			<p className="hidden max-w-sm text-[15px] leading-relaxed text-white/75 md:block">Every track is matched on Deezer by ISRC, title and duration, then saved as a playlist of yours.</p>
			<div className="hidden flex-wrap gap-2 md:flex">
				<GlassPill icon={ListMusic} value={fmt(MAX_IMPORT_TRACKS)} label="tracks max" />
				<GlassPill icon={ShieldCheck} label="Precise matching" />
				<GlassPill icon={Layers} label="Runs in the background" />
			</div>
		</div>
	);
}

const PHASE_LABEL: Partial<Record<ImportPhase, string>> = {
	reading: "Reading from Spotify",
	matching: "Matching on Deezer",
	saving: "Creating your playlist",
};

function Running({
	phase,
	subject,
	reading,
	matching,
	matched,
	missed,
}: {
	phase: ImportPhase;
	subject: ImportSubject | null;
	reading: ReadProgress | null;
	matching: { done: number; total: number };
	matched: number;
	missed: number;
}) {
	// Reading counts for the first 20 % of the ring, matching for the rest.
	const value =
		phase === "saving"
			? 1
			: phase === "matching"
				? 0.2 + 0.8 * (matching.total ? matching.done / matching.total : 0)
				: reading && reading.total
					? 0.2 * (reading.done / reading.total)
					: null;
	const paused = !!reading?.resumeAt;

	return (
		<div className="flex h-full items-center gap-5 p-6 md:flex-col md:justify-center md:gap-7 md:p-10">
			<WavyProgress
				value={value}
				size={220}
				fluid
				still={paused}
				className="size-[118px] shrink-0 md:size-[240px]"
				trackClassName="stroke-white/15"
				indicatorClassName={paused ? "stroke-amber-300" : "stroke-[#1ed760]"}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					{phase === "saving" ? (
						<motion.span key="save" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={M3_SPRING.fastSpatial}>
							<Check className="size-10 md:size-16" strokeWidth={2.4} />
						</motion.span>
					) : (
						<motion.span key="pct" className="type-display text-3xl tabular-nums md:text-6xl">
							{value === null ? "…" : `${Math.round(value * 100)}%`}
						</motion.span>
					)}
				</AnimatePresence>
			</WavyProgress>

			<div className="min-w-0 md:text-center">
				<p className="type-eyebrow text-white/70" aria-live="polite">
					{PHASE_LABEL[phase]}
				</p>
				<h2 className="type-display mt-1.5 line-clamp-2 text-2xl md:text-4xl">{subject?.title ?? "Spotify playlist"}</h2>
				{subject && (
					<p className="mt-1 text-sm text-white/65">
						{subject.ownerName ? `by ${subject.ownerName} · ` : ""}
						{fmt(subject.total)} tracks
					</p>
				)}
				<div className="mt-3 flex flex-wrap gap-2 md:mt-5 md:justify-center">
					<GlassPill icon={Check} value={fmt(matched)} label="matched" />
					<GlassPill icon={X} value={fmt(missed)} label="missed" className="hidden sm:inline-flex" />
				</div>
			</div>
		</div>
	);
}

function Done({ result }: { result: ImportResult }) {
	const { playlist, report } = result;
	return (
		<div className="flex h-full items-center gap-5 p-6 md:flex-col md:justify-center md:gap-7 md:p-10">
			<MatchRing matched={report.matched} total={report.processed} failed={!playlist} tone="hero" className="size-[118px] shrink-0 text-[0.75rem] md:size-[240px] md:text-[1.4rem]" />
			<div className="min-w-0 md:text-center">
				<p className="type-eyebrow text-white/70">{playlist ? "Import complete" : "Nothing imported"}</p>
				<h2 className="type-display mt-1.5 line-clamp-2 text-2xl md:text-4xl">{playlist ? playlist.title : "No matches"}</h2>
				<p className="mt-1 text-sm text-white/65">
					{report.processed ? Math.round((report.matched / report.processed) * 100) : 0}% of the tracks found on Deezer
				</p>
			</div>
		</div>
	);
}

function Failed() {
	return (
		<div className="flex h-full items-center gap-5 p-6 md:flex-col md:justify-center md:p-10">
			<motion.span
				initial={{ scale: 0.5, rotate: -12 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={M3_SPRING.fastSpatial}
				className="flex size-20 shrink-0 items-center justify-center rounded-m3-xl-plus border border-white/20 bg-white/[0.14] backdrop-blur-md md:size-28"
			>
				<AlertTriangle className="size-9 text-[#ffb4ab] md:size-12" />
			</motion.span>
			<div className="md:text-center">
				<p className="type-eyebrow text-white/70">Import stopped</p>
				<h2 className="type-display mt-1.5 text-2xl md:text-4xl">Something went wrong</h2>
			</div>
		</div>
	);
}
