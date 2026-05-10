"use client";

import { useEffect, useRef } from "react";
import { useStems } from "@/hooks/useStems";
import { useTrackCached } from "@/hooks/useTrackCached";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Karaoke toggle button rendered in the player chrome. One click = "remove
// vocals from the current track". Behavior:
//
//   - off               → click toggles ON. If stems already exist, audio
//                         swaps instantly to no_vocals on next reload.
//                         Otherwise, kicks off a `two_stems` separation in
//                         the background; the player keeps playing the
//                         original until the worker finishes, then we
//                         retryTrack() which makes AudioEngine re-resolve
//                         the URL and pick up the freshly-uploaded stem.
//
//   - on, stems ready   → click toggles OFF. Audio swaps back to original.
//
//   - preparing         → button shows a spinner with %; clicking turns
//                         karaoke OFF (and abandons the wait).
//
//   - failed            → click retries the separation. Karaoke stays ON
//                         so the swap happens automatically on success.

const KARAOKE_LABEL_DEFAULT = "Karaoke (remove vocals)";

export function KaraokeToggle() {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const karaokeMode = usePlayerStore((s) => s.karaokeMode);
	const setKaraokeMode = usePlayerStore((s) => s.setKaraokeMode);
	const retryTrack = usePlayerStore((s) => s.retryTrack);

	const trackId = currentTrack?.trackId ?? null;
	const cached = useTrackCached(trackId);
	const stems = useStems(trackId);

	// Auto-trigger a separation request when karaoke is ON and the current
	// track has nothing yet (status=idle). This is what makes the toggle
	// feel "magic" — the user flips it, the worker spins up, and audio
	// swaps when ready.
	const requestedRef = useRef<Set<string>>(new Set());
	useEffect(() => {
		if (!karaokeMode || !trackId) return;
		if (stems.status !== "idle") return;
		// Only request once per (trackId, mount) — avoid repeated POSTs from
		// the polling churn that switches status idle ↔ queued.
		const key = `${trackId}`;
		if (requestedRef.current.has(key)) return;
		requestedRef.current.add(key);
		void stems.requestSeparation("two_stems");
	}, [karaokeMode, trackId, stems]);

	// When stems become ready while karaoke is ON, force AudioEngine to
	// re-resolve the source URL so it switches to no_vocals.
	const prevStatusRef = useRef(stems.status);
	useEffect(() => {
		const prev = prevStatusRef.current;
		prevStatusRef.current = stems.status;
		if (!karaokeMode) return;
		if (prev !== "completed" && stems.status === "completed") {
			retryTrack();
		}
	}, [stems.status, karaokeMode, retryTrack]);

	// Surface separation failures as a toast so the user isn't left guessing
	// why the toggle is on but nothing changed.
	const prevErrorRef = useRef<string | null>(null);
	useEffect(() => {
		if (stems.errorMessage && stems.errorMessage !== prevErrorRef.current) {
			prevErrorRef.current = stems.errorMessage;
			if (karaokeMode) {
				toast.error("Couldn't prepare karaoke", {
					description: stems.errorMessage,
				});
			}
		}
		if (!stems.errorMessage) prevErrorRef.current = null;
	}, [stems.errorMessage, karaokeMode]);

	if (!currentTrack) return null;
	// Hide the toggle until the track is cached — stems can only be
	// generated from a stored file, so showing it earlier would just lead
	// to a 409 TRACK_NOT_CACHED on click. Once playback crosses ~30s the
	// server persists the file and useTrackCached's poll picks it up.
	if (!cached) return null;

	const isPreparing =
		karaokeMode &&
		(stems.status === "requesting" ||
			stems.status === "queued" ||
			stems.status === "processing");
	const isFailed = karaokeMode && stems.status === "failed";

	const handleClick = () => {
		if (isFailed) {
			// Retry the separation — keep karaoke on so it auto-swaps when ready.
			requestedRef.current.delete(trackId ?? "");
			void stems.requestSeparation("two_stems");
			return;
		}
		setKaraokeMode(!karaokeMode);
	};

	const label = (() => {
		if (isPreparing) return `Preparing karaoke… ${stems.progress}%`;
		if (isFailed) return "Karaoke failed — retry";
		return karaokeMode ? "Karaoke on (vocals removed)" : KARAOKE_LABEL_DEFAULT;
	})();

	const icon = (() => {
		if (isPreparing) return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
		if (isFailed) return <AlertCircle className="h-3.5 w-3.5" />;
		return karaokeMode ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />;
	})();

	const isActive = karaokeMode && stems.status === "completed";
	// Default state is icon-only; expand only to surface the live progress
	// percentage or RETRY affordance, since those carry information beyond
	// what an icon can convey.
	const showText = isPreparing || isFailed;

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						aria-label={label}
						aria-pressed={karaokeMode}
						data-testid="karaoke-toggle"
						className={`inline-flex h-7 ${showText ? "px-2 gap-1.5" : "w-7 px-0"} font-mono text-[10px] font-black tracking-[0.1em] border-[2px] ${
							isFailed
								? "bg-destructive/10 text-destructive border-destructive"
								: isActive
									? "bg-primary text-white border-foreground"
									: isPreparing
										? "bg-accent text-foreground border-foreground"
										: karaokeMode
											? "bg-accent text-foreground border-foreground"
											: "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
						}`}
						onClick={handleClick}
					/>
				}
			>
				{icon}
				{showText && (
					<span>{isPreparing ? `${stems.progress}%` : "RETRY"}</span>
				)}
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
