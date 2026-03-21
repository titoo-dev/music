"use client";

import type { QueueItem as QueueItemType } from "@/stores/useQueueStore";
import { postToServer } from "@/utils/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
	item: QueueItemType;
}

const statusConfig: Record<string, { label: string; className: string }> = {
	inQueue: {
		label: "Queued",
		className: "bg-muted text-muted-foreground",
	},
	downloading: {
		label: "Downloading",
		className: "bg-primary/10 text-primary",
	},
	completed: {
		label: "Done",
		className: "bg-emerald-50 text-emerald-600",
	},
	withErrors: {
		label: "Errors",
		className: "bg-amber-50 text-amber-600",
	},
	failed: {
		label: "Failed",
		className: "bg-red-50 text-red-600",
	},
	cancelling: {
		label: "Cancelling",
		className: "bg-muted text-muted-foreground",
	},
};

export function QueueItem({ item }: Props) {
	const handleRemove = () => {
		postToServer("remove-from-queue", { uuid: item.uuid });
	};

	const config = statusConfig[item.status] || {
		label: item.status,
		className: "bg-muted text-muted-foreground",
	};

	return (
		<div className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
			{/* Cover */}
			{item.cover ? (
				<img
					src={item.cover}
					alt=""
					className="h-10 w-10 shrink-0 rounded-md object-cover"
				/>
			) : (
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
					♪
				</div>
			)}

			{/* Info */}
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-foreground">
					{item.title}
				</p>
				<p className="truncate text-xs text-muted-foreground">
					{item.artist}
				</p>

				{/* Progress bar for downloading items */}
				{item.status === "downloading" && (
					<div className="mt-2">
						<Progress
							value={Math.min(item.progress || 0, 100)}
							className="[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:rounded-full [&_[data-slot=progress-track]]:bg-muted [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-primary"
						/>
						<div className="mt-1 flex justify-between text-xs text-muted-foreground">
							<span>
								{item.downloaded}/{item.size}
							</span>
							<span>{Math.round(item.progress || 0)}%</span>
						</div>
					</div>
				)}

				{/* Status badge for non-downloading items */}
				{item.status !== "downloading" && (
					<Badge
						variant="secondary"
						className={`mt-1.5 border-0 text-[11px] font-medium ${config.className}`}
					>
						{config.label}
					</Badge>
				)}
			</div>

			{/* Remove button - visible on hover */}
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={handleRemove}
				className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
			>
				<X className="h-3.5 w-3.5" />
			</Button>
		</div>
	);
}
