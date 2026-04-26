"use client";

import { Button } from "@/components/ui/button";
import { useQueueStore } from "@/stores/useQueueStore";
import {
	Download,
	Loader2,
	CheckCircle2,
	Clock,
	AlertTriangle,
} from "lucide-react";

function CircularProgress({
	progress,
	size = 28,
	strokeWidth = 2.5,
}: {
	progress: number;
	size?: number;
	strokeWidth?: number;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (progress / 100) * circumference;
	return (
		<svg width={size} height={size} className="rotate-[-90deg]">
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				className="text-foreground/10"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className="text-primary transition-all duration-300"
			/>
		</svg>
	);
}

export function TrackDownloadStatus({
	trackId,
	isAlreadyDownloaded,
	apiLoading,
	onDownload,
}: {
	trackId: string | number;
	isAlreadyDownloaded: boolean;
	apiLoading: boolean;
	onDownload: () => void;
}) {
	const trackQueueItem = useQueueStore((s) => {
		const items = Object.values(s.queue);
		return items.find((item) => String(item.id) === String(trackId)) || null;
	});
	const dlStatus = trackQueueItem?.status || null;
	const dlProgress = trackQueueItem?.progress ?? 0;

	// Completed (from queue or from DB)
	if (dlStatus === "completed" || (!dlStatus && isAlreadyDownloaded)) {
		return (
			<span
				className="flex items-center justify-center size-7 text-foreground"
				title="Downloaded"
			>
				<CheckCircle2 className="size-3.5" />
			</span>
		);
	}

	// Downloading — show circular progress
	if (dlStatus === "downloading") {
		return (
			<span
				className="relative flex items-center justify-center size-7"
				title={`Downloading ${Math.round(dlProgress)}%`}
			>
				<CircularProgress progress={dlProgress} />
				<span className="absolute text-[7px] font-bold font-mono tabular-nums text-primary">
					{Math.round(dlProgress)}
				</span>
			</span>
		);
	}

	// In queue — waiting
	if (dlStatus === "inQueue") {
		return (
			<span
				className="flex items-center justify-center size-7 text-muted-foreground animate-pulse"
				title="In queue"
			>
				<Clock className="size-3.5" />
			</span>
		);
	}

	// Failed
	if (dlStatus === "failed") {
		return (
			<Button
				size="icon-xs"
				variant="ghost"
				className="size-7"
				onClick={onDownload}
				title="Retry download"
			>
				<AlertTriangle className="size-3.5 text-destructive" />
			</Button>
		);
	}

	// With errors
	if (dlStatus === "withErrors") {
		return (
			<span
				className="flex items-center justify-center size-7 text-primary"
				title="Completed with errors"
			>
				<AlertTriangle className="size-3.5" />
			</span>
		);
	}

	// Cancelling
	if (dlStatus === "cancelling") {
		return (
			<span className="flex items-center justify-center size-7 text-muted-foreground">
				<Loader2 className="size-3.5 animate-spin" />
			</span>
		);
	}

	// API loading (request sent, waiting for server response)
	if (apiLoading) {
		return (
			<span className="flex items-center justify-center size-7 text-muted-foreground">
				<Loader2 className="size-3.5 animate-spin" />
			</span>
		);
	}

	// Default — download button
	return (
		<Button size="icon-xs" variant="ghost" className="size-7" onClick={onDownload}>
			<Download className="size-3.5" />
		</Button>
	);
}
