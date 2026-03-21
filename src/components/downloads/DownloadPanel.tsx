"use client";

import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { QueueItem } from "./QueueItem";
import { postToServer } from "@/utils/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
	ArrowDownToLine,
	X,
	Trash2,
	XCircle,
	ChevronRight,
} from "lucide-react";

export function DownloadPanel() {
	const { queue, clearCompleted } = useQueueStore();
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);
	const setDownloadsOpen = useAppStore((s) => s.setDownloadsOpen);

	const allItems = Object.values(queue);
	const activeItems = allItems.filter((i) =>
		["downloading", "inQueue", "cancelling"].includes(i.status)
	);
	const completedItems = allItems.filter((i) =>
		["completed", "withErrors", "failed"].includes(i.status)
	);

	const handleCancelAll = () => postToServer("downloads/cancel-all");
	const handleClearCompleted = async () => {
		await postToServer("downloads/clear-finished");
		clearCompleted();
	};

	return (
		<aside
			className={`
				fixed right-0 top-0 z-20 flex h-full flex-col overflow-hidden
				border-l border-border/40 bg-white
				transition-all duration-300 ease-in-out
				${downloadsOpen ? "w-[340px] translate-x-0" : "w-0 translate-x-full"}
			`}
		>
			{/* Collapse button - visible when panel is open */}
			{downloadsOpen && (
				<button
					onClick={() => setDownloadsOpen(false)}
					className="absolute -left-3 top-20 z-10 flex h-6 w-3 items-center justify-center rounded-l-md border border-r-0 border-border/40 bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<ChevronRight className="h-3 w-3" />
				</button>
			)}

			<div className="flex min-w-[340px] flex-col h-full">
				{/* Header */}
				<div className="flex h-14 items-center justify-between border-b border-border/40 px-4">
					<div className="flex items-center gap-2.5">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5">
							<ArrowDownToLine className="h-3.5 w-3.5 text-foreground" />
						</div>
						<div>
							<h2 className="text-sm font-semibold text-foreground leading-tight">
								Downloads
							</h2>
							<p className="text-[11px] text-muted-foreground leading-tight">
								{allItems.length === 0
									? "No items"
									: `${activeItems.length} active \u00b7 ${completedItems.length} done`}
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => setDownloadsOpen(false)}
						className="text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Action bar */}
				{(activeItems.length > 0 || completedItems.length > 0) && (
					<div className="flex items-center gap-1 border-b border-border/40 px-3 py-1.5">
						{activeItems.length > 0 && (
							<Button
								variant="ghost"
								size="xs"
								onClick={handleCancelAll}
								className="gap-1.5 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50"
							>
								<XCircle className="h-3 w-3" />
								Cancel all
							</Button>
						)}
						<div className="flex-1" />
						{completedItems.length > 0 && (
							<Button
								variant="ghost"
								size="xs"
								onClick={handleClearCompleted}
								className="gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
							>
								<Trash2 className="h-3 w-3" />
								Clear done
							</Button>
						)}
					</div>
				)}

				{/* Content */}
				<ScrollArea className="flex-1">
					{allItems.length === 0 && (
						<div className="flex flex-col items-center justify-center py-24 px-6 text-center">
							<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
								<ArrowDownToLine className="h-6 w-6 text-muted-foreground/40" />
							</div>
							<p className="text-sm font-medium text-muted-foreground">
								No downloads yet
							</p>
							<p className="mt-1.5 text-xs text-muted-foreground/60 leading-relaxed max-w-[200px]">
								Search for music or paste a Deezer link to start downloading
							</p>
						</div>
					)}

					{activeItems.length > 0 && (
						<div>
							<div className="px-4 pb-1 pt-3">
								<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
									Active
									<span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary normal-case tracking-normal">
										{activeItems.length}
									</span>
								</p>
							</div>
							<div className="space-y-0.5 px-1.5">
								{activeItems.map((item) => (
									<QueueItem key={item.uuid} item={item} />
								))}
							</div>
						</div>
					)}

					{completedItems.length > 0 && (
						<div>
							{activeItems.length > 0 && (
								<div className="mx-4 my-2 h-px bg-border/40" />
							)}
							<div className="px-4 pb-1 pt-3">
								<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
									Completed
									<span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 normal-case tracking-normal">
										{completedItems.length}
									</span>
								</p>
							</div>
							<div className="space-y-0.5 px-1.5">
								{completedItems.map((item) => (
									<QueueItem key={item.uuid} item={item} />
								))}
							</div>
						</div>
					)}

					{/* Bottom padding for scroll */}
					<div className="h-4" />
				</ScrollArea>
			</div>
		</aside>
	);
}
