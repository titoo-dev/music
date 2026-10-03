"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DUR, EASE, SPRING, entrance } from "@/components/expressive";

/*
 * The web side of the Flutter `settings_tiles.dart`: an eyebrow over tiles
 * that share one rounded block (outer corners 24, inner 6, 2px gaps), tonal
 * icon badges, switch rows, status pills and option cards.
 */

/** Any icon component (lucide or a custom glyph). */
export type TileIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

export type BadgeTone = "primary" | "secondary" | "tertiary" | "muted" | "error";

const BADGE: Record<BadgeTone, string> = {
	primary: "bg-primary-container text-on-primary-container",
	secondary: "bg-secondary-container text-on-secondary-container",
	tertiary: "bg-tertiary-container text-on-tertiary-container",
	muted: "bg-surface-highest text-muted-foreground",
	error: "bg-destructive/15 text-destructive",
};

/** Grouped block of tiles under an optional eyebrow. Every direct child is a tile. */
export function SettingsSection({ title, index = 0, children, className }: { title?: string; index?: number; children: ReactNode; className?: string }) {
	return (
		<motion.section {...entrance(index)} className={cn("min-w-0", className)}>
			{title && <h2 className="type-eyebrow px-2 pb-2.5 pt-6 text-primary">{title}</h2>}
			<div className="flex flex-col gap-[2px] *:overflow-hidden *:rounded-[6px] *:bg-surface-container [&>*:first-child]:rounded-t-[24px] [&>*:last-child]:rounded-b-[24px]">
				{children}
			</div>
		</motion.section>
	);
}

/** 40px tonal icon badge (radius 12). */
export function TileBadge({ icon: Icon, tone = "primary", className }: { icon: TileIcon; tone?: BadgeTone; className?: string }) {
	return (
		<span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ease-[cubic-bezier(0.2,0,0,1)]", BADGE[tone], className)}>
			<Icon className="size-[22px]" strokeWidth={2} />
		</span>
	);
}

interface TileProps {
	icon: TileIcon;
	title: ReactNode;
	subtitle?: ReactNode;
	/** Replaces the chevron. */
	trailing?: ReactNode;
	tone?: BadgeTone;
	destructive?: boolean;
	href?: string;
	onClick?: () => void;
	disabled?: boolean;
	/** Extra content under the row (sliders, pickers, expanded panels). */
	children?: ReactNode;
	/** Rotates the chevron (expandable tiles). */
	expanded?: boolean;
	/** Show the chevron next to [trailing] (default: only when there is no trailing). */
	chevron?: boolean;
	className?: string;
	ariaLabel?: string;
	role?: string;
	ariaChecked?: boolean;
}

/** A settings row: tonal badge, title, subtitle and a trailing chevron or widget. */
export function SettingsTile({
	icon,
	title,
	subtitle,
	trailing,
	tone = "primary",
	destructive = false,
	href,
	onClick,
	disabled = false,
	children,
	expanded,
	chevron: showChevron,
	className,
	ariaLabel,
	role,
	ariaChecked,
}: TileProps) {
	const tappable = !disabled && (!!href || !!onClick);
	const chevron = tappable && (showChevron ?? trailing === undefined) && (
		<motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: DUR.medium, ease: EASE.emphasized }} className="flex text-muted-foreground">
			<ChevronRight className="size-5" />
		</motion.span>
	);
	const row = (
		<>
			<TileBadge icon={icon} tone={destructive ? "error" : tone} />
			<span className="min-w-0 flex-1 text-left">
				<span className={cn("block text-base font-semibold leading-snug", destructive ? "text-destructive" : "text-foreground")}>{title}</span>
				{subtitle != null && <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{subtitle}</span>}
			</span>
			{trailing}
			{chevron}
		</>
	);
	const rowCls = cn(
		"flex w-full items-center gap-4 py-3.5 pl-4 pr-3 text-inherit no-underline outline-none transition-colors duration-200 focus-visible:bg-surface-high",
		tappable && "cursor-pointer hover:bg-surface-high"
	);

	return (
		<div className={cn("transition-opacity duration-300", disabled && "opacity-50", className)}>
			{tappable ? (
				<motion.div whileTap={{ scale: 0.985 }} transition={SPRING.press}>
					{href ? (
						<Link href={href} className={rowCls} aria-label={ariaLabel}>
							{row}
						</Link>
					) : (
						<button type="button" onClick={onClick} className={rowCls} aria-label={ariaLabel} aria-expanded={expanded} role={role} aria-checked={ariaChecked}>
							{row}
						</button>
					)}
				</motion.div>
			) : (
				<div className={rowCls}>{row}</div>
			)}
			{children}
		</div>
	);
}

/** Collapsible panel under a tile (height + fade). */
export function TilePanel({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
	return (
		<AnimatePresence initial={false}>
			{open && (
				<motion.div
					key="panel"
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: DUR.medium, ease: EASE.emphasized }}
					className="overflow-hidden"
				>
					<div className={cn("px-4 pb-4", className)}>{children}</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

/** M3 switch visual (the whole tile is the control). */
export function SwitchVisual({ on }: { on: boolean }) {
	return (
		<span
			aria-hidden
			className={cn(
				"relative flex h-8 w-[52px] shrink-0 items-center rounded-full border-2 transition-colors duration-300",
				on ? "border-primary bg-primary" : "border-outline bg-surface-highest"
			)}
		>
			<motion.span
				initial={false}
				animate={{ x: on ? 22 : 4, width: on ? 24 : 16, height: on ? 24 : 16 }}
				transition={SPRING.indicator}
				className={cn("flex items-center justify-center rounded-full", on ? "bg-primary-foreground text-primary" : "bg-outline text-surface-highest")}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span key={on ? "on" : "off"} initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: DUR.short }} className="flex">
						{on ? <Check className="size-4" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
					</motion.span>
				</AnimatePresence>
			</motion.span>
		</span>
	);
}

/** Tile with a switch; the whole row toggles and the badge tints when on. */
export function SettingsSwitchTile({
	icon,
	title,
	subtitle,
	checked,
	onCheckedChange,
	disabled,
}: {
	icon: TileIcon;
	title: string;
	subtitle?: ReactNode;
	checked: boolean;
	onCheckedChange: (v: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<SettingsTile
			icon={icon}
			title={title}
			subtitle={subtitle}
			tone={checked ? "primary" : "muted"}
			disabled={disabled}
			onClick={() => onCheckedChange(!checked)}
			role="switch"
			ariaChecked={checked}
			ariaLabel={title}
			trailing={<SwitchVisual on={checked} />}
		/>
	);
}

export type PillTone = "primary" | "secondary" | "tertiary" | "error" | "muted";

const PILL: Record<PillTone, string> = {
	primary: "bg-primary-container text-on-primary-container",
	secondary: "bg-secondary-container text-on-secondary-container",
	tertiary: "bg-tertiary-container text-on-tertiary-container",
	error: "bg-destructive/15 text-destructive",
	muted: "bg-surface-highest text-muted-foreground",
};

/** Small stadium badge (status, perks, counts). */
export function StatusPill({ label, icon: Icon, tone = "secondary", className }: { label: ReactNode; icon?: TileIcon; tone?: PillTone; className?: string }) {
	return (
		<span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-full pr-2.5 text-[11px] font-semibold transition-colors duration-300", Icon ? "pl-2" : "pl-2.5", PILL[tone], className)}>
			{Icon && <Icon className="size-3.5" strokeWidth={2.5} />}
			{label}
		</span>
	);
}

/** Radio-style option card (radius 20): selected fills primaryContainer with a check. */
export function OptionCard({
	icon: Icon,
	title,
	detail,
	selected,
	onClick,
	index = 0,
}: {
	icon: TileIcon;
	title: string;
	detail: ReactNode;
	selected: boolean;
	onClick?: () => void;
	index?: number;
}) {
	const Tag = onClick ? motion.button : motion.div;
	return (
		<Tag
			{...entrance(index, 10)}
			{...(onClick ? { type: "button" as const, onClick, whileTap: { scale: 0.97 }, role: "radio", "aria-checked": selected } : { "aria-current": selected || undefined })}
			className={cn(
				"flex w-full items-center gap-4 rounded-[20px] p-4 text-left transition-colors duration-300",
				selected ? "bg-primary-container text-on-primary-container" : "bg-surface-high text-foreground",
				onClick && !selected && "hover:bg-surface-highest"
			)}
		>
			<Icon className={cn("size-6 shrink-0", selected ? "text-on-primary-container" : "text-primary")} />
			<span className="min-w-0 flex-1">
				<span className="block text-base font-semibold leading-snug">{title}</span>
				<span className={cn("block text-sm leading-snug", selected ? "text-on-primary-container/80" : "text-muted-foreground")}>{detail}</span>
			</span>
			<AnimatePresence initial={false}>
				{selected && (
					<motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING.pop} className="flex text-primary">
						<CheckCircle2 className="size-6 fill-primary text-primary-container" />
					</motion.span>
				)}
			</AnimatePresence>
		</Tag>
	);
}

/** Rounded tonal notice (info / error), optionally dismissible. */
export function Notice({ icon: Icon, children, tone = "secondary", onClose }: { icon: TileIcon; children: ReactNode; tone?: "secondary" | "error"; onClose?: () => void }) {
	return (
		<div role={tone === "error" ? "alert" : undefined} className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 text-sm", tone === "error" ? "bg-destructive/15 text-destructive" : "bg-secondary-container text-on-secondary-container")}>
			<Icon className="mt-px size-5 shrink-0" />
			<span className="min-w-0 flex-1 leading-snug">{children}</span>
			{onClose && (
				<button type="button" aria-label="Dismiss" onClick={onClose} className="-my-1 -mr-2 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-current/10">
					<X className="size-4" />
				</button>
			)}
		</div>
	);
}
