"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";

// Inline player for the per-track stem files. Single <audio> element,
// only one stem plays at a time (clicking another stops the current one).
// Presigned S3 URLs come from /api/v1/stems/[trackId]/[stemName]/url so
// the browser streams from MinIO directly without going through Next.js.
//
// This is the "Option A" listening panel — quick verification of the
// generated stems. Real player integration (sync'd multi-track playback,
// karaoke mode swap on the main AudioEngine) is a follow-up PR.

interface StemsPlayerPanelProps {
	trackId: string;
	stems: Array<{ stemName: string; fileSize: number | null }>;
	/** Render hint — desktop dropdowns vs mobile sheets style differently. */
	variant?: "dropdown" | "sheet";
}

const STEM_LABEL: Record<string, string> = {
	vocals: "Vocals",
	no_vocals: "Instrumental (no vocals)",
	drums: "Drums",
	bass: "Bass",
	guitar: "Guitar",
	piano: "Piano",
	other: "Other",
};

// Display order — vocals first (most useful), then rhythm section, then melodic.
const STEM_ORDER: Record<string, number> = {
	vocals: 0,
	no_vocals: 1,
	drums: 2,
	bass: 3,
	guitar: 4,
	piano: 5,
	other: 6,
};

interface UrlResponse {
	url: string | null;
	status?: string;
}

async function fetchStemUrl(
	trackId: string,
	stemName: string,
): Promise<string | null> {
	const res = await fetch(
		`/api/v1/stems/${encodeURIComponent(trackId)}/${encodeURIComponent(stemName)}/url`,
		{ credentials: "include", cache: "no-store" },
	);
	if (!res.ok) return null;
	const json = (await res.json()) as { success: boolean; data?: UrlResponse };
	if (!json.success || !json.data?.url) return null;
	return json.data.url;
}

export function StemsPlayerPanel({
	trackId,
	stems,
	variant = "dropdown",
}: StemsPlayerPanelProps) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [activeStem, setActiveStem] = useState<string | null>(null);
	const [loadingStem, setLoadingStem] = useState<string | null>(null);

	const sortedStems = [...stems].sort(
		(a, b) =>
			(STEM_ORDER[a.stemName] ?? 99) - (STEM_ORDER[b.stemName] ?? 99),
	);

	const stop = useCallback(() => {
		const audio = audioRef.current;
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
		setActiveStem(null);
	}, []);

	const togglePlay = useCallback(
		async (stemName: string) => {
			if (activeStem === stemName) {
				stop();
				return;
			}

			setLoadingStem(stemName);
			const url = await fetchStemUrl(trackId, stemName);
			setLoadingStem(null);
			if (!url) {
				setActiveStem(null);
				return;
			}

			let audio = audioRef.current;
			if (!audio) {
				audio = new Audio();
				audioRef.current = audio;
				audio.addEventListener("ended", () => setActiveStem(null));
			} else {
				audio.pause();
			}
			audio.src = url;
			try {
				await audio.play();
				setActiveStem(stemName);
			} catch {
				setActiveStem(null);
			}
		},
		[activeStem, stop, trackId],
	);

	// Stop playback when the panel unmounts (e.g. menu closes).
	useEffect(() => {
		return () => {
			const audio = audioRef.current;
			if (audio) {
				audio.pause();
				audio.src = "";
			}
		};
	}, []);

	const containerClass =
		variant === "dropdown"
			? "border-t-2 border-foreground bg-card"
			: "border-t-2 border-foreground";

	return (
		<div className={containerClass} data-testid="stems-player-panel">
			<p className="px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">
				Listen — preview each stem
			</p>
			{sortedStems.map((s) => {
				const playing = activeStem === s.stemName;
				const loading = loadingStem === s.stemName;
				return (
					<button
						key={s.stemName}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void togglePlay(s.stemName);
						}}
						aria-label={`${playing ? "Stop" : "Play"} ${STEM_LABEL[s.stemName] ?? s.stemName}`}
						aria-pressed={playing}
						className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-[13px] hover:bg-accent/20 active:bg-accent/30 transition-colors"
					>
						<span className="shrink-0 inline-flex items-center justify-center size-6 rounded-full border-2 border-foreground">
							{loading ? (
								<Loader2 className="size-3 animate-spin" />
							) : playing ? (
								<Pause className="size-3" />
							) : (
								<Play className="size-3 translate-x-[1px]" />
							)}
						</span>
						<span className="flex-1 font-bold truncate">
							{STEM_LABEL[s.stemName] ?? s.stemName}
						</span>
						{playing && (
							<Volume2 className="size-3.5 text-primary shrink-0" />
						)}
					</button>
				);
			})}
		</div>
	);
}
