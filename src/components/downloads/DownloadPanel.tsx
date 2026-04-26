"use client";

import { useEffect, useState } from "react";
import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { QueueItem } from "./QueueItem";
import { postToServer, fetchData } from "@/utils/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CoverImage } from "@/components/ui/cover-image";
import Link from "next/link";
import { ArrowDownToLine, X, History } from "lucide-react";

interface HistoryItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	coverUrl: string | null;
	downloadedAt: string;
}

type Tab = "all" | "active" | "done" | "failed";

const TABS: { key: Tab; label: string }[] = [
	{ key: "all", label: "ALL" },
	{ key: "active", label: "ACTIVE" },
	{ key: "done", label: "DONE" },
	{ key: "failed", label: "FAILED" },
];

export function DownloadPanel() {
	const { queue, clearCompleted } = useQueueStore();
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);
	const setDownloadsOpen = useAppStore((s) => s.setDownloadsOpen);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [tab, setTab] = useState<Tab>("all");

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
	const completedItems = allItems.filter((i) => i.status === "completed");
	const failedItems = allItems.filter((i) =>
		["failed", "withErrors"].includes(i.status)
	);

	const filteredItems =
		tab === "all"
			? allItems
			: tab === "active"
				? activeItems
				: tab === "done"
					? completedItems
					: failedItems;

	const downloadingCount = allItems.filter((i) => i.status === "downloading").length;
	const totalSpeed = "—"; // Speed not tracked client-side; placeholder

	const handleCancelAll = () => postToServer("downloads/cancel-all");
	const handleClearCompleted = async () => {
		await postToServer("downloads/clear-finished");
		clearCompleted();
	};

	return (
		<aside
			className={`
				fixed right-0 top-[calc(7.5rem+5px)] md:top-[calc(4rem+3px)] z-20 flex h-[calc(100%-7.5rem-5px)] md:h-[calc(100%-4rem-3px)] flex-col overflow-hidden
				bg-card transition-all duration-300 ease-in-out
				${downloadsOpen ? "w-full sm:w-[440px] translate-x-0 border-l-[3px] border-foreground shadow-[var(--shadow-brutal)]" : "w-0 translate-x-full border-l-0"}
			`}
		>
			<div className="flex min-w-0 w-full flex-col h-full">
				{/* Header — dark brutalist */}
				<div className="flex items-center justify-between border-b-[2px] border-foreground bg-foreground text-background px-[18px] py-3.5">
					<div className="min-w-0">
						<div className="text-[14px] font-black tracking-[0.08em] uppercase">
							DOWNLOAD QUEUE
						</div>
						<div className="font-mono text-[10px] opacity-70 mt-0.5 tracking-[0.05em]">
							{downloadingCount}× CONCURRENT · {totalSpeed}
						</div>
					</div>
					<button
						onClick={() => setDownloadsOpen(false)}
						aria-label="Close downloads"
						className="text-background hover:text-accent transition-colors"
					>
						<X className="h-4 w-4" strokeWidth={2.5} />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b-[2px] border-foreground">
					{TABS.map((t, i) => {
						const active = tab === t.key;
						const count =
							t.key === "all"
								? allItems.length
								: t.key === "active"
									? activeItems.length
									: t.key === "done"
										? completedItems.length
										: failedItems.length;
						return (
							<button
								key={t.key}
								onClick={() => setTab(t.key)}
								className={`flex-1 py-2.5 px-2 font-mono text-[10px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors ${
									i < TABS.length - 1 ? "border-r-[2px] border-foreground" : ""
								} ${active ? "bg-accent text-foreground" : "bg-card text-foreground hover:bg-foreground/5"}`}
							>
								{t.label}
								{count > 0 && (
									<span className="ml-1 opacity-70">({count})</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Content */}
				<ScrollArea className="flex-1 min-h-0 bg-card">
					{filteredItems.length === 0 && tab !== "all" && (
						<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
							<p className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">
								NO {tab.toUpperCase()} ITEMS
							</p>
						</div>
					)}

					{allItems.length === 0 && tab === "all" && (
						<div className="flex flex-col items-center justify-center py-20 px-6 text-center">
							<div className="mb-4 flex h-14 w-14 items-center justify-center border-[3px] border-foreground bg-muted">
								<ArrowDownToLine className="h-6 w-6 text-foreground" />
							</div>
							<p className="text-[12px] font-black uppercase tracking-[0.14em] text-foreground">
								QUEUE EMPTY
							</p>
							<p className="mt-2 text-[11px] text-muted-foreground font-mono uppercase tracking-[0.05em] max-w-[220px]">
								Search or paste a Deezer link to start downloading.
							</p>
						</div>
					)}

					{filteredItems.length > 0 && (
						<div>
							{filteredItems.map((item) => (
								<QueueItem key={item.uuid} item={item} />
							))}
						</div>
					)}

					{/* History (only on ALL tab) */}
					{tab === "all" && history.length > 0 && (
						<div>
							<div className="flex items-center justify-between px-[18px] pb-1.5 pt-4 border-t-[2px] border-foreground bg-muted">
								<p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
									<History className="h-3 w-3" />
									HISTORY · LAST {history.length}
								</p>
								<Link
									href="/download-history"
									className="text-[10px] font-mono font-bold text-primary hover:underline no-underline uppercase tracking-[0.1em]"
								>
									VIEW ALL ↗
								</Link>
							</div>
							<div>
								{history.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-3 px-[18px] py-2.5 hover:bg-foreground/5 transition-colors border-b border-foreground/15 last:border-b-0"
									>
										<div className="shrink-0">
											{item.coverUrl ? (
												<CoverImage src={item.coverUrl} className="h-9 w-9 border border-foreground/30" />
											) : (
												<div className="h-9 w-9 border border-foreground/30 bg-muted flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground">
													?
												</div>
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-[12px] font-bold leading-tight text-foreground">
												{item.title}
											</p>
											<p className="truncate text-[10px] font-mono leading-tight text-muted-foreground mt-0.5">
												{item.artist}
											</p>
										</div>
										<span className="shrink-0 text-[10px] font-mono text-muted-foreground tabular-nums">
											{new Date(item.downloadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="h-2" />
				</ScrollArea>

				{/* Footer */}
				<div className="flex items-center justify-between border-t-[2px] border-foreground bg-background px-[18px] py-2.5">
					<span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
						{activeItems.length} PENDING
					</span>
					<div className="flex gap-1.5">
						{activeItems.length > 0 && (
							<button
								onClick={handleCancelAll}
								className="px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-foreground hover:bg-destructive hover:text-white hover:border-destructive border-2 border-transparent transition-colors"
							>
								PAUSE ALL
							</button>
						)}
						{completedItems.length > 0 && (
							<button
								onClick={handleClearCompleted}
								className="px-3 py-1.5 border-2 border-foreground bg-card text-foreground font-mono text-[10px] font-bold tracking-[0.1em] uppercase shadow-[var(--shadow-brutal-sm)] hover:bg-accent active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] transition-colors"
							>
								CLEAR DONE
							</button>
						)}
					</div>
				</div>
			</div>
		</aside>
	);
}
