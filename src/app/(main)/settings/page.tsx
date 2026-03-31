"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";

export default function SettingsPage() {
	const hlsEnabled = usePlayerStore((s) => s.hlsEnabled);
	const toggleHls = usePlayerStore((s) => s.toggleHls);

	return (
		<div className="mx-auto max-w-2xl px-4 py-8">
			<h1 className="mb-8 text-2xl font-bold uppercase tracking-wider">Settings</h1>

			<section>
				<h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
					Playback
				</h2>
				<div className="rounded-lg border border-border bg-card">
					<div className="flex items-center justify-between px-5 py-4">
						<div>
							<p className="text-sm font-semibold">HLS Streaming</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Stream audio in segments for faster start and better seeking. Disabling
								falls back to direct S3 URL or proxy.
							</p>
						</div>
						<button
							role="switch"
							aria-checked={hlsEnabled}
							onClick={toggleHls}
							className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								hlsEnabled ? "bg-foreground" : "bg-muted"
							}`}
						>
							<span
								className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${
									hlsEnabled ? "translate-x-5" : "translate-x-0"
								}`}
							/>
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
