"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import { motion } from "motion/react";
import { Download, Share2, ExternalLink, ArrowRight } from "lucide-react";
import { DrawCheck, Equalizer, LogoMark, PlayPauseIcon, SlideSwap, Spinner } from "@/components/motion/icons";

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

export function SharePlayer({
	shareId,
	title,
	artist,
	album,
	coverUrl,
	duration: initialDuration,
	sharedBy,
}: SharePlayerProps) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
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

	const handleSeekTo = (pct: number) => {
		const audio = audioRef.current;
		if (!audio || !duration) return;
		const time = pct * duration;
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

	// Stable pseudo-random waveform (deterministic based on shareId)
	const waveformBars = useMemo(() => {
		const seed = shareId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
		return Array.from({ length: 80 }, (_, i) => {
			const v = Math.abs(Math.sin((i + seed) * 0.5) * Math.cos((i + seed) * 0.2));
			return 18 + v * 78;
		});
	}, [shareId]);

	const progressPct = duration > 0 ? currentTime / duration : 0;

	const sharedByLabel = `@${sharedBy.toLowerCase().replace(/\s+/g, "")}`;

	return (
		<div className="relative min-h-dvh overflow-hidden bg-background">
			<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-grid" />

			{/* Header */}
			<header className="glass sticky top-0 z-10 border-b border-border">
				<div className="max-w-5xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
					<Link href="/" className="flex items-center gap-2 no-underline text-foreground">
						<LogoMark className="size-6 shrink-0" />
						<span className="text-sm font-semibold tracking-tight">deemix</span>
					</Link>
					<Link
						href="/"
						className="inline-flex items-center gap-1.5 h-9 md:h-8 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground transition-colors no-underline [@media(hover:hover)]:hover:bg-accent"
					>
						Open in app <ExternalLink className="size-3.5" aria-hidden />
					</Link>
				</div>
			</header>

			<main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
				{/* Hero */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
					className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-8 md:gap-12 items-center mb-10"
				>
					<div className="relative w-full max-w-[360px] mx-auto md:mx-0">
						<CoverImage
							src={coverUrl}
							alt={album ? `${album} cover` : `${title} cover`}
							className="w-full aspect-square rounded-xl ring-1 ring-border shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]"
						/>
					</div>

					<div className="min-w-0 text-center md:text-left">
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
							<Equalizer playing={isPlaying} bars={3} className="h-3" />
							Shared with you
						</span>
						<h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance break-words m-0">
							{title}
						</h1>
						<p className="mt-2 text-lg text-muted-foreground">
							<span className="font-medium text-foreground">{artist}</span>
							{album && (
								<>
									{" · "}
									<span>{album}</span>
								</>
							)}
						</p>

						{/* Actions */}
						<div className="mt-7 flex flex-wrap items-center justify-center md:justify-start gap-2">
							<button
								onClick={handleToggle}
								disabled={!loaded}
								className="inline-flex items-center gap-2 h-11 pl-4 pr-5 rounded-full bg-primary text-primary-foreground text-sm font-medium outline-none transition-[background-color,transform] duration-150 [@media(hover:hover)]:hover:bg-primary/85 focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-[0.98] disabled:opacity-50"
							>
								<PlayPauseIcon playing={isPlaying} className="size-4" />
								{isPlaying ? "Pause" : "Play"}
							</button>
							<Link
								href="/"
								className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-border bg-background text-sm font-medium text-foreground transition-colors no-underline [@media(hover:hover)]:hover:bg-accent"
							>
								<Download className="size-4" aria-hidden />
								Get it
							</Link>
							<button
								onClick={handleCopyLink}
								className="inline-flex items-center gap-2 h-11 px-4 rounded-full text-sm font-medium text-muted-foreground transition-colors [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground"
							>
								{linkCopied ? <DrawCheck className="size-4 text-success" /> : <Share2 className="size-4" aria-hidden />}
								<SlideSwap id={linkCopied ? "copied" : "copy"}>
									{linkCopied ? "Copied" : "Copy link"}
								</SlideSwap>
							</button>
						</div>

						<p className="mt-6 text-sm text-muted-foreground">
							Shared by <span className="font-medium text-foreground">{sharedByLabel}</span>
						</p>
					</div>
				</motion.div>

				{/* Waveform card */}
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
					className="rounded-xl border border-border bg-card p-4 sm:p-5 mb-10"
				>
					<div className="flex items-center gap-4">
						<button
							onClick={handleToggle}
							disabled={!loaded}
							aria-label={isPlaying ? "Pause" : "Play"}
							className="shrink-0 inline-flex items-center justify-center size-12 rounded-full bg-primary text-primary-foreground outline-none transition-[background-color,transform] duration-150 [@media(hover:hover)]:hover:bg-primary/85 focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-95 disabled:opacity-50"
						>
							{loaded ? <PlayPauseIcon playing={isPlaying} className="size-5" /> : <Spinner size={18} />}
						</button>
						<div className="flex-1 min-w-0">
							{/* Bars */}
							<div
								className="h-12 flex items-center gap-[2px] cursor-pointer"
								onClick={(e) => {
									const rect = e.currentTarget.getBoundingClientRect();
									const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
									handleSeekTo(pct);
								}}
							>
								{waveformBars.map((h, i) => {
									const filledThreshold = progressPct * waveformBars.length;
									const filled = i < filledThreshold;
									return (
										<div
											key={i}
											className={`flex-1 rounded-full transition-colors ${filled ? "bg-highlight" : "bg-muted-foreground/25"}`}
											style={{ height: `${h}%` }}
										/>
									);
								})}
							</div>
							{/* Time line */}
							<div className="flex justify-between gap-3 mt-2 text-xs text-muted-foreground">
								<span className="font-mono tabular-nums">
									{formatTime(currentTime)} / {formatTime(duration)}
								</span>
								<span className="truncate">Full track · get the app to download</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Stats strip */}
				<dl className="grid grid-cols-3 rounded-xl border border-border bg-card divide-x divide-border mb-10 overflow-hidden">
					{[
						{ k: "Format", v: "FLAC" },
						{ k: "Duration", v: duration > 0 ? formatTime(duration) : "—" },
						{ k: "Access", v: "Public" },
					].map((s) => (
						<div key={s.k} className="px-4 py-4 sm:px-5">
							<dt className="text-xs text-muted-foreground">{s.k}</dt>
							<dd className="m-0 mt-1 text-lg sm:text-xl font-semibold tracking-tight tabular-nums">{s.v}</dd>
						</div>
					))}
				</dl>

				{/* CTA */}
				<div className="rounded-xl border border-border bg-card p-6 sm:p-8 mb-12">
					<div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
						<div>
							<h2 className="text-xl sm:text-2xl font-semibold tracking-tight m-0">
								Download your library
							</h2>
							<p className="mt-2 text-sm text-muted-foreground max-w-[52ch]">
								deemix is a self-hosted, open-source web app for downloading high-quality music from Deezer. No ads — your files, your disk.
							</p>
						</div>
						<Link
							href="/"
							className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors no-underline whitespace-nowrap [@media(hover:hover)]:hover:bg-primary/85"
						>
							Get deemix
							<ArrowRight className="size-4" aria-hidden />
						</Link>
					</div>
				</div>

				{/* Footer */}
				<p className="text-center text-xs text-muted-foreground py-6">
					<span className="font-mono">{shareId.slice(0, 8)}</span> · Not affiliated with Deezer
				</p>
			</main>
		</div>
	);
}
