"use client";

import { useStems, type StemMode } from "@/hooks/useStems";
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCallback } from "react";

// Small wrapper around an action-row entry in TrackActionSheet that surfaces
// the stem-separation lifecycle: kick off a job, show progress while the
// worker is running, and indicate completion or failure.
//
// Visual styling matches the parent's <ActionRow> shape so it slots in
// without restyling the sheet.

interface StemsActionRowProps {
	trackId: string;
	defaultMode?: StemMode;
}

function statusLabel(
	status: ReturnType<typeof useStems>["status"],
	progress: number,
	mode: StemMode | null,
): string {
	switch (status) {
		case "requesting":
			return "Requesting…";
		case "queued":
			return "Queued — waiting for worker";
		case "processing":
			return `Separating stems… ${progress}%`;
		case "completed":
			return mode === "two_stems"
				? "Karaoke ready"
				: "Stems ready (6 tracks)";
		case "failed":
			return "Separation failed — tap to retry";
		case "idle":
		default:
			return "Generate stems (instrumental + voice)";
	}
}

export function StemsActionRow({
	trackId,
	defaultMode = "six_stems",
}: StemsActionRowProps) {
	const { status, progress, mode, errorMessage, requestSeparation } =
		useStems(trackId);

	const handleClick = useCallback(() => {
		// Block while a job is already in flight; let users retry on failure
		// or kick off a fresh run from idle/completed.
		if (status === "requesting" || status === "queued" || status === "processing") return;
		void requestSeparation(defaultMode);
	}, [status, requestSeparation, defaultMode]);

	const icon = (() => {
		switch (status) {
			case "requesting":
			case "queued":
			case "processing":
				return <Loader2 className="size-4 animate-spin" />;
			case "completed":
				return <CheckCircle2 className="size-4 text-green-600" />;
			case "failed":
				return <AlertCircle className="size-4 text-destructive" />;
			default:
				return <Sparkles className="size-4" />;
		}
	})();

	const isBusy =
		status === "requesting" ||
		status === "queued" ||
		status === "processing";

	return (
		<button
			onClick={handleClick}
			disabled={isBusy}
			className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:bg-accent/20 transition-colors text-foreground disabled:opacity-70"
			aria-label={statusLabel(status, progress, mode)}
		>
			<span className="shrink-0">{icon}</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold truncate">
					{statusLabel(status, progress, mode)}
				</p>
				{status === "failed" && errorMessage && (
					<p className="text-[11px] text-destructive truncate">
						{errorMessage}
					</p>
				)}
				{status === "processing" && (
					<div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-primary transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				)}
			</div>
		</button>
	);
}
