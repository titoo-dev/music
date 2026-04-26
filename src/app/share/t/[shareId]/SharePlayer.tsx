"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import { Play, Pause, Download, Share2, ExternalLink, Check } from "lucide-react";

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
	const year = "—";

	return (
		<div className="min-h-screen bg-background">
			{/* Header strip */}
			<header className="border-b-[2px] sm:border-b-[3px] border-foreground bg-background sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-5 sm:px-10 py-4 flex items-center justify-between gap-4">
					<Link href="/" className="flex items-center gap-2.5 no-underline">
						<div className="h-6 w-6 border-[2px] border-foreground bg-primary shrink-0" />
						<span className="text-xl font-black tracking-[-0.03em] text-foreground uppercase">
							DEEMIX
						</span>
					</Link>
					<Link
						href="/"
						className="inline-flex items-center gap-2 px-3 py-2 border-2 border-foreground bg-card font-mono text-[11px] font-bold tracking-[0.1em] uppercase shadow-[var(--shadow-brutal-sm)] hover:bg-accent active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] transition-colors no-underline"
					>
						OPEN IN APP <ExternalLink className="size-3" />
					</Link>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-5 sm:px-10 py-10 sm:py-14">
				{/* Hero */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-start md:items-center mb-12">
					{/* Cover with sticker */}
					<div className="relative w-full max-w-[420px] mx-auto md:mx-0">
						<CoverImage
							src={coverUrl}
							className="w-full aspect-square border-[3px] sm:border-[4px] border-foreground shadow-[10px_10px_0_var(--foreground)]"
						/>
						<div
							className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 bg-accent border-[3px] border-foreground px-3 py-2 font-mono text-[11px] font-black tracking-[0.12em] uppercase shadow-[4px_4px_0_var(--foreground)]"
							style={{ transform: "rotate(4deg)" }}
						>
							SHARED WITH YOU
						</div>
					</div>

					{/* Info */}
					<div className="min-w-0">
						<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
							TRACK · FLAC{duration > 0 ? ` · ${formatTime(duration)}` : ""}
						</p>
						<h1 className="text-brutal-xl m-0 mb-3">
							{title}
							<span className="text-primary">.</span>
						</h1>
						<p className="text-lg sm:text-xl font-bold mb-5">
							BY <span className="text-primary">{artist}</span>
						</p>
						{album && (
							<p className="text-sm font-medium text-muted-foreground mb-7 max-w-[40ch]">
								FROM THE ALBUM <strong className="text-foreground">{album}</strong>
							</p>
						)}

						{/* Action buttons */}
						<div className="flex flex-wrap gap-2.5 mb-7">
							<button
								onClick={handleToggle}
								disabled={!loaded}
								className="inline-flex items-center gap-2 px-5 py-3 border-2 sm:border-[3px] border-foreground bg-primary text-white font-mono text-sm font-black tracking-[0.12em] uppercase shadow-[var(--shadow-brutal)] hover:bg-primary/90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] disabled:opacity-40 transition-all"
							>
								{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
								{isPlaying ? "PAUSE" : "PLAY"}
							</button>
							<Link
								href="/"
								className="inline-flex items-center gap-2 px-5 py-3 border-2 sm:border-[3px] border-foreground bg-card text-foreground font-mono text-sm font-black tracking-[0.12em] uppercase shadow-[var(--shadow-brutal)] hover:bg-accent active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] transition-all no-underline"
							>
								<Download className="size-4" />
								GET IT
							</Link>
							<button
								onClick={handleCopyLink}
								className="inline-flex items-center gap-2 px-5 py-3 border-2 sm:border-[3px] border-transparent text-foreground font-mono text-sm font-black tracking-[0.12em] uppercase hover:border-foreground hover:bg-card transition-colors"
							>
								{linkCopied ? <Check className="size-4 text-foreground" strokeWidth={3} /> : <Share2 className="size-4" />}
								{linkCopied ? "COPIED" : "COPY LINK"}
							</button>
						</div>

						<p className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
							← SHARED BY <strong className="text-foreground">{sharedByLabel}</strong>
						</p>
					</div>
				</div>

				{/* Waveform card */}
				<div className="border-2 sm:border-[3px] border-foreground bg-card shadow-[var(--shadow-brutal)] p-4 sm:p-6 mb-10">
					<div className="flex items-center gap-4">
						<button
							onClick={handleToggle}
							disabled={!loaded}
							aria-label={isPlaying ? "Pause" : "Play"}
							className="shrink-0 inline-flex items-center justify-center w-14 h-14 border-2 sm:border-[3px] border-foreground bg-primary text-white shadow-[var(--shadow-brutal-sm)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] disabled:opacity-40 transition-all"
						>
							{isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
						</button>
						<div className="flex-1 min-w-0">
							{/* Bars */}
							<div
								className="h-14 flex items-center gap-[2px] cursor-pointer"
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
											className={`flex-1 transition-colors ${filled ? "bg-primary" : "bg-muted"}`}
											style={{ height: `${h}%` }}
										/>
									);
								})}
							</div>
							{/* Time line */}
							<div className="flex justify-between mt-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
								<span className="tabular-nums">
									{formatTime(currentTime)} / {formatTime(duration)}
								</span>
								<span>FULL TRACK · GET APP FOR DOWNLOAD</span>
							</div>
						</div>
					</div>
				</div>

				{/* Stats strip */}
				<div className="grid grid-cols-2 sm:grid-cols-4 mb-10">
					{[
						{ k: "FORMAT", v: "FLAC" },
						{ k: "DURATION", v: duration > 0 ? formatTime(duration) : "—" },
						{ k: "YEAR", v: year },
						{ k: "SHARED", v: "PUBLIC" },
					].map((s, i) => (
						<div
							key={s.k}
							className={`p-5 border-t-2 border-b-2 border-foreground ${
								i === 0 ? "border-l-2" : ""
							} ${
								i < 3 ? "border-r-2" : "sm:border-r-2"
							} ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
						>
							<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
								{s.k}
							</p>
							<p className="text-2xl sm:text-3xl font-black tracking-[-0.02em]">{s.v}</p>
						</div>
					))}
				</div>

				{/* Massive CTA */}
				<div className="border-2 sm:border-[3px] border-foreground bg-foreground text-background p-7 sm:p-10 shadow-[8px_8px_0_var(--primary)] mb-12">
					<div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
						<div>
							<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-accent mb-3">
								SELF-HOSTED · OPEN-SOURCE · FLAC
							</p>
							<h2 className="text-brutal-lg m-0 mb-3">
								DOWNLOAD YOUR<br />
								<span className="text-accent">LIBRARY.</span>
							</h2>
							<p className="text-base font-medium opacity-80 max-w-[52ch]">
								DEEMIX IS A WEB APP FOR DOWNLOADING HIGH-QUALITY MUSIC FROM DEEZER. NO ACCOUNTS. NO ADS. YOUR FILES, YOUR DISK.
							</p>
						</div>
						<Link
							href="/"
							className="inline-flex items-center justify-center gap-2 px-7 py-4 border-2 sm:border-[3px] border-background bg-accent text-foreground font-mono text-base font-black tracking-[0.12em] uppercase shadow-[4px_4px_0_var(--background)] hover:bg-accent/90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_var(--background)] transition-all no-underline whitespace-nowrap"
						>
							GET DEEMIX →
						</Link>
					</div>
				</div>

				{/* Footer */}
				<p className="text-center font-mono text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground py-6">
					DEEMIX.APP / SHARED / {shareId.slice(0, 8).toUpperCase()} · NOT AFFILIATED WITH DEEZER
				</p>
			</main>
		</div>
	);
}
