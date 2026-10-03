"use client";

import type { ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DUR, EASE, SPRING } from "./motion";

function compact(n: number) {
	return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** Animated count: slides when the number changes. */
export function Count({ value, className }: { value: number; className?: string }) {
	return (
		<span className={cn("relative inline-flex overflow-hidden tabular-nums", className)}>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span key={value} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: DUR.medium, ease: EASE.emphasized }}>
					{compact(value)}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}

export interface FilterPillItem<T extends string> {
	value: T;
	label: string;
	count?: number | null;
}

/**
 * A row of filter pills. The selected pill fills with `primary` and grows a
 * check; counts ride along. Scrolls horizontally when it overflows.
 */
export function FilterPills<T extends string>({
	value,
	onChange,
	items,
	className,
	ariaLabel = "Filter",
}: {
	value: T;
	onChange: (v: T) => void;
	items: FilterPillItem<T>[];
	className?: string;
	ariaLabel?: string;
}) {
	return (
		<div role="tablist" aria-label={ariaLabel} className={cn("scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-0 sm:px-0", className)}>
			{items.map((it) => {
				const selected = it.value === value;
				return (
					<motion.button
						key={it.value}
						type="button"
						role="tab"
						aria-selected={selected}
						onClick={() => onChange(it.value)}
						whileTap={{ scale: 0.93 }}
						transition={SPRING.press}
						className={cn(
							"flex h-8 shrink-0 items-center rounded-full border px-3.5 text-[13px] transition-colors duration-300",
							selected ? "border-primary bg-primary font-medium text-primary-foreground" : "border-border bg-background font-normal text-muted-foreground hover:bg-accent hover:text-foreground"
						)}
					>
						<AnimatePresence initial={false}>
							{selected && (
								<motion.span
									key="check"
									initial={{ width: 0, opacity: 0, scale: 0.4 }}
									animate={{ width: 20, opacity: 1, scale: 1 }}
									exit={{ width: 0, opacity: 0, scale: 0.4 }}
									transition={{ duration: DUR.medium, ease: EASE.emphasized }}
									className="flex items-center overflow-hidden"
								>
									<Check className="size-3.5" strokeWidth={2.5} />
								</motion.span>
							)}
						</AnimatePresence>
						{it.label}
						{it.count != null && it.count > 0 && <Count value={it.count} className={cn("ml-1.5 font-mono text-[11px]", selected ? "text-primary-foreground/70" : "text-muted-foreground/70")} />}
					</motion.button>
				);
			})}
		</div>
	);
}

/**
 * Tabs with a sliding `primary` stadium indicator (the Library pill tab bar
 * and the settings `SlidingSegments`).
 */
export function SlidingSegments<T extends string>({
	id,
	value,
	onChange,
	items,
	className,
	size = "md",
}: {
	id: string;
	value: T;
	onChange: (v: T) => void;
	items: { value: T; label: string; icon?: LucideIcon; count?: number | null }[];
	className?: string;
	size?: "sm" | "md";
}) {
	return (
		<LayoutGroup id={id}>
			<div role="tablist" className={cn("flex rounded-lg border border-border bg-muted/50 p-0.5", size === "md" ? "h-10" : "h-8", className)}>
				{items.map(({ value: v, label, icon: Icon, count }) => {
					const selected = v === value;
					return (
						<button
							key={v}
							type="button"
							role="tab"
							aria-selected={selected}
							onClick={() => onChange(v)}
							className={cn(
								"relative flex flex-1 items-center justify-center gap-2 rounded-md px-3 text-[13px] transition-colors duration-300",
								selected ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
							)}
						>
							{selected && (
								<motion.span
									layoutId={`${id}-indicator`}
									className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border"
									transition={SPRING.indicator}
								/>
							)}
							{Icon && <Icon className="relative size-4" />}
							<span className="relative truncate">{label}</span>
							{count != null && count > 0 && <Count value={count} className="relative font-mono text-[11px] text-muted-foreground" />}
						</button>
					);
				})}
			</div>
		</LayoutGroup>
	);
}

/** Small stadium count badge (secondaryContainer). */
export function CountPill({ value, className }: { value: number; className?: string }) {
	return (
		<span className={cn("inline-flex h-5 items-center rounded-full border border-border px-1.5 font-mono text-[11px] text-muted-foreground", className)}>
			<Count value={value} />
		</span>
	);
}

/**
 * Tonal stat pill (primaryContainer / tertiaryContainer) for page heroes. A
 * dash stands in while [value] is loading; with [onClick] it becomes a button.
 */
export function TonalPill({
	icon: Icon,
	value,
	label,
	tone = "primary",
	onClick,
	className,
}: {
	icon: LucideIcon;
	value: number | null;
	label: string;
	tone?: "primary" | "tertiary";
	onClick?: () => void;
	className?: string;
}) {
	const Tag = onClick ? motion.button : motion.span;
	return (
		<Tag
			{...(onClick ? { type: "button" as const, onClick, whileTap: { scale: 0.94 }, transition: SPRING.press } : {})}
			className={cn(
				"inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-3.5 text-sm font-semibold",
				tone === "primary" ? "bg-primary-container text-on-primary-container" : "bg-tertiary-container text-on-tertiary-container",
				onClick && "outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring dark:hover:brightness-125",
				className
			)}
		>
			<Icon className="size-4" strokeWidth={2.25} />
			{value == null ? "–" : <Count value={value} className="font-semibold" />}
			<span className="opacity-85">{label}</span>
		</Tag>
	);
}

/** Uppercase eyebrow pill (primaryContainer) — collection headings. */
export function EyebrowPill({ children, className }: { children: ReactNode; className?: string }) {
	return <span className={cn("type-eyebrow inline-flex items-center rounded-full bg-primary-container px-2.5 py-1 text-on-primary-container", className)}>{children}</span>;
}

/** Stat badge: icon in `primary` + label on surfaceContainerHigh. */
export function StatBadge({ icon: Icon, children, className, onClick }: { icon?: LucideIcon; children: ReactNode; className?: string; onClick?: () => void }) {
	const Tag = onClick ? motion.button : motion.span;
	return (
		<Tag
			{...(onClick ? { type: "button" as const, onClick, whileTap: { scale: 0.94 } } : {})}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 py-1 pl-2.5 pr-3 text-[13px] font-medium text-foreground backdrop-blur",
				onClick && "transition-colors hover:bg-accent",
				className
			)}
		>
			{Icon && <Icon className="size-3.5 text-muted-foreground" />}
			{children}
		</Tag>
	);
}
