"use client";

import type { QueueItem as QueueItemType } from "@/stores/useQueueStore";
import { postToServer } from "@/utils/api";

interface Props {
	item: QueueItemType;
}

const statusLabels: Record<string, string> = {
	inQueue: "In Queue",
	downloading: "Downloading",
	completed: "Completed",
	withErrors: "Completed with errors",
	failed: "Failed",
	cancelling: "Cancelling...",
};

const statusColors: Record<string, string> = {
	inQueue: "var(--text-muted)",
	downloading: "var(--primary)",
	completed: "var(--success)",
	withErrors: "var(--warning)",
	failed: "var(--danger)",
	cancelling: "var(--warning)",
};

export function QueueItem({ item }: Props) {
	const handleRemove = () => {
		postToServer("remove-from-queue", { uuid: item.uuid });
	};

	return (
		<div
			className="px-4 py-3 flex gap-3 items-center transition-colors group"
			style={{ borderBottom: "1px solid var(--border)" }}
		>
			{/* Cover */}
			<div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
				{item.cover ? (
					<img src={item.cover} alt="" className="w-full h-full object-cover" />
				) : (
					<div
						className="w-full h-full flex items-center justify-center text-sm"
						style={{ background: "var(--bg-tertiary)" }}
					>
						🎵
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<div className="text-sm truncate">{item.title}</div>
				<div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
					{item.artist}
				</div>

				{/* Progress */}
				{item.status === "downloading" && (
					<div className="mt-1">
						<div className="progress-bar">
							<div
								className="fill"
								style={{ width: `${Math.min(item.progress || 0, 100)}%` }}
							/>
						</div>
						<div className="flex justify-between text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
							<span>
								{item.downloaded}/{item.size}
							</span>
							<span>{Math.round(item.progress || 0)}%</span>
						</div>
					</div>
				)}

				{/* Status */}
				{item.status !== "downloading" && (
					<span className="text-xs" style={{ color: statusColors[item.status] || "var(--text-muted)" }}>
						{statusLabels[item.status] || item.status}
					</span>
				)}
			</div>

			{/* Remove button */}
			<button
				onClick={handleRemove}
				className="opacity-0 group-hover:opacity-100 transition-opacity text-sm cursor-pointer"
				style={{ color: "var(--text-muted)" }}
				title="Remove"
			>
				✕
			</button>
		</div>
	);
}
