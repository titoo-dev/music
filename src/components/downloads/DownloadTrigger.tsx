"use client";

import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { ArrowDownToLine, Check } from "lucide-react";

export function DownloadTrigger() {
	const { queue } = useQueueStore();
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);
	const setDownloadsOpen = useAppStore((s) => s.setDownloadsOpen);

	const items = Object.values(queue);
	const activeItems = items.filter((i) =>
		["downloading", "inQueue", "cancelling"].includes(i.status)
	);
	const activeCount = activeItems.length;
	const hasActive = activeCount > 0;

	const allDone =
		!hasActive &&
		items.length > 0 &&
		items.every((i) =>
			["completed", "withErrors", "failed"].includes(i.status)
		);

	const stateClass = downloadsOpen
		? "bg-foreground text-background"
		: hasActive
			? "bg-primary text-white"
			: "bg-card text-foreground";

	return (
		<button
			onClick={() => setDownloadsOpen(!downloadsOpen)}
			aria-label="Downloads"
			aria-pressed={downloadsOpen}
			className={`flex items-center gap-2 h-9 px-3 border-2 border-foreground shadow-[var(--shadow-brutal-sm)] font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition-colors active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-active)] ${stateClass}`}
		>
			{allDone ? (
				<Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
			) : (
				<ArrowDownToLine
					className={`h-3.5 w-3.5 shrink-0 ${hasActive ? "animate-pulse" : ""}`}
				/>
			)}
			<span className="hidden sm:inline">DOWNLOADS</span>
			{activeCount > 0 && (
				<span className="flex items-center justify-center h-5 min-w-5 px-1 border border-foreground bg-accent text-foreground text-[10px] font-black tabular-nums">
					{activeCount}
				</span>
			)}
		</button>
	);
}
