"use client";

import { useState } from "react";
import type { QueueItem as QueueItemType } from "@/stores/useQueueStore";
import { postToServer } from "@/utils/api";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { X, Check, AlertTriangle, XCircle, Loader2, Clock, RotateCw, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
	item: QueueItemType;
}

const bitrateLabels: Record<number, string> = {
	9: "FLAC",
	3: "320",
	1: "128",
	15: "360 HQ",
	14: "360 MQ",
	13: "360 LQ",
	0: "MP3",
};

const statusConfig: Record<
	string,
	{ label: string; icon: React.ReactNode; className: string; bgClass: string }
> = {
	inQueue: {
		label: "Queued",
		icon: <Clock className="h-3 w-3" />,
		className: "text-muted-foreground",
		bgClass: "bg-muted/50",
	},
	downloading: {
		label: "Downloading",
		icon: <Loader2 className="h-3 w-3 animate-spin" />,
		className: "text-primary",
		bgClass: "bg-primary/5",
	},
	completed: {
		label: "Done",
		icon: <Check className="h-3 w-3" />,
		className: "text-emerald-600",
		bgClass: "bg-emerald-50",
	},
	withErrors: {
		label: "Errors",
		icon: <AlertTriangle className="h-3 w-3" />,
		className: "text-amber-600",
		bgClass: "bg-amber-50",
	},
	failed: {
		label: "Failed",
		icon: <XCircle className="h-3 w-3" />,
		className: "text-red-500",
		bgClass: "bg-red-50",
	},
	cancelling: {
		label: "Cancelling",
		icon: <Loader2 className="h-3 w-3 animate-spin" />,
		className: "text-muted-foreground",
		bgClass: "bg-muted/50",
	},
};

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

	const config = statusConfig[item.status] || {
		label: item.status,
		icon: null,
		className: "text-muted-foreground",
		bgClass: "bg-muted/50",
	};

	const isDownloading = item.status === "downloading";
	const isFailed = item.status === "failed";
	const hasErrors = item.errors?.length > 0;
	const progressPercent = Math.min(item.progress || 0, 100);
	const bitrateLabel = bitrateLabels[item.bitrate] || "";

	return (
		<div
			className={`group relative flex flex-col overflow-hidden transition-colors hover:bg-accent/20 border-b border-foreground/10 last:border-b-0 ${
				isDownloading ? "bg-accent/10" : ""
			}`}
		>
			<div className="flex items-center gap-3 px-2.5 py-2">
				{/* Cover */}
				<div className="relative shrink-0">
					<CoverImage
						src={item.cover}
						className="h-10 w-10"
					/>
					{item.status === "completed" && (
						<div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center bg-accent text-foreground border border-foreground">
							<Check className="h-2.5 w-2.5" strokeWidth={3} />
						</div>
					)}
				</div>

				{/* Info */}
				<div className="min-w-0 flex-1">
					<p className="truncate text-[13px] font-bold leading-tight text-foreground">
						{item.title}
					</p>
					<p className="truncate text-[11px] leading-tight text-muted-foreground mt-0.5">
						{item.artist}
						{bitrateLabel && (
							<span className="ml-1.5 text-[10px] font-mono font-bold text-muted-foreground/60">
								{bitrateLabel}
							</span>
						)}
					</p>

					{/* Progress for downloading items */}
					{isDownloading && (
						<div className="mt-1.5">
							<div className="flex items-center gap-2">
								<div className="flex-1">
									<Progress
										value={progressPercent}
										className="[&_[data-slot=progress-track]]:h-1 [&_[data-slot=progress-track]]:rounded-full [&_[data-slot=progress-track]]:bg-primary/10 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-indicator]]:transition-all"
									/>
								</div>
								<span className="shrink-0 text-[10px] font-bold font-mono tabular-nums text-primary">
									{Math.round(progressPercent)}%
								</span>
							</div>
							{item.size > 1 && (
								<p className="mt-0.5 text-[10px] font-mono tabular-nums text-muted-foreground/70">
									{item.downloaded}/{item.size} tracks
								</p>
							)}
						</div>
					)}

					{/* Status for non-downloading items */}
					{!isDownloading && item.status !== "completed" && (
						<div className={`mt-1 inline-flex items-center gap-1 ${config.className}`}>
							{config.icon}
							<span className="text-[10px] font-medium">{config.label}</span>
							{hasErrors && (
								<button
									onClick={() => setShowErrors(!showErrors)}
									className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
								>
									{item.errors.length} error{item.errors.length > 1 ? "s" : ""}
									{showErrors ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
								</button>
							)}
						</div>
					)}
				</div>

				{/* Action buttons */}
				<div className="flex shrink-0 items-center gap-0.5">
					{isFailed && (
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={handleRetry}
							disabled={retrying}
							className="text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
							title="Retry download"
						>
							{retrying ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<RotateCw className="h-3 w-3" />
							)}
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={handleRemove}
						className="text-muted-foreground/50 hover:text-red-500 hover:bg-red-50"
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{/* Expandable error list */}
			{showErrors && hasErrors && (
				<div className="px-3 pb-2">
					<div className="rounded border border-red-200 bg-red-50 p-2 text-[10px] text-red-700 max-h-32 overflow-y-auto space-y-1">
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
