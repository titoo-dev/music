"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountPill } from "./Pills";
import { entrance } from "./motion";

/**
 * Expressive section heading: optional eyebrow, heavy title, count badge, an
 * optional trailing widget and a "See all →" action.
 */
export function SectionTitle({
	title,
	eyebrow,
	count,
	action,
	actionLabel = "See all",
	href,
	onAction,
	trailing,
	className,
	as: Tag = "h2",
}: {
	title: ReactNode;
	eyebrow?: ReactNode;
	count?: number | null;
	/** A custom action node (overrides href/onAction). */
	action?: ReactNode;
	actionLabel?: string;
	href?: string;
	onAction?: () => void;
	trailing?: ReactNode;
	className?: string;
	as?: "h2" | "h3";
}) {
	const linkCls = "group/see inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground";
	const arrow = <ArrowRight className="size-4 transition-transform group-hover/see:translate-x-0.5" />;
	return (
		<div className={cn("mb-[var(--section-title-gap,0.75rem)] mt-[var(--section-gap,2.5rem)] flex items-end gap-3", className)}>
			<div className="min-w-0 flex-1">
				{eyebrow && <p className="type-eyebrow mb-1 text-muted-foreground">{eyebrow}</p>}
				<div className="flex min-w-0 items-center gap-2">
					<Tag className="truncate text-lg font-semibold leading-tight tracking-tight sm:text-xl">{title}</Tag>
					{count != null && <CountPill value={count} />}
				</div>
			</div>
			{trailing}
			{action ??
				(href ? (
					<Link href={href} className={linkCls}>
						{actionLabel}
						{arrow}
					</Link>
				) : onAction ? (
					<button type="button" onClick={onAction} className={linkCls}>
						{actionLabel}
						{arrow}
					</button>
				) : null)}
		</div>
	);
}

/**
 * Empty-state medallion: a glowing tonal circle with an icon, a heavy title,
 * a message and an optional action.
 */
export function Medallion({
	icon: Icon,
	title,
	message,
	action,
	className,
}: {
	icon: LucideIcon;
	title: ReactNode;
	message?: ReactNode;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<motion.div {...entrance()} className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
			<motion.span
				initial={{ scale: 0.6, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.05 }}
				className="bg-tonal-gradient flex size-[104px] items-center justify-center rounded-full text-on-primary-container ring-1 ring-border shadow-glow"
			>
				<Icon className="size-[46px]" strokeWidth={1.75} />
			</motion.span>
			<h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
			{message && <p className="mt-2 max-w-xs text-sm text-muted-foreground">{message}</p>}
			{action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
		</motion.div>
	);
}
