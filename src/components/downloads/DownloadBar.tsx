"use client";

import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";
import { QueueItem } from "./QueueItem";
import { postToServer } from "@/utils/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { ArrowDownToLine } from "lucide-react";

export function DownloadSheet() {
	const { queue } = useQueueStore();
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);
	const setDownloadsOpen = useAppStore((s) => s.setDownloadsOpen);

	const allItems = Object.values(queue);
	const activeItems = allItems.filter((i) =>
		["downloading", "inQueue", "cancelling"].includes(i.status)
	);
	const completedItems = allItems.filter((i) =>
		["completed", "withErrors", "failed"].includes(i.status)
	);
	const totalCount = allItems.length;

	const handleCancelAll = () => postToServer("cancel-all");
	const handleClearCompleted = () => postToServer("remove-finished");

	return (
		<Sheet open={downloadsOpen} onOpenChange={setDownloadsOpen}>
			<SheetTrigger
				render={
					<Button variant="ghost" size="default" className="relative gap-2 text-muted-foreground hover:text-foreground" />
				}
			>
				<ArrowDownToLine className="h-4 w-4" />
				<span className="hidden text-sm sm:inline">Downloads</span>
				{activeItems.length > 0 && (
					<Badge className="absolute -right-1 -top-1 h-4 min-w-4 border-0 bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
						{activeItems.length}
					</Badge>
				)}
			</SheetTrigger>

			<SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
				<SheetHeader className="pb-0">
					<div className="flex items-center justify-between">
						<SheetTitle className="text-base font-semibold">
							Downloads
						</SheetTitle>
						<div className="flex items-center gap-2">
							{activeItems.length > 0 && (
								<Button
									variant="ghost"
									size="xs"
									onClick={handleCancelAll}
									className="text-xs text-red-500 hover:text-red-600"
								>
									Cancel all
								</Button>
							)}
							{completedItems.length > 0 && (
								<Button
									variant="ghost"
									size="xs"
									onClick={handleClearCompleted}
									className="text-xs text-muted-foreground"
								>
									Clear finished
								</Button>
							)}
						</div>
					</div>
					<SheetDescription className="text-xs text-muted-foreground">
						{totalCount === 0
							? "No downloads yet"
							: `${activeItems.length} active, ${completedItems.length} completed`}
					</SheetDescription>
				</SheetHeader>

				<Separator />

				<ScrollArea className="flex-1 -mx-4">
					{totalCount === 0 && (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							<ArrowDownToLine className="mb-3 h-10 w-10 text-muted-foreground/20" />
							<p className="text-sm text-muted-foreground">
								No downloads yet
							</p>
							<p className="mt-1 text-xs text-muted-foreground/60">
								Search or paste a link to get started
							</p>
						</div>
					)}

					{activeItems.length > 0 && (
						<div>
							<div className="px-4 pb-1 pt-3">
								<p className="text-xs font-medium text-muted-foreground">
									Active
									<span className="ml-1.5 text-foreground">
										{activeItems.length}
									</span>
								</p>
							</div>
							{activeItems.map((item) => (
								<QueueItem key={item.uuid} item={item} />
							))}
						</div>
					)}

					{activeItems.length > 0 && completedItems.length > 0 && (
						<Separator className="my-1" />
					)}

					{completedItems.length > 0 && (
						<div>
							<div className="px-4 pb-1 pt-3">
								<p className="text-xs font-medium text-muted-foreground">
									Completed
									<span className="ml-1.5 text-foreground">
										{completedItems.length}
									</span>
								</p>
							</div>
							{completedItems.map((item) => (
								<QueueItem key={item.uuid} item={item} />
							))}
						</div>
					)}
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

// Keep the old export name for backwards compatibility
export const DownloadBar = DownloadSheet;
