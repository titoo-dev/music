"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { SeekBar } from "@/components/audio/SeekBar";

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

		audio.ontimeupdate = () => {
			setCurrentTime(audio.currentTime);
		};

		audio.onended = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		audio.oncanplay = () => {
			setLoaded(true);
		};

		return () => {
			audio.pause();
			audio.src = "";
		};
	}, [shareId]);

	// Media Session API
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		const artwork: MediaImage[] = coverUrl
			? [
					{
						src: coverUrl.replace(/\/\d+x\d+-/, "/256x256-"),
						sizes: "256x256",
						type: "image/jpeg",
					},
					{
						src: coverUrl.replace(/\/\d+x\d+-/, "/512x512-"),
						sizes: "512x512",
						type: "image/jpeg",
					},
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

	const handleSeek = useCallback((time: number) => {
		const audio = audioRef.current;
		if (audio) {
			audio.currentTime = time;
			setCurrentTime(time);
		}
	}, []);

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

	return (
		<div className="fixed inset-0 flex flex-col bg-background overflow-hidden select-none">
			{/* Header */}
			<div className="flex shrink-0 items-center border-b-[3px] border-foreground px-4 py-3">
				<div className="flex h-7 w-7 items-center justify-center border-[2px] border-foreground bg-primary text-[10px] font-black text-white">
					D
				</div>
				<span className="ml-2 text-sm font-black tracking-tight text-foreground uppercase">
					deemix
				</span>
				<span className="ml-auto text-xs font-bold text-muted-foreground">
					Shared by {sharedBy}
				</span>
			</div>

			{/* Cover Art */}
			<div className="flex-1 flex items-center justify-center min-h-0 px-6 py-8">
				<div className="w-full max-w-[340px]">
					<CoverImage
						src={coverUrl}
						className="aspect-square w-full border-[3px] border-foreground shadow-[var(--shadow-brutal)]"
					/>
				</div>
			</div>

			{/* Track Info */}
			<div className="shrink-0 px-8 pb-3">
				<p className="truncate text-brutal-md">{title}</p>
				<p className="truncate text-sm font-bold uppercase tracking-wide text-muted-foreground">
					{artist}
				</p>
				{album && (
					<p className="truncate text-xs font-bold text-muted-foreground/60 mt-0.5">
						{album}
					</p>
				)}
			</div>

			{/* Seek Bar */}
			<div className="shrink-0 px-8 group/seekbar">
				<SeekBar
					currentTime={currentTime}
					duration={duration}
					onSeek={handleSeek}
					variant="large"
				/>
				<div className="flex justify-between -mt-1">
					<span className="brutal-label text-muted-foreground tabular-nums">
						{formatTime(currentTime)}
					</span>
					<span className="brutal-label text-muted-foreground tabular-nums">
						{formatTime(duration)}
					</span>
				</div>
			</div>

			{/* Play/Pause Control */}
			<div className="flex shrink-0 items-center justify-center px-8 py-6 pb-10">
				<button
					onClick={handleToggle}
					disabled={!loaded}
					className="flex items-center justify-center h-[72px] w-[72px] border-[3px] border-foreground bg-secondary text-secondary-foreground shadow-[var(--shadow-brutal)] active:shadow-[var(--shadow-brutal-active)] active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-40"
				>
					{isPlaying ? (
						<svg width="30" height="30" viewBox="0 0 12 12" fill="currentColor">
							<rect x="1" y="1" width="3.5" height="10" rx="0" />
							<rect x="7.5" y="1" width="3.5" height="10" rx="0" />
						</svg>
					) : (
						<svg width="30" height="30" viewBox="0 0 12 12" fill="currentColor">
							<path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
						</svg>
					)}
				</button>
			</div>

			{/* Footer */}
			<div className="shrink-0 border-t-[2px] border-foreground/10 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-center">
				<p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
					Powered by deemix
				</p>
			</div>
		</div>
	);
}
