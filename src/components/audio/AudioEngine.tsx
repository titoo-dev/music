"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePreviewStore } from "@/stores/usePreviewStore";

/**
 * Hidden <audio> element that drives full-track playback from S3.
 * Separate from AudioPreview (which handles 30s Deezer clips).
 */
export function AudioEngine() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const prevTrackIdRef = useRef<string | null>(null);

	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const volume = usePlayerStore((s) => s.volume);
	const repeat = usePlayerStore((s) => s.repeat);
	const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
	const setDuration = usePlayerStore((s) => s.setDuration);
	const next = usePlayerStore((s) => s.next);

	const previewStop = usePreviewStore((s) => s.stop);

	// Stop preview playback when full player starts
	useEffect(() => {
		if (currentTrack && isPlaying) {
			previewStop();
		}
	}, [currentTrack, isPlaying, previewStop]);

	// Load new track
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		if (!currentTrack) {
			audio.pause();
			audio.src = "";
			prevTrackIdRef.current = null;
			return;
		}

		if (currentTrack.trackId !== prevTrackIdRef.current) {
			audio.src = `/api/v1/stream/${currentTrack.trackId}`;
			audio.load();
			prevTrackIdRef.current = currentTrack.trackId;
		}
	}, [currentTrack]);

	// Play / pause
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentTrack) return;

		if (isPlaying) {
			if (audio.readyState >= 2) {
				audio.play().catch(() => {});
			}
		} else {
			audio.pause();
		}
	}, [isPlaying, currentTrack]);

	// Volume
	useEffect(() => {
		const audio = audioRef.current;
		if (audio) audio.volume = volume / 100;
	}, [volume]);

	// Seek: listen for currentTime resets (prev button restart)
	const lastStoreTime = useRef(0);
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		const storeTime = usePlayerStore.getState().currentTime;
		// If store time jumped to 0 but audio is further ahead, seek
		if (storeTime === 0 && lastStoreTime.current > 3) {
			audio.currentTime = 0;
		}
		lastStoreTime.current = storeTime;
	});

	const onCanPlay = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		setDuration(audio.duration || 0);
		if (usePlayerStore.getState().isPlaying) {
			audio.play().catch(() => {});
		}
	}, [setDuration]);

	const onTimeUpdate = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		setCurrentTime(audio.currentTime);
		lastStoreTime.current = audio.currentTime;
	}, [setCurrentTime]);

	const onEnded = useCallback(() => {
		if (repeat === "one") {
			const audio = audioRef.current;
			if (audio) {
				audio.currentTime = 0;
				audio.play().catch(() => {});
			}
		} else {
			next();
		}
	}, [repeat, next]);

	// Expose seek function via a global ref for the Player UI
	useEffect(() => {
		(window as any).__deemixAudioSeek = (time: number) => {
			const audio = audioRef.current;
			if (audio) {
				audio.currentTime = time;
				setCurrentTime(time);
			}
		};
		return () => {
			delete (window as any).__deemixAudioSeek;
		};
	}, [setCurrentTime]);

	return (
		<audio
			ref={audioRef}
			onCanPlay={onCanPlay}
			onTimeUpdate={onTimeUpdate}
			onEnded={onEnded}
			onLoadedMetadata={() => {
				const audio = audioRef.current;
				if (audio) setDuration(audio.duration || 0);
			}}
			preload="auto"
			className="hidden"
		/>
	);
}
