"use client";

import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
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

	// Recently completed: all done and nothing active
	const allDone =
		!hasActive &&
		items.length > 0 &&
		items.every((i) =>
			["completed", "withErrors", "failed"].includes(i.status)
		);

	return (
		<Button
			variant={downloadsOpen ? "secondary" : "ghost"}
			size="icon"
			className="relative size-9"
			onClick={() => setDownloadsOpen(!downloadsOpen)}
		>
			{allDone ? (
				<Check className="h-4 w-4 text-emerald-500" />
			) : (
				<ArrowDownToLine
					className={`h-4 w-4 ${hasActive ? "animate-pulse" : ""}`}
				/>
			)}
			{activeCount > 0 && (
				<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center border-[1.5px] border-foreground bg-primary px-0.5 text-[9px] font-black text-primary-foreground">
					{activeCount}
				</span>
			)}
		</Button>
	);
}
