"use client";

import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { QueueItem } from "./QueueItem";
import { postToServer } from "@/utils/api";

export function DownloadBar() {
	const { queue, queueOrder } = useQueueStore();
	const slimDownloads = useAppStore((s) => s.slimDownloads);
	const toggleSlimDownloads = useAppStore((s) => s.toggleSlimDownloads);

	const allItems = Object.values(queue);
	const activeItems = allItems.filter((i) =>
		["downloading", "inQueue", "cancelling"].includes(i.status)
	);
	const completedItems = allItems.filter((i) =>
		["completed", "withErrors", "failed"].includes(i.status)
	);

	const handleCancelAll = () => postToServer("cancel-all");
	const handleClearCompleted = () => postToServer("remove-finished");

	if (slimDownloads) {
		return (
			<div
				className="fixed right-0 top-0 h-full flex flex-col items-center py-4 px-2 z-20"
				style={{
					width: "50px",
					background: "var(--bg-secondary)",
					borderLeft: "1px solid var(--border)",
				}}
			>
				<button onClick={toggleSlimDownloads} className="text-lg cursor-pointer">
					📥
				</button>
				{activeItems.length > 0 && (
					<span
						className="mt-2 w-6 h-6 rounded-full text-xs flex items-center justify-center text-white"
						style={{ background: "var(--primary)" }}
					>
						{activeItems.length}
					</span>
				)}
			</div>
		);
	}

	return (
		<aside
			className="fixed right-0 top-0 h-full flex flex-col z-20 overflow-hidden"
			style={{
				width: "var(--download-bar-width)",
				background: "var(--bg-secondary)",
				borderLeft: "1px solid var(--border)",
			}}
		>
			{/* Header */}
			<div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
				<h2 className="text-sm font-semibold">Downloads</h2>
				<div className="flex gap-2">
					{activeItems.length > 0 && (
						<button onClick={handleCancelAll} className="text-xs btn-danger px-2 py-1 rounded">
							Cancel All
						</button>
					)}
					{completedItems.length > 0 && (
						<button onClick={handleClearCompleted} className="text-xs btn-secondary px-2 py-1 rounded">
							Clear
						</button>
					)}
					<button onClick={toggleSlimDownloads} className="text-lg cursor-pointer">
						▶
					</button>
				</div>
			</div>

			{/* Queue */}
			<div className="flex-1 overflow-y-auto">
				{activeItems.length === 0 && completedItems.length === 0 && (
					<div className="p-6 text-center" style={{ color: "var(--text-muted)" }}>
						<p className="text-2xl mb-2">📥</p>
						<p className="text-sm">No downloads</p>
					</div>
				)}

				{activeItems.length > 0 && (
					<div>
						<div className="px-4 py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
							Active ({activeItems.length})
						</div>
						{activeItems.map((item) => (
							<QueueItem key={item.uuid} item={item} />
						))}
					</div>
				)}

				{completedItems.length > 0 && (
					<div>
						<div className="px-4 py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
							Completed ({completedItems.length})
						</div>
						{completedItems.map((item) => (
							<QueueItem key={item.uuid} item={item} />
						))}
					</div>
				)}
			</div>
		</aside>
	);
}
