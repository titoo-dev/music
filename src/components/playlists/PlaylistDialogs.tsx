"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";
import { motion } from "motion/react";
import { Check, ListPlus, NotebookPen, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/motion/icons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { plural } from "./format";

// ─── Buttons ────────────────────────────────────────────────────────────────

/** M3 text button (dialog dismiss actions). */
export const textButton =
	"inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-primary outline-none transition-[background-color,transform] hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px]";

/** M3 filled button. */
export const filledButton =
	"inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground no-underline outline-none shadow-[0_3px_10px_-3px_color-mix(in_srgb,var(--primary)_55%,transparent)] transition-[background-color,transform,opacity] hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px]";

/** M3 filled tonal button (secondaryContainer). */
export const tonalButton =
	"inline-flex h-10 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground no-underline outline-none transition-[background-color,transform] hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px]";

/** Destructive filled button. */
export const dangerButton =
	"inline-flex h-10 items-center justify-center gap-2 rounded-full bg-destructive px-5 text-sm font-semibold text-white outline-none transition-[background-color,transform] hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:text-[#690005] [&_svg]:size-[18px]";

// ─── Dialog shell ───────────────────────────────────────────────────────────

const BADGE_TONES = {
	brand: "bg-brand-gradient text-white shadow-[0_8px_22px_-6px_color-mix(in_srgb,var(--brand-indigo)_60%,transparent)]",
	danger: "bg-destructive/15 text-destructive",
	spotify: "bg-[#1DB954] text-white shadow-[0_8px_22px_-6px_rgb(29_185_84/0.55)]",
} as const;

/** 56px round badge heading a dialog; pops in with a little overshoot. */
export function DialogBadge({ icon: Icon, tone = "brand" }: { icon: LucideIcon; tone?: keyof typeof BADGE_TONES }) {
	return (
		<motion.span
			aria-hidden
			initial={{ scale: 0.6, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ type: "spring", stiffness: 380, damping: 11, delay: 0.04 }}
			className={cn("mx-auto flex size-14 items-center justify-center rounded-full", BADGE_TONES[tone])}
		>
			<Icon className="size-7" strokeWidth={2.1} />
		</motion.span>
	);
}

/**
 * Expressive M3 dialog: 28px corners on surfaceContainerHigh, an optional
 * popping badge, a heavy centred headline, the body and a right-aligned
 * action row.
 */
export function M3Dialog({
	open,
	onOpenChange,
	badge,
	title,
	description,
	children,
	actions,
	className,
	centered = false,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	badge?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	children?: ReactNode;
	actions?: ReactNode;
	className?: string;
	/** Centre the body copy too (confirmations). */
	centered?: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className={cn("gap-0 rounded-[28px] border-0 bg-surface-high p-6 sm:max-w-[440px]", className)}>
				<M3DialogBody badge={badge} title={title} description={description} actions={actions} centered={centered}>
					{children}
				</M3DialogBody>
			</DialogContent>
		</Dialog>
	);
}

/** The inside of an [M3Dialog] (for dialogs that manage their own root). */
export function M3DialogBody({
	badge,
	title,
	description,
	children,
	actions,
	centered = false,
}: {
	badge?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	children?: ReactNode;
	actions?: ReactNode;
	centered?: boolean;
}) {
	return (
		<>
			{badge && <div className="mb-4 flex justify-center">{badge}</div>}
			<DialogTitle className={cn("text-2xl font-semibold leading-tight tracking-[-0.02em]", badge && "text-center")}>{title}</DialogTitle>
			{description && <DialogDescription className={cn("mt-2 text-sm leading-relaxed text-muted-foreground", centered && "text-center")}>{description}</DialogDescription>}
			{children && <div className="mt-5">{children}</div>}
			{actions && <div className="mt-6 flex flex-wrap items-center justify-end gap-2">{actions}</div>}
		</>
	);
}

// ─── Filled text field ──────────────────────────────────────────────────────

type FieldProps = {
	label: string;
	icon?: LucideIcon;
	error?: string | null;
	/** Trailing widget (paste / clear button…). */
	suffix?: ReactNode;
	multiline?: boolean;
	value: string;
	onValueChange: (v: string) => void;
} & Omit<ComponentProps<"input">, "value" | "onChange" | "size">;

/**
 * M3 filled text field: surfaceContainerHighest, 16px corners, a leading
 * icon, a label that floats up on focus / value and a 2px primary focus ring.
 */
export function FilledField({ label, icon: Icon, error, suffix, multiline = false, value, onValueChange, className, placeholder, id, ...rest }: FieldProps) {
	const autoId = useId();
	const fieldId = id ?? autoId;
	const errorId = `${fieldId}-error`;
	const shared = {
		id: fieldId,
		value,
		placeholder: placeholder ?? " ",
		"aria-invalid": !!error || undefined,
		"aria-describedby": error ? errorId : undefined,
		className: cn(
			"peer block w-full resize-none bg-transparent pb-2 pt-6 text-base text-foreground outline-none placeholder:text-transparent focus:placeholder:text-muted-foreground/70 disabled:opacity-60",
			Icon ? "pl-12" : "pl-4",
			suffix ? "pr-12" : "pr-4"
		),
	};
	return (
		<div className={className}>
			<div
				className={cn(
					"group/field relative rounded-2xl bg-surface-highest transition-shadow duration-200",
					error ? "ring-[1.5px] ring-destructive focus-within:ring-2" : "focus-within:ring-2 focus-within:ring-primary"
				)}
			>
				{Icon && <Icon aria-hidden className={cn("pointer-events-none absolute left-3.5 top-4 size-6 transition-colors", error ? "text-destructive" : "text-muted-foreground group-focus-within/field:text-primary")} strokeWidth={1.9} />}
				{multiline ? (
					<textarea {...shared} rows={2} onChange={(e) => onValueChange(e.target.value)} {...(rest as unknown as ComponentProps<"textarea">)} />
				) : (
					<input {...shared} onChange={(e) => onValueChange(e.target.value)} {...rest} />
				)}
				<label
					htmlFor={fieldId}
					className={cn(
						"pointer-events-none absolute top-4 origin-left truncate text-base leading-6 transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
						"peer-focus:top-1.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs",
						error ? "text-destructive" : "text-muted-foreground peer-focus:text-primary",
						Icon ? "left-12" : "left-4",
						suffix ? "right-12" : "right-4"
					)}
				>
					{label}
				</label>
				{suffix && <div className="absolute right-1.5 top-1.5">{suffix}</div>}
			</div>
			{error && (
				<motion.p id={errorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 px-4 text-xs font-medium text-destructive">
					{error}
				</motion.p>
			)}
		</div>
	);
}

// ─── Playlist dialogs ───────────────────────────────────────────────────────

export interface PlaylistDetails {
	title: string;
	description: string | null;
}

/**
 * New / Edit playlist: Name + optional description. `onSubmit` may throw; the
 * dialog stays open and shows the error.
 */
export function PlaylistEditDialog({
	open,
	onOpenChange,
	mode,
	initial,
	onSubmit,
	submitLabel,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	initial?: PlaylistDetails;
	onSubmit: (details: PlaylistDetails) => Promise<void> | void;
	submitLabel?: string;
}) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	// Fresh fields every time it opens.
	useEffect(() => {
		if (!open) return;
		setTitle(initial?.title ?? "");
		setDescription(initial?.description ?? "");
		setError(null);
		setBusy(false);
	}, [open, initial?.title, initial?.description]);

	const creating = mode === "create";
	const submit = async () => {
		if (busy) return;
		const t = title.trim();
		if (!t) {
			setError("Give your playlist a name");
			return;
		}
		setBusy(true);
		try {
			await onSubmit({ title: t, description: description.trim() || null });
			onOpenChange(false);
		} catch (e) {
			setError((e as Error)?.message || "Something went wrong");
		} finally {
			setBusy(false);
		}
	};

	return (
		<M3Dialog
			open={open}
			onOpenChange={(o) => !busy && onOpenChange(o)}
			badge={<DialogBadge icon={creating ? ListPlus : Pencil} />}
			title={creating ? "New playlist" : "Edit details"}
			actions={
				<>
					<button type="button" className={textButton} onClick={() => onOpenChange(false)} disabled={busy}>
						Cancel
					</button>
					<button type="submit" form="playlist-edit-form" className={filledButton} disabled={busy}>
						{busy ? <Spinner size={16} /> : creating ? <Plus /> : <Check />}
						{submitLabel ?? (creating ? "Create" : "Save")}
					</button>
				</>
			}
		>
			<form
				id="playlist-edit-form"
				className="space-y-3"
				onSubmit={(e) => {
					e.preventDefault();
					void submit();
				}}
			>
				<FilledField
					autoFocus
					label="Name"
					icon={ListPlus}
					value={title}
					onValueChange={(v) => {
						setTitle(v);
						if (error) setError(null);
					}}
					error={error}
					maxLength={120}
					disabled={busy}
				/>
				<FilledField
					multiline
					label="Description (optional)"
					icon={NotebookPen}
					value={description}
					onValueChange={setDescription}
					disabled={busy}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							void submit();
						}
					}}
				/>
			</form>
		</M3Dialog>
	);
}

/** "Delete “X”?" confirmation (error-tinted badge). */
export function DeletePlaylistDialog({
	open,
	onOpenChange,
	title,
	trackCount,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	trackCount: number;
	onConfirm: () => Promise<void> | void;
}) {
	const [busy, setBusy] = useState(false);
	const confirm = async () => {
		setBusy(true);
		try {
			await onConfirm();
			onOpenChange(false);
		} finally {
			setBusy(false);
		}
	};
	return (
		<M3Dialog
			open={open}
			onOpenChange={(o) => !busy && onOpenChange(o)}
			centered
			badge={<DialogBadge icon={Trash2} tone="danger" />}
			title={<>Delete &ldquo;{title}&rdquo;?</>}
			description={trackCount > 0 ? `This playlist contains ${plural(trackCount, "track")}. This cannot be undone.` : "This cannot be undone."}
			actions={
				<>
					<button type="button" className={textButton} onClick={() => onOpenChange(false)} disabled={busy}>
						Cancel
					</button>
					<button type="button" className={dangerButton} onClick={() => void confirm()} disabled={busy}>
						{busy ? <Spinner size={16} /> : <Trash2 />}
						Delete
					</button>
				</>
			}
		/>
	);
}
