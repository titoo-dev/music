"use client";

import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine } from "lucide-react";

export function DownloadTrigger() {
	const { queue } = useQueueStore();
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);
	const setDownloadsOpen = useAppStore((s) => s.setDownloadsOpen);

	const activeCount = Object.values(queue).filter((i) =>
		["downloading", "inQueue", "cancelling"].includes(i.status)
	).length;

	return (
		<Button
			variant="ghost"
			size="default"
			className={`relative gap-2 text-muted-foreground hover:text-foreground ${
				downloadsOpen ? "bg-muted text-foreground" : ""
			}`}
			onClick={() => setDownloadsOpen(!downloadsOpen)}
		>
			<ArrowDownToLine className="h-4 w-4" />
			<span className="hidden text-sm sm:inline">Downloads</span>
			{activeCount > 0 && (
				<Badge className="absolute -right-1 -top-1 h-4 min-w-4 animate-in fade-in border-0 bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
					{activeCount}
				</Badge>
			)}
		</Button>
	);
}
