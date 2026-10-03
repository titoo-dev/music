"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Clock, Infinity as InfinityIcon, Copy, Trash2, Share, Link as LinkIcon } from "lucide-react";
import { useShareStore } from "@/stores/useShareStore";
import { DrawCheck, Spinner } from "@/components/motion/icons";
import { CoverImage } from "@/components/ui/cover-image";
import { CoverTheme, SlidingSegments, swap } from "@/components/expressive";
import { cn } from "@/lib/utils";

const EXPIRY_OPTIONS = [
	{ value: "24", label: "24 hours", hours: 24 },
	{ value: "168", label: "7 days", hours: 168 },
	{ value: "720", label: "30 days", hours: 720 },
	{ value: "never", label: "Never", hours: null },
] as const;
type Expiry = (typeof EXPIRY_OPTIONS)[number]["value"];

interface ShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trackId: string;
	duration?: number | null;
	/** Shown in the heading (`Share “title”`) and the header row. */
	title?: string | null;
	artist?: string | null;
	cover?: string | null;
	onShared?: () => void;
}

const btn =
	"inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold outline-none transition-[background-color,scale,opacity] duration-200 active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50";

/**
 * Share sheet (the Flutter `showShareSheet`): pick how long the link lives,
 * create it, then copy / share / revoke it from a tonal link card.
 */
export function ShareDialog({ open, onOpenChange, trackId, duration, title, artist, cover, onShared }: ShareDialogProps) {
	const existingShareId = useShareStore((s) => s.shared.get(trackId) ?? null);
	const addShare = useShareStore((s) => s.add);
	const removeShare = useShareStore((s) => s.remove);

	const [expiry, setExpiry] = useState<Expiry>("168");
	const [state, setState] = useState<"idle" | "loading" | "error" | "revoking" | "revoked">("idle");
	const [copied, setCopied] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const shareUrl = existingShareId && typeof window !== "undefined" ? `${window.location.origin}/share/t/${existingShareId}` : "";
	const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

	const flashCopied = useCallback(() => {
		setCopied(true);
		if (navigator.vibrate) navigator.vibrate(30);
		setTimeout(() => setCopied(false), 1800);
	}, []);

	const handleCreate = useCallback(async () => {
		const hours = EXPIRY_OPTIONS.find((o) => o.value === expiry)?.hours ?? null;
		setState("loading");
		setErrorMsg("");
		try {
			const res = await fetch("/api/v1/shares", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ trackId, duration: duration ?? null, expiresIn: hours }),
			});
			const json = await res.json();
			if (json.success && json.data?.shareId) {
				addShare(trackId, json.data.shareId);
				const url = `${window.location.origin}/share/t/${json.data.shareId}`;
				await navigator.clipboard.writeText(url).catch(() => {});
				setState("idle");
				flashCopied();
				onShared?.();
			} else {
				setErrorMsg(json.error?.code === "NOT_DOWNLOADED" ? "Download this track first" : "Failed to create link");
				setState("error");
			}
		} catch {
			setErrorMsg("Network error");
			setState("error");
		}
	}, [expiry, trackId, duration, addShare, flashCopied, onShared]);

	const handleCopy = useCallback(async () => {
		if (!shareUrl) return;
		await navigator.clipboard.writeText(shareUrl).catch(() => {});
		flashCopied();
	}, [shareUrl, flashCopied]);

	const handleNativeShare = useCallback(async () => {
		if (!shareUrl) return;
		await navigator.share?.({ title: title ?? undefined, text: title && artist ? `${title} — ${artist}` : undefined, url: shareUrl }).catch(() => {});
	}, [shareUrl, title, artist]);

	const handleRevoke = useCallback(async () => {
		if (!existingShareId) return;
		setState("revoking");
		try {
			const res = await fetch(`/api/v1/shares/${existingShareId}`, { method: "DELETE", credentials: "include" });
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
				setCopied(false);
				setErrorMsg("");
			}
		},
		[onOpenChange]
	);

	const view = state === "revoked" ? "revoked" : state === "error" ? "error" : existingShareId ? "manage" : "create";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={state !== "loading" && state !== "revoking"}
				className="gap-0 overflow-hidden rounded-[28px] border-0 bg-surface-low p-0 sm:max-w-[440px] [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:top-4"
			>
				<CoverTheme src={cover} className="flex flex-col gap-5 p-6">
					<DialogHeader className="flex-row items-center gap-4 pr-8">
						{cover !== undefined && (
							<CoverImage src={cover ?? null} className="size-14 shrink-0 rounded-[14px] shadow-[0_6px_16px_-4px_color-mix(in_oklch,var(--primary)_40%,transparent)]" />
						)}
						<div className="min-w-0 flex-1">
							<DialogTitle className="line-clamp-2 text-[22px] font-semibold leading-tight tracking-[-0.02em]">
								{title ? `Share “${title}”` : existingShareId ? "Share link" : "Share track"}
							</DialogTitle>
							<DialogDescription className="mt-1 text-sm text-muted-foreground">
								Anyone with the link can listen — no account needed.
							</DialogDescription>
						</div>
					</DialogHeader>

					<AnimatePresence mode="wait" initial={false}>
						<motion.div key={view} variants={swap} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-4">
							{view === "revoked" ? (
								<div className="flex flex-col items-center gap-3 py-4">
									<span className="flex size-14 items-center justify-center rounded-full bg-surface-high text-muted-foreground">
										<Trash2 className="size-6" />
									</span>
									<p className="text-base font-semibold">Link revoked</p>
								</div>
							) : view === "error" ? (
								<div className="flex flex-col items-center gap-4 rounded-[20px] bg-destructive/10 px-4 py-5 text-center">
									<p className="text-sm font-semibold text-destructive">{errorMsg}</p>
									<button type="button" onClick={() => setState("idle")} className={cn(btn, "h-10 bg-surface-high text-foreground hover:bg-surface-highest")}>
										Try again
									</button>
								</div>
							) : view === "manage" ? (
								<>
									{/* Link card */}
									<div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,var(--m3-primary-container),var(--m3-tertiary-container))] p-4 text-on-primary-container">
										<div className="flex items-center gap-2">
											<span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
												<LinkIcon className="size-4" />
											</span>
											<span className="type-eyebrow text-on-primary-container/80">Share link</span>
											<span className="ml-auto inline-flex h-6 items-center gap-1 rounded-full bg-on-primary-container/10 px-2.5 text-[11px] font-semibold">
												<span className="size-1.5 rounded-full bg-success" />
												Active
											</span>
										</div>
										<p className="mt-3 truncate text-[15px] font-semibold tracking-tight" title={shareUrl}>
											{shareUrl.replace(/^https?:\/\//, "")}
										</p>
									</div>
									<div className="flex gap-2">
										<button type="button" onClick={handleCopy} className={cn(btn, "flex-1 bg-primary text-primary-foreground hover:bg-primary/90")}>
											<AnimatePresence mode="wait" initial={false}>
												{copied ? (
													<motion.span key="ok" className="inline-flex items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
														<DrawCheck className="size-4" />
														Link copied
													</motion.span>
												) : (
													<motion.span key="copy" className="inline-flex items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
														<Copy className="size-4" />
														Copy link
													</motion.span>
												)}
											</AnimatePresence>
										</button>
										{canNativeShare && (
											<button type="button" onClick={handleNativeShare} className={cn(btn, "flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
												<Share className="size-4" />
												Share
											</button>
										)}
									</div>
									<button
										type="button"
										onClick={handleRevoke}
										disabled={state === "revoking"}
										className={cn(btn, "h-11 text-destructive hover:bg-destructive/10")}
									>
										{state === "revoking" ? <Spinner /> : <Trash2 className="size-4" />}
										{state === "revoking" ? "Revoking…" : "Revoke link"}
									</button>
								</>
							) : (
								<>
									<div className="flex flex-col gap-2.5">
										<span className="type-eyebrow text-primary">Link expires after</span>
										<SlidingSegments
											id="share-expiry"
											size="sm"
											value={expiry}
											onChange={(v) => setExpiry(v as Expiry)}
											items={EXPIRY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
											className="[&_button]:px-1.5 [&_button]:text-[13px]"
										/>
										<p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
											{expiry === "never" ? <InfinityIcon className="size-3.5" /> : <Clock className="size-3.5" />}
											{expiry === "never" ? "The link stays up until you revoke it." : "You can revoke it any time before then."}
										</p>
									</div>
									<button
										type="button"
										onClick={handleCreate}
										disabled={state === "loading"}
										className={cn(btn, "w-full bg-primary text-primary-foreground shadow-[0_6px_16px_-4px_color-mix(in_oklch,var(--primary)_45%,transparent)] hover:bg-primary/90")}
									>
										{state === "loading" ? <Spinner /> : <LinkIcon className="size-4" />}
										{state === "loading" ? "Creating…" : "Create link"}
									</button>
								</>
							)}
						</motion.div>
					</AnimatePresence>
				</CoverTheme>
			</DialogContent>
		</Dialog>
	);
}
