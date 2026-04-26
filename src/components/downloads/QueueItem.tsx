"use client";

import { useState } from "react";
import type { QueueItem as QueueItemType } from "@/stores/useQueueStore";
import { postToServer } from "@/utils/api";
import { CoverImage } from "@/components/ui/cover-image";
import { X, Loader2, RotateCw, ChevronDown, ChevronUp, XCircle } from "lucide-react";

interface Props {
	item: QueueItemType;
}

const bitrateLabels: Record<number, string> = {
	9: "FLAC",
	3: "320",
	1: "128",
	15: "360HQ",
	14: "360MQ",
	13: "360LQ",
	0: "MP3",
};

const SEGMENTS = 20;

function ChunkedProgress({
	progress,
	status,
}: {
	progress: number;
	status: string;
}) {
	const cells = Array.from({ length: SEGMENTS });
	const filledCount = Math.min(SEGMENTS, Math.round((progress / 100) * SEGMENTS));

	return (
		<div className="flex gap-[2px] h-2">
			{cells.map((_, i) => {
				const filled = status === "completed" || i < filledCount;
				const isNext = status === "downloading" && i === filledCount;
				let bg = "bg-muted";
				if (status === "failed") {
					bg = i < 4 ? "bg-destructive" : "bg-muted";
				} else if (filled) {
					bg = status === "completed" ? "bg-accent" : "bg-primary";
				} else if (isNext) {
					bg = "bg-primary/50";
				}
				return <div key={i} className={`flex-1 border border-foreground ${bg}`} />;
			})}
		</div>
	);
}

export function QueueItem({ item }: Props) {
	const [showErrors, setShowErrors] = useState(false);
	const [retrying, setRetrying] = useState(false);

	const handleRemove = () => {
		postToServer("downloads/cancel", { uuid: item.uuid });
	};

	const handleRetry = async () => {
		setRetrying(true);
		try {
			await postToServer("downloads/retry", { uuid: item.uuid });
		} catch {
			// ignore
		} finally {
			setRetrying(false);
		}
	};

	const isDownloading = item.status === "downloading";
	const isFailed = item.status === "failed";
	const isInQueue = item.status === "inQueue" || item.status === "cancelling";
	const isCompleted = item.status === "completed";
	const hasErrors = item.errors?.length > 0;
	const progressPercent = Math.min(item.progress || 0, 100);
	const bitrateLabel = bitrateLabels[item.bitrate] || "";

	const statusLabel = isCompleted
		? "✓ DONE"
		: isFailed
			? "✗ FAILED"
			: isInQueue
				? "WAITING"
				: `${Math.round(progressPercent)}%`;

	const statusClass = isCompleted
		? "text-foreground"
		: isFailed
			? "text-destructive"
			: "text-foreground";

	return (
		<div className="border-b border-foreground/15 last:border-b-0 px-[18px] py-3">
			<div className="flex items-center gap-3">
				{/* Cover */}
				<div className="relative shrink-0">
					<CoverImage src={item.cover} className="h-10 w-10 border-2 border-foreground" />
				</div>

				{/* Info */}
				<div className="min-w-0 flex-1">
					{/* Title + count */}
					<div className="flex items-center justify-between gap-2 mb-0.5">
						<p className="truncate text-[13px] font-extrabold tracking-[-0.01em] uppercase leading-tight text-foreground">
							{item.title}
						</p>
						{item.size > 1 && (
							<span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
								{item.downloaded}/{item.size}
							</span>
						)}
					</div>
					<p className="truncate text-[10px] font-mono leading-tight text-muted-foreground mb-1.5 uppercase tracking-[0.05em] font-medium">
						{item.artist}
					</p>

					{/* Chunked progress */}
					<ChunkedProgress progress={progressPercent} status={item.status} />

					{/* Bottom line */}
					<div className="mt-1 flex items-center justify-between font-mono text-[9px] tracking-[0.05em] uppercase">
						<span className={`${statusClass} font-bold`}>
							{bitrateLabel && <span>{bitrateLabel}</span>}
							{bitrateLabel && <span className="opacity-50"> · </span>}
							<span>{statusLabel}</span>
							{hasErrors && (
								<button
									onClick={() => setShowErrors(!showErrors)}
									className="ml-2 inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
								>
									{item.errors.length} ERR
									{showErrors ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
								</button>
							)}
						</span>
						{isDownloading && progressPercent < 100 && (
							<span className="text-muted-foreground">
								~{Math.max(1, Math.round((100 - progressPercent) / 10))}s
							</span>
						)}
					</div>
				</div>

				{/* Action button */}
				<div className="shrink-0">
					{isFailed ? (
						<button
							onClick={handleRetry}
							disabled={retrying}
							aria-label="Retry"
							className="text-muted-foreground hover:text-primary transition-colors p-1"
						>
							{retrying ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<RotateCw className="h-3.5 w-3.5" />
							)}
						</button>
					) : (
						<button
							onClick={handleRemove}
							aria-label="Remove"
							className="text-muted-foreground hover:text-destructive transition-colors p-1"
						>
							<X className="h-3.5 w-3.5" strokeWidth={2.5} />
						</button>
					)}
				</div>
			</div>

			{/* Expandable error list */}
			{showErrors && hasErrors && (
				<div className="mt-2">
					<div className="border-2 border-destructive bg-destructive/10 p-2 text-[10px] text-destructive max-h-32 overflow-y-auto space-y-1">
						{item.errors.map((err: any, i: number) => (
							<div key={i} className="flex gap-1">
								<XCircle className="h-3 w-3 shrink-0 mt-0.5" />
								<span>
									{err.data?.artist && err.data?.title
										? `${err.data.artist} - ${err.data.title}: `
										: ""}
									{err.message || "Unknown error"}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
