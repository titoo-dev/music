"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Loader2,
	Link as LinkIcon,
	Clock,
	Infinity as InfinityIcon,
	Copy,
	Trash2,
} from "lucide-react";
import { useShareStore } from "@/stores/useShareStore";

const EXPIRY_OPTIONS = [
	{ label: "24 hours", hours: 24 },
	{ label: "7 days", hours: 168 },
	{ label: "30 days", hours: 720 },
	{ label: "Never", hours: null },
] as const;

interface ShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trackId: string;
	duration?: number | null;
	onShared?: () => void;
}

export function ShareDialog({
	open,
	onOpenChange,
	trackId,
	duration,
	onShared,
}: ShareDialogProps) {
	const existingShareId = useShareStore((s) => s.shared.get(trackId) ?? null);
	const addShare = useShareStore((s) => s.add);
	const removeShare = useShareStore((s) => s.remove);

	const [selected, setSelected] = useState<number | null>(null);
	const [state, setState] = useState<"idle" | "loading" | "done" | "error" | "revoking" | "revoked">("idle");
	const [errorMsg, setErrorMsg] = useState("");

	const handleCreate = useCallback(
		async (hours: number | null) => {
			setSelected(hours);
			setState("loading");
			setErrorMsg("");
			try {
				const res = await fetch("/api/v1/shares", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						trackId,
						duration: duration ?? null,
						expiresIn: hours,
					}),
				});
				const json = await res.json();
				if (json.success && json.data?.shareId) {
					addShare(trackId, json.data.shareId);
					const shareUrl = `${window.location.origin}/share/t/${json.data.shareId}`;
					await navigator.clipboard.writeText(shareUrl).catch(() => {});
					if (navigator.vibrate) navigator.vibrate(30);
					setState("done");
					setTimeout(() => {
						onOpenChange(false);
						onShared?.();
						setState("idle");
						setSelected(null);
					}, 1000);
				} else {
					setErrorMsg(
						json.error?.code === "NOT_DOWNLOADED"
							? "Download this track first"
							: "Failed to create link"
					);
					setState("error");
				}
			} catch {
				setErrorMsg("Network error");
				setState("error");
			}
		},
		[trackId, duration, addShare, onOpenChange, onShared]
	);

	const handleCopy = useCallback(async () => {
		if (!existingShareId) return;
		const shareUrl = `${window.location.origin}/share/t/${existingShareId}`;
		await navigator.clipboard.writeText(shareUrl).catch(() => {});
		if (navigator.vibrate) navigator.vibrate(30);
		setState("done");
		setTimeout(() => {
			onOpenChange(false);
			setState("idle");
		}, 1000);
	}, [existingShareId, onOpenChange]);

	const handleRevoke = useCallback(async () => {
		if (!existingShareId) return;
		setState("revoking");
		try {
			const res = await fetch(`/api/v1/shares/${existingShareId}`, {
				method: "DELETE",
				credentials: "include",
			});
			const json = await res.json();
			if (json.success) {
				removeShare(trackId);
				setState("revoked");
				setTimeout(() => {
					onOpenChange(false);
					setState("idle");
				}, 1000);
			} else {
				setErrorMsg("Failed to revoke link");
				setState("error");
			}
		} catch {
			setErrorMsg("Network error");
			setState("error");
		}
	}, [existingShareId, trackId, removeShare, onOpenChange]);

	const handleOpenChange = useCallback(
		(v: boolean) => {
			onOpenChange(v);
			if (!v) {
				setState("idle");
				setSelected(null);
				setErrorMsg("");
			}
		},
		[onOpenChange]
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={state !== "loading" && state !== "revoking"}>
				<DialogHeader>
					<DialogTitle>
						{existingShareId ? "Share link" : "Share track"}
					</DialogTitle>
					<DialogDescription>
						{existingShareId
							? "This track has an active share link."
							: "Choose how long the link stays active."}
					</DialogDescription>
				</DialogHeader>

				{state === "done" ? (
					<div className="flex flex-col items-center gap-3 py-4">
						<LinkIcon className="size-8 text-emerald-500" />
						<p className="text-sm font-bold">Link copied!</p>
					</div>
				) : state === "revoked" ? (
					<div className="flex flex-col items-center gap-3 py-4">
						<Trash2 className="size-8 text-muted-foreground" />
						<p className="text-sm font-bold">Link revoked</p>
					</div>
				) : state === "error" ? (
					<div className="flex flex-col items-center gap-3 py-4">
						<p className="text-sm font-bold text-red-500">{errorMsg}</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setState("idle")}
						>
							Try again
						</Button>
					</div>
				) : existingShareId ? (
					/* ─── Manage existing share ─── */
					<div className="flex flex-col gap-2">
						<button
							onClick={handleCopy}
							className="flex items-center gap-3 px-3 py-3 text-left border-2 border-foreground bg-background hover:bg-accent/20 active:shadow-[var(--shadow-brutal-active)] active:translate-x-[1px] active:translate-y-[1px] shadow-[var(--shadow-brutal-sm)] transition-all"
						>
							<Copy className="size-4 shrink-0" />
							<span className="text-sm font-bold">Copy link</span>
						</button>
						<button
							onClick={handleRevoke}
							disabled={state === "revoking"}
							className="flex items-center gap-3 px-3 py-3 text-left border-2 border-red-500 text-red-500 bg-background hover:bg-red-50 active:shadow-[var(--shadow-brutal-active)] active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_theme(colors.red.500)] transition-all disabled:opacity-50"
						>
							{state === "revoking" ? (
								<Loader2 className="size-4 shrink-0 animate-spin" />
							) : (
								<Trash2 className="size-4 shrink-0" />
							)}
							<span className="text-sm font-bold">
								{state === "revoking" ? "Revoking..." : "Revoke link"}
							</span>
						</button>
					</div>
				) : (
					/* ─── Create new share ─── */
					<div className="flex flex-col gap-2">
						{EXPIRY_OPTIONS.map((opt) => {
							const isLoading = state === "loading" && selected === opt.hours;
							const isDisabled = state === "loading";
							return (
								<button
									key={opt.label}
									onClick={() => handleCreate(opt.hours)}
									disabled={isDisabled}
									className="flex items-center gap-3 px-3 py-3 text-left border-2 border-foreground bg-background hover:bg-accent/20 active:shadow-[var(--shadow-brutal-active)] active:translate-x-[1px] active:translate-y-[1px] shadow-[var(--shadow-brutal-sm)] transition-all disabled:opacity-50"
								>
									<span className="shrink-0">
										{isLoading ? (
											<Loader2 className="size-4 animate-spin" />
										) : opt.hours === null ? (
											<InfinityIcon className="size-4" />
										) : (
											<Clock className="size-4" />
										)}
									</span>
									<span className="text-sm font-bold">{opt.label}</span>
								</button>
							);
						})}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
