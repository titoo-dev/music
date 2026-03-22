"use client";

import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Check } from "lucide-react";

function ProgressRing({
	progress,
	size = 32,
	strokeWidth = 2.5,
}: {
	progress: number;
	size?: number;
	strokeWidth?: number;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (progress / 100) * circumference;
	return (
		<svg
			width={size}
			height={size}
			className="absolute inset-0 m-auto rotate-[-90deg] pointer-events-none"
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				className="text-foreground/10"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className="text-primary transition-all duration-300"
			/>
		</svg>
	);
}

export function DownloadTrigger() {
	const { queue } = useQueueStore();
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);
	const setDownloadsOpen = useAppStore((s) => s.setDownloadsOpen);

	const items = Object.values(queue);
	const activeItems = items.filter((i) =>
		["downloading", "inQueue", "cancelling"].includes(i.status)
	);
	const downloadingItem = items.find((i) => i.status === "downloading");
	const activeCount = activeItems.length;
	const hasActive = activeCount > 0;

	// Compute global progress: current downloading item progress + completed active items
	const completedActive = activeItems.filter(
		(i) => i.status !== "downloading" && i.status !== "inQueue"
	).length;
	const globalProgress = hasActive
		? ((completedActive + (downloadingItem?.progress ?? 0) / 100) /
				activeCount) *
			100
		: 0;

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
			{hasActive && <ProgressRing progress={globalProgress} />}
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
