"use client";

import { useEffect, useState } from "react";
import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { QueueItem } from "./QueueItem";
import { postToServer, fetchData } from "@/utils/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import Link from "next/link";
import {
	ArrowDownToLine,
	X,
	Trash2,
	XCircle,
	ChevronRight,
	History,
} from "lucide-react";

interface HistoryItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	coverUrl: string | null;
	downloadedAt: string;
}

export function DownloadPanel() {
	const { queue, clearCompleted } = useQueueStore();
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);
	const setDownloadsOpen = useAppStore((s) => s.setDownloadsOpen);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const [history, setHistory] = useState<HistoryItem[]>([]);

	useEffect(() => {
		if (!downloadsOpen || !isAuthenticated) return;
		async function loadHistory() {
			try {
				const data = await fetchData("downloads/history", { limit: "20" });
				setHistory(data.items || []);
			} catch {
				// ignore
			}
		}
		loadHistory();
	}, [downloadsOpen, isAuthenticated, Object.keys(queue).length]);

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
				fixed right-0 top-[calc(7.5rem+5px)] md:top-[calc(4rem+3px)] z-20 flex h-[calc(100%-7.5rem-5px)] md:h-[calc(100%-4rem-3px)] flex-col overflow-hidden
				bg-background transition-all duration-300 ease-in-out
				${downloadsOpen ? "w-full sm:w-[340px] translate-x-0 border-l-[3px] border-foreground" : "w-0 translate-x-full border-l-0"}
			`}
		>
			{/* Collapse button */}
			{downloadsOpen && (
				<button
					onClick={() => setDownloadsOpen(false)}
					className="absolute -left-4 top-6 z-10 hidden sm:flex h-7 w-4 items-center justify-center border-[2px] border-r-0 border-foreground bg-background text-foreground transition-colors hover:bg-accent"
				>
					<ChevronRight className="h-3 w-3" />
				</button>
			)}

			<div className="flex min-w-0 w-full flex-col h-full">
				{/* Header */}
				<div className="flex items-center justify-between border-b-[3px] border-foreground px-4 py-4">
					<div className="flex items-center gap-2.5">
						<div className="flex h-7 w-7 items-center justify-center border-[2px] border-foreground bg-accent">
							<ArrowDownToLine className="h-3.5 w-3.5 text-foreground" />
						</div>
						<div>
							<h2 className="text-sm font-black text-foreground leading-tight uppercase tracking-wider">
								Downloads
							</h2>
							<p className="text-[11px] text-muted-foreground leading-tight font-mono font-bold">
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
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Action bar */}
				{(activeItems.length > 0 || completedItems.length > 0) && (
					<div className="flex items-center gap-1 border-b-[2px] border-foreground px-3 py-1.5">
						{activeItems.length > 0 && (
							<Button
								variant="ghost"
								size="xs"
								onClick={handleCancelAll}
								className="gap-1.5 text-[11px] text-destructive hover:bg-destructive/10"
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
								className="gap-1.5 text-[11px]"
							>
								<Trash2 className="h-3 w-3" />
								Clear done
							</Button>
						)}
					</div>
				)}

				{/* Content */}
				<ScrollArea className="flex-1 min-h-0">
					{allItems.length === 0 && (
						<div className="flex flex-col items-center justify-center py-24 px-6 text-center">
							<div className="mb-4 flex h-14 w-14 items-center justify-center border-2 sm:border-[3px] border-foreground bg-muted">
								<ArrowDownToLine className="h-6 w-6 text-muted-foreground" />
							</div>
							<p className="text-sm font-bold text-foreground uppercase tracking-wider">
								No downloads yet
							</p>
							<p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-[200px]">
								Search for music or paste a Deezer link to start downloading
							</p>
						</div>
					)}

					{activeItems.length > 0 && (
						<div>
							<div className="px-4 pb-1 pt-3">
								<p className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground">
									Active
									<span className="ml-1.5 inline-flex items-center justify-center border-[2px] border-foreground bg-accent px-1.5 py-0 text-[10px] font-black text-foreground">
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
								<div className="mx-4 my-2 h-[2px] bg-foreground" />
							)}
							<div className="px-4 pb-1 pt-3">
								<p className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground">
									Completed
									<span className="ml-1.5 inline-flex items-center justify-center border-[2px] border-foreground bg-accent px-1.5 py-0 text-[10px] font-black text-foreground">
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

					{/* Download History */}
					{history.length > 0 && (
						<div>
							{(activeItems.length > 0 || completedItems.length > 0) && (
								<div className="mx-4 my-2 h-[2px] bg-foreground" />
							)}
							<div className="flex items-center justify-between px-4 pb-1 pt-3">
								<p className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground">
									<History className="inline h-3 w-3 mr-1 -mt-0.5" />
									History
									<span className="ml-1.5 inline-flex items-center justify-center border-[2px] border-foreground bg-muted px-1.5 py-0 text-[10px] font-black text-foreground">
										{history.length}
									</span>
								</p>
								<Link href="/download-history" className="text-[10px] font-bold text-primary hover:underline no-underline uppercase tracking-wider">
									View all
								</Link>
							</div>
							<div className="space-y-0.5 px-1.5">
								{history.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-3 px-2.5 py-2 hover:bg-muted transition-colors border-b border-foreground/10 last:border-b-0"
									>
										<div className="shrink-0">
											{item.coverUrl ? (
												<CoverImage
													src={item.coverUrl}
													className="h-10 w-10"
												/>
											) : (
												<div className="h-10 w-10 border-[2px] border-foreground bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
													?
												</div>
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-[13px] font-bold leading-tight text-foreground">
												{item.title}
											</p>
											<p className="truncate text-[11px] leading-tight text-muted-foreground mt-0.5">
												{item.artist}
											</p>
											<p className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono">
												{new Date(item.downloadedAt).toLocaleDateString()}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="h-4" />
				</ScrollArea>
			</div>
		</aside>
	);
}
