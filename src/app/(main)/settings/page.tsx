"use client";

import { AudioCacheManager } from "@/components/audio/AudioCacheManager";
import { usePlayerStore } from "@/stores/usePlayerStore";

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const CROSSFADE_OPTIONS = [0, 2, 4, 6, 8, 10];

export default function SettingsPage() {
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);
	const playbackRate = usePlayerStore((s) => s.playbackRate);
	const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);

	return (
		<div className="mx-auto max-w-2xl px-4 py-8">
			<h1 className="mb-8 text-2xl font-bold uppercase tracking-wider">Settings</h1>

			{/* Playback */}
			<section className="mb-8">
				<h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
					Playback
				</h2>
				<div className="rounded-lg border border-border bg-card divide-y divide-border">
					{/* Normalization */}
					<div className="flex items-center justify-between px-5 py-4">
						<div>
							<p className="text-sm font-semibold">Volume Normalization</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Automatically adjust track volume for consistent playback levels.
							</p>
						</div>
						<button
							role="switch"
							aria-checked={normalizationEnabled}
							onClick={toggleNormalization}
							className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								normalizationEnabled ? "bg-foreground" : "bg-muted"
							}`}
						>
							<span
								className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${
									normalizationEnabled ? "translate-x-5" : "translate-x-0"
								}`}
							/>
						</button>
					</div>

					{/* Playback speed */}
					<div className="px-5 py-4">
						<p className="text-sm font-semibold">Playback Speed</p>
						<p className="mt-0.5 mb-3 text-xs text-muted-foreground">
							Current: {playbackRate === 1 ? "Normal" : `${playbackRate}x`}
						</p>
						<div className="flex gap-1.5 flex-wrap">
							{PLAYBACK_RATES.map((rate) => (
								<button
									key={rate}
									onClick={() => setPlaybackRate(rate)}
									className={`px-3 py-1.5 text-xs font-mono rounded border-2 transition-colors ${
										playbackRate === rate
											? "bg-foreground text-background border-foreground"
											: "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
									}`}
								>
									{rate === 1 ? "1x" : `${rate}x`}
								</button>
							))}
						</div>
					</div>

					{/* Crossfade */}
					<div className="px-5 py-4">
						<p className="text-sm font-semibold">Crossfade</p>
						<p className="mt-0.5 mb-3 text-xs text-muted-foreground">
							{crossfadeDuration === 0 ? "Disabled" : `${crossfadeDuration}s overlap between tracks`}
						</p>
						<div className="flex gap-1.5 flex-wrap">
							{CROSSFADE_OPTIONS.map((sec) => (
								<button
									key={sec}
									onClick={() => setCrossfadeDuration(sec)}
									className={`px-3 py-1.5 text-xs font-mono rounded border-2 transition-colors ${
										crossfadeDuration === sec
											? "bg-foreground text-background border-foreground"
											: "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
									}`}
								>
									{sec === 0 ? "Off" : `${sec}s`}
								</button>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Audio Cache */}
			<section>
				<h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
					Cache
				</h2>
				<AudioCacheManager />
			</section>
		</div>
	);
}
