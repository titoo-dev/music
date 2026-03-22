"use client";

import type { QueueItem as QueueItemType } from "@/stores/useQueueStore";
import { postToServer } from "@/utils/api";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { X, Check, AlertTriangle, XCircle, Loader2, Clock } from "lucide-react";

interface Props {
	item: QueueItemType;
}

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
	const handleRemove = () => {
		postToServer("downloads/cancel", { uuid: item.uuid });
	};


	const config = statusConfig[item.status] || {
		label: item.status,
		icon: null,
		className: "text-muted-foreground",
		bgClass: "bg-muted/50",
	};

	const isDownloading = item.status === "downloading";
	const progressPercent = Math.min(item.progress || 0, 100);

	return (
		<div
			className={`group relative flex items-center gap-3 px-2.5 py-2 overflow-hidden transition-colors hover:bg-accent/20 border-b border-foreground/10 last:border-b-0 ${
				isDownloading ? "bg-accent/10" : ""
			}`}
		>
			{/* Cover */}
			<div className="relative shrink-0">
				<CoverImage
					src={item.cover}
					className="h-10 w-10"
				/>
				{/* Status indicator dot */}
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
						<p className="mt-0.5 text-[10px] font-mono tabular-nums text-muted-foreground/70">
							{item.downloaded}/{item.size} tracks
						</p>
					</div>
				)}

				{/* Status for non-downloading items (skip completed — cover badge is enough) */}
				{!isDownloading && item.status !== "completed" && (
					<div className={`mt-1 inline-flex items-center gap-1 ${config.className}`}>
						{config.icon}
						<span className="text-[10px] font-medium">{config.label}</span>
					</div>
				)}
			</div>

			{/* Action buttons */}
			<div className="flex shrink-0 items-center gap-0.5">
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
	);
}
