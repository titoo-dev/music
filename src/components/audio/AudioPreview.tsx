"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { adjustVolume } from "@/utils/adjust-volume";

export function AudioPreview() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const { currentTrack, isPlaying, volume, pause, stop } = usePreviewStore();
	const prevTrackIdRef = useRef<string | null>(null);

	// Handle track changes
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		if (!currentTrack?.previewUrl) {
			audio.pause();
			audio.src = "";
			return;
		}

		if (currentTrack.id !== prevTrackIdRef.current) {
			// New track — fade out old, load new
			if (!audio.paused) {
				adjustVolume(audio, 0, { duration: 200 }).then(() => {
					audio.src = currentTrack.previewUrl;
					audio.load();
				});
			} else {
				audio.src = currentTrack.previewUrl;
				audio.load();
			}
			prevTrackIdRef.current = currentTrack.id;
		}
	}, [currentTrack]);

	// Handle play/pause
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentTrack?.previewUrl) return;

		if (isPlaying) {
			if (audio.readyState >= 2) {
				audio.play();
				adjustVolume(audio, volume / 100, { duration: 400 });
			}
		} else {
			adjustVolume(audio, 0, { duration: 250 }).then(() => {
				audio.pause();
			});
		}
	}, [isPlaying]);

	// Handle volume changes while playing
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !isPlaying) return;
		adjustVolume(audio, volume / 100, { duration: 200 });
	}, [volume]);

	const onCanPlay = useCallback(() => {
		const audio = audioRef.current;
		if (!audio || !isPlaying) return;
		audio.volume = 0;
		audio.play();
		adjustVolume(audio, volume / 100, { duration: 400 });
	}, [isPlaying, volume]);

	const onTimeUpdate = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		// Fade out near the end
		if (audio.duration - audio.currentTime < 1.5 && audio.volume > 0) {
			adjustVolume(audio, 0, { duration: 800 }).then(() => {
				stop();
			});
		}
	}, [stop]);

	const onEnded = useCallback(() => {
		stop();
	}, [stop]);

	return (
		<audio
			ref={audioRef}
			onCanPlay={onCanPlay}
			onTimeUpdate={onTimeUpdate}
			onEnded={onEnded}
			preload="auto"
			className="hidden"
		/>
	);
}
