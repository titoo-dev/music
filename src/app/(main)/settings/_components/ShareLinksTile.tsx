"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Copy, Headphones, Link2, Trash2 } from "lucide-react";
import { useShareStore } from "@/stores/useShareStore";
import { cn } from "@/lib/utils";
import { ArtistLink } from "@/components/links/EntityLink";
import { Art, DUR, EASE } from "@/components/expressive";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsTile, StatusPill, TilePanel } from "./SettingsTiles";

interface ShareRow {
	shareId: string;
	trackId: string;
	title: string;
	artist: string;
	coverUrl: string | null;
	expiresAt: string | null;
	plays: number;
	createdAt: string;
}

function expiry(at: string | null): { label: string; tone: "primary" | "error" | "tertiary" } {
	if (!at) return { label: "Permanent", tone: "primary" };
	const ms = new Date(at).getTime() - Date.now();
	if (ms <= 0) return { label: "Expired", tone: "error" };
	const h = Math.round(ms / 3_600_000);
	return { label: h < 48 ? `Expires in ${Math.max(1, h)} h` : `Expires in ${Math.round(h / 24)} days`, tone: "tertiary" };
}

/** "Share links": the public links you created, with copy and revoke. */
export function ShareLinksTile() {
	const [shares, setShares] = useState<ShareRow[] | null>(null);
	const [open, setOpen] = useState(false);
	const [revoking, setRevoking] = useState<string | null>(null);
	const removeShared = useShareStore((s) => s.remove);

	useEffect(() => {
		let live = true;
		fetch("/api/v1/shares", { credentials: "include" })
			.then((r) => r.json())
			.then((j) => live && setShares(j?.success && Array.isArray(j.data) ? j.data : []))
			.catch(() => live && setShares([]));
		return () => {
			live = false;
		};
	}, []);

	const copy = async (s: ShareRow) => {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/share/t/${s.shareId}`);
			toast.success("Link copied");
		} catch {
			toast.error("Couldn’t copy the link");
		}
	};

	const revoke = async (s: ShareRow) => {
		setRevoking(s.shareId);
		try {
			const res = await fetch(`/api/v1/shares/${s.shareId}`, { method: "DELETE", credentials: "include" });
			if (!res.ok) throw new Error();
			setShares((prev) => prev?.filter((x) => x.shareId !== s.shareId) ?? prev);
			removeShared(s.trackId);
			toast.success("Link revoked");
		} catch {
			toast.error("Couldn’t revoke the link");
		} finally {
			setRevoking(null);
		}
	};

	const plays = shares?.reduce((n, s) => n + (s.plays || 0), 0) ?? 0;
	const subtitle = shares == null ? "Public links you created" : shares.length === 0 ? "No links yet — share any track from its menu" : `${shares.length} link${shares.length === 1 ? "" : "s"} · ${plays} play${plays === 1 ? "" : "s"}`;

	return (
		<SettingsTile icon={Link2} title="Share links" subtitle={subtitle} tone="tertiary" expanded={open} onClick={() => setOpen((o) => !o)}>
			<TilePanel open={open}>
				{shares == null ? (
					<div className="space-y-2">
						{[0, 1].map((i) => (
							<Skeleton key={i} className="h-[76px] rounded-[20px]" />
						))}
					</div>
				) : shares.length === 0 ? (
					<p className="rounded-[20px] bg-surface-high px-4 py-5 text-center text-sm text-muted-foreground">Links you share appear here. Anyone with a link can listen — no account needed.</p>
				) : (
					<ul className="space-y-2">
						<AnimatePresence initial={false}>
							{shares.map((s, i) => {
								const e = expiry(s.expiresAt);
								return (
									<motion.li
										key={s.shareId}
										layout
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04, duration: DUR.medium, ease: EASE.decelerate } }}
										exit={{ opacity: 0, x: -24, transition: { duration: DUR.short } }}
										className={cn("flex items-center gap-3 rounded-[20px] bg-surface-high p-2.5 pr-2", e.tone === "error" && "opacity-70")}
									>
										<Link href={`/share/t/${s.shareId}`} className="shrink-0" aria-label={`Open ${s.title}`}>
											<Art src={s.coverUrl} className="size-14" rounded="rounded-xl" size={120} />
										</Link>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
											<p className="truncate text-xs text-muted-foreground">
												<ArtistLink name={s.artist} className="transition-colors hover:text-foreground" />
											</p>
											<div className="mt-1.5 flex flex-wrap gap-1.5">
												<StatusPill label={e.label} tone={e.tone} />
												<StatusPill label={`${s.plays} play${s.plays === 1 ? "" : "s"}`} icon={Headphones} tone="muted" />
											</div>
										</div>
										<motion.button type="button" whileTap={{ scale: 0.88 }} aria-label={`Copy link to ${s.title}`} title="Copy link" onClick={() => copy(s)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/75">
											<Copy className="size-[18px]" />
										</motion.button>
										<motion.button
											type="button"
											whileTap={{ scale: 0.88 }}
											aria-label={`Revoke link to ${s.title}`}
											title="Revoke"
											disabled={revoking === s.shareId}
											onClick={() => revoke(s)}
											className="flex size-10 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
										>
											<Trash2 className="size-[18px]" />
										</motion.button>
									</motion.li>
								);
							})}
						</AnimatePresence>
					</ul>
				)}
			</TilePanel>
		</SettingsTile>
	);
}
