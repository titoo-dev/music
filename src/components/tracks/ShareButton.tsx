"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useShareStore } from "@/stores/useShareStore";
import { ShareDialog } from "./ShareDialog";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
	trackId: string;
	duration?: number | null;
	title?: string | null;
	artist?: string | null;
	cover?: string | null;
	className?: string;
}

export function ShareButton({ trackId, duration, title, artist, cover, className }: ShareButtonProps) {
	const isShared = useShareStore((s) => s.shared.has(trackId));
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant="ghost"
							size="icon"
							aria-label={isShared ? "Manage share link" : "Share track"}
							className={cn("rounded-full active:scale-90", isShared && "bg-primary-container text-on-primary-container hover:bg-primary-container/80", className)}
							onClick={() => setDialogOpen(true)}
						/>
					}
				>
					{isShared ? (
						<LinkIcon className="size-4" />
					) : (
						<Share2 className="size-4" />
					)}
				</TooltipTrigger>
				<TooltipContent>{isShared ? "Manage share link" : "Share track"}</TooltipContent>
			</Tooltip>

			<ShareDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				trackId={trackId}
				duration={duration}
				title={title}
				artist={artist}
				cover={cover}
			/>
		</>
	);
}
