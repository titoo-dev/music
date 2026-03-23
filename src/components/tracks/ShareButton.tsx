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

interface ShareButtonProps {
	trackId: string;
	duration?: number | null;
	className?: string;
}

export function ShareButton({ trackId, duration, className }: ShareButtonProps) {
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
							className={className}
							onClick={() => setDialogOpen(true)}
						/>
					}
				>
					{isShared ? (
						<LinkIcon className="size-3.5 text-primary" />
					) : (
						<Share2 className="size-3.5" />
					)}
				</TooltipTrigger>
				<TooltipContent>{isShared ? "Manage share link" : "Share track"}</TooltipContent>
			</Tooltip>

			<ShareDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				trackId={trackId}
				duration={duration}
			/>
		</>
	);
}
