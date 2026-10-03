"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Clock3, Download, ExternalLink, Globe, Headphones, Link2, Music } from "lucide-react";
import { DrawCheck, Equalizer, LogoMark, PlayPauseIcon, SlideSwap, Spinner } from "@/components/motion/icons";
import { WaveSeek } from "@/components/audio/WaveSeek";
import { CoverTheme, DUR, EASE, EyebrowPill, StatBadge, entrance } from "@/components/expressive";
import { sizedCover } from "@/lib/cover-palette";
import { cn } from "@/lib/utils";

function formatTime(seconds: number) {
	if (!seconds || !isFinite(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

interface SharePlayerProps {
	shareId: string;
	title: string;
	artist: string;
	album: string | null;
	coverUrl: string | null;
	duration: number | null;
	sharedBy: string;
}

/** Cover-themed backdrop: the artwork blurred into the page, with accent glows. */
function Backdrop({ coverUrl }: { coverUrl: string | null }) {
	return (
		<div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
			{coverUrl && (
				<motion.img
					src={sizedCover(coverUrl, 250)}
					alt=""
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.6 }}
					transition={{ duration: 1.2 }}
					className="absolute left-1/2 top-[-10%] h-[80vh] w-[140vw] max-w-none -translate-x-1/2 scale-110 object-cover blur-[80px] saturate-150"
				/>
			)}
			<div className="motion-drift absolute -left-[20%] -top-[30%] aspect-square w-[80%] rounded-full opacity-50 blur-3xl" style={{ animation: "aurora-a 19s ease-in-out infinite", background: "radial-gradient(closest-side, var(--primary), transparent)" }} />
			<div className="motion-drift absolute -right-[25%] top-[5%] aspect-square w-[70%] rounded-full opacity-40 blur-3xl" style={{ animation: "aurora-b 23s ease-in-out infinite", background: "radial-gradient(closest-side, var(--m3-tertiary), transparent)" }} />
			<div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--background)_35%,transparent),color-mix(in_srgb,var(--background)_80%,transparent)_45%,var(--background)_85%)]" />
		</div>
	);
}

export function SharePlayer({ shareId, title, artist, album, coverUrl, duration: initialDuration, sharedBy }: SharePlayerProps) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [buffered, setBuffered] = useState(0);
	const [duration, setDuration] = useState(initialDuration ?? 0);
	const [loaded, setLoaded] = useState(false);
	const [linkCopied, setLinkCopied] = useState(false);

	useEffect(() => {
		const audio = new Audio();
		audio.preload = "auto";
		audio.crossOrigin = "anonymous";
		audio.src = `/api/v1/shares/${shareId}/stream`;
		audioRef.current = audio;

		audio.onloadedmetadata = () => {
			if (audio.duration && isFinite(audio.duration)) {
				setDuration(audio.duration);
			}
			setLoaded(true);
		};
		audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
		audio.onprogress = () => {
			const b = audio.buffered;
			if (b.length) setBuffered(b.end(b.length - 1));
		};
		audio.onended = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};
		audio.oncanplay = () => setLoaded(true);

		return () => {
			audio.pause();
			audio.src = "";
		};
	}, [shareId]);

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		const artwork: MediaImage[] = coverUrl
			? [
					{ src: coverUrl.replace(/\/\d+x\d+-/, "/256x256-"), sizes: "256x256", type: "image/jpeg" },
					{ src: coverUrl.replace(/\/\d+x\d+-/, "/512x512-"), sizes: "512x512", type: "image/jpeg" },
				]
			: [];
		navigator.mediaSession.metadata = new MediaMetadata({
			title,
			artist,
			album: album ?? undefined,
			artwork,
		});
		return () => {
			navigator.mediaSession.metadata = null;
		};
	}, [title, artist, album, coverUrl]);

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
	}, [isPlaying]);

	const handleToggle = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		if (isPlaying) {
			audio.pause();
			setIsPlaying(false);
		} else {
			audio.play().catch(() => {});
			setIsPlaying(true);
		}
	}, [isPlaying]);

	const handleSeek = (time: number) => {
		const audio = audioRef.current;
		if (!audio || !duration) return;
		audio.currentTime = time;
		setCurrentTime(time);
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setLinkCopied(true);
			setTimeout(() => setLinkCopied(false), 1800);
		} catch {
			// ignore
		}
	};

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
			["play", () => handleToggle()],
			["pause", () => handleToggle()],
			[
				"seekto",
				(details) => {
					const audio = audioRef.current;
					if (audio && details.seekTime != null) {
						audio.currentTime = details.seekTime;
						setCurrentTime(details.seekTime);
					}
				},
			],
		];
		for (const [action, handler] of handlers) {
			try {
				navigator.mediaSession.setActionHandler(action, handler);
			} catch {}
		}
		return () => {
			for (const [action] of handlers) {
				try {
					navigator.mediaSession.setActionHandler(action, null);
				} catch {}
			}
		};
	}, [handleToggle]);

	const sharedByLabel = `@${sharedBy.toLowerCase().replace(/\s+/g, "")}`;
	const longTitle = title.length > 22;

	return (
		<CoverTheme src={coverUrl} className="relative isolate min-h-dvh overflow-x-hidden bg-background">
			<Backdrop coverUrl={coverUrl} />

			{/* Top bar */}
			<header className="relative z-10">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<Link href="/" className="flex items-center gap-2 text-foreground no-underline">
						<LogoMark animated={isPlaying} className="size-8" />
						<span className="text-xl font-semibold tracking-tight">wavelet</span>
					</Link>
					<Link href="/" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground no-underline transition-[transform,background-color] hover:bg-secondary/80 active:scale-95">
						Open wavelet <ExternalLink className="size-4" aria-hidden />
					</Link>
				</div>
			</header>

			<main className="relative mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-10">
				<div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,400px)_1fr] md:gap-12 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-16">
					{/* Glowing cover */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 16 }}
						animate={{ opacity: 1, scale: isPlaying ? 1 : 0.97, y: 0 }}
						transition={{ duration: DUR.long, ease: EASE.emphasized }}
						className="mx-auto w-[min(78vw,340px)] md:w-full"
					>
						<div
							className={cn(
								"relative aspect-square overflow-hidden rounded-[28px] bg-surface-high transition-shadow duration-700",
								isPlaying
									? "shadow-[0_24px_64px_-8px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
									: "shadow-[0_18px_48px_-12px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
							)}
						>
							{coverUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={sizedCover(coverUrl, 1000)} alt={album ? `${album} cover` : `${title} cover`} className="size-full object-cover" />
							) : (
								<span className="flex size-full items-center justify-center text-muted-foreground">
									<Music className="size-1/3" />
								</span>
							)}
						</div>
					</motion.div>

					{/* Heading + player */}
					<div className="min-w-0 text-center md:text-left">
						<motion.div {...entrance(1, 10)}>
							<EyebrowPill className="gap-1.5">
								<Equalizer playing={isPlaying} bars={3} className="h-3" />
								Shared with you
							</EyebrowPill>
						</motion.div>
						<motion.h1 {...entrance(2, 12)} className={cn("type-display mt-4 break-words text-balance text-foreground", longTitle ? "text-3xl sm:text-4xl lg:text-5xl" : "text-4xl sm:text-5xl lg:text-6xl")}>
							{title}
						</motion.h1>
						<motion.p {...entrance(3, 8)} className="mt-2 text-lg text-muted-foreground">
							<span className="font-semibold text-foreground">{artist}</span>
							{album && <> · {album}</>}
						</motion.p>
						<motion.div {...entrance(4, 8)} className="mt-4 flex justify-center md:justify-start">
							<span className="inline-flex items-center gap-2 rounded-full bg-secondary-container py-1 pl-1 pr-3.5 text-sm text-on-secondary-container">
								<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{sharedBy.charAt(0).toUpperCase() || "?"}</span>
								Shared by <span className="font-semibold">{sharedByLabel}</span>
							</span>
						</motion.div>

						{/* Player card */}
						<motion.div {...entrance(5, 16)} className="mt-8 rounded-[28px] bg-surface-container/75 p-4 text-left shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl sm:p-6">
							<div className="flex items-center gap-4 sm:gap-5">
								<motion.button
									type="button"
									onClick={handleToggle}
									disabled={!loaded}
									aria-label={isPlaying ? "Pause" : "Play"}
									whileTap={{ scale: 0.9 }}
									animate={{ scale: isPlaying ? 1.06 : 1, borderRadius: isPlaying ? 999 : 26 }}
									transition={{ duration: DUR.medium, ease: EASE.emphasized }}
									className={cn(
										"flex size-[72px] shrink-0 items-center justify-center bg-primary text-primary-foreground outline-none transition-[box-shadow,opacity] duration-500 focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-60",
										isPlaying ? "shadow-[0_8px_30px_2px_color-mix(in_srgb,var(--primary)_55%,transparent)]" : "shadow-[0_6px_16px_-2px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
									)}
								>
									<AnimatePresence mode="popLayout" initial={false}>
										<motion.span key={loaded ? "ready" : "wait"} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} className="flex">
											{loaded ? <PlayPauseIcon playing={isPlaying} className="size-8" /> : <Spinner size={24} />}
										</motion.span>
									</AnimatePresence>
								</motion.button>
								<div className="min-w-0 flex-1">
									<WaveSeek currentTime={currentTime} duration={duration} buffered={buffered} playing={isPlaying} onSeek={handleSeek} />
								</div>
							</div>

							<div className="mt-5 flex flex-wrap items-center gap-2">
								<motion.button
									type="button"
									whileTap={{ scale: 0.95 }}
									onClick={handleCopyLink}
									className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
								>
									{linkCopied ? <DrawCheck className="size-4" /> : <Link2 className="size-4" aria-hidden />}
									<SlideSwap id={linkCopied ? "copied" : "copy"}>{linkCopied ? "Copied" : "Copy link"}</SlideSwap>
								</motion.button>
								<Link href="/" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-container px-4 text-sm font-semibold text-on-primary-container no-underline transition-[transform,opacity] hover:opacity-90 active:scale-95">
									<Download className="size-4" aria-hidden />
									Get it
								</Link>
								<span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Full track · get the app to download</span>
							</div>
						</motion.div>

						<motion.div {...entrance(6, 8)} className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
							<StatBadge icon={Clock3}>{duration > 0 ? formatTime(duration) : "—"}</StatBadge>
							<StatBadge icon={Headphones}>Full track</StatBadge>
							<StatBadge icon={Globe}>Public</StatBadge>
						</motion.div>
					</div>
				</div>

				{/* CTA */}
				<motion.section
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, ease: EASE.decelerate }}
					className="bg-tonal-gradient relative mt-14 overflow-hidden rounded-[28px] p-6 text-on-primary-container sm:p-10"
				>
					<LogoMark className="pointer-events-none absolute -bottom-10 -right-6 size-48 rotate-[-12deg] opacity-15" />
					<div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
						<div>
							<p className="type-eyebrow opacity-80">wavelet</p>
							<h2 className="type-display mt-2 text-3xl sm:text-4xl">Download your library</h2>
							<p className="mt-2 max-w-[52ch] text-sm opacity-80 sm:text-base">wavelet is a self-hosted, open-source web app for downloading high-quality music from Deezer. No ads — your files, your disk.</p>
						</div>
						<Link href="/" className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground no-underline shadow-[0_6px_18px_-4px_color-mix(in_srgb,var(--primary)_45%,transparent)] transition-[transform,background-color] hover:bg-primary/90 active:scale-95">
							Get wavelet
							<ArrowRight className="size-4" aria-hidden />
						</Link>
					</div>
				</motion.section>

				{/* Footer */}
				<footer className="mt-10 flex flex-col items-center gap-2 py-4 text-center text-xs text-muted-foreground">
					<span className="flex items-center gap-2 text-sm font-semibold text-foreground">
						<LogoMark className="size-5" /> wavelet
					</span>
					<span>
						Not affiliated with Deezer · <span className="font-mono">{shareId.slice(0, 8)}</span>
					</span>
				</footer>
			</main>
		</CoverTheme>
	);
}
