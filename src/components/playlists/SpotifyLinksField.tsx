"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Link2, Music, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { commitLinks, removeLink, splitLinkInput } from "@/lib/spotify/link-input";

/**
 * The Spotify import's links field: a filled field (same look as
 * `FilledField`) where every pasted track link becomes a list item and the
 * field grows with them (the list scrolls past ~8 rows). A playlist link
 * stays plain text. `value` is the store's `input` — see `link-input.ts`.
 */
export function SpotifyLinksField({
	label,
	value,
	onValueChange,
	onSubmit,
	error,
	suffix,
	autoFocus,
	className,
}: {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	/** Enter with nothing to commit. */
	onSubmit: () => void;
	error?: string | null;
	suffix?: ReactNode;
	autoFocus?: boolean;
	className?: string;
}) {
	const fieldId = useId();
	const errorId = `${fieldId}-error`;
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLOListElement>(null);
	const { ids, draft } = splitLinkInput(value);
	const hasItems = ids.length > 0;

	// Newly added links land at the bottom: keep them (and the input) in view.
	const prevCount = useRef(ids.length);
	useEffect(() => {
		if (ids.length > prevCount.current && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
		prevCount.current = ids.length;
	}, [ids.length]);

	const commit = (text?: string) => {
		const next = commitLinks(value, text);
		if (next !== null) onValueChange(next);
		return next !== null;
	};

	return (
		<div className={className}>
			<div
				onClick={() => inputRef.current?.focus()}
				className={cn(
					"group/field relative cursor-text rounded-2xl bg-surface-highest transition-shadow duration-200",
					error ? "ring-[1.5px] ring-destructive focus-within:ring-2" : "focus-within:ring-2 focus-within:ring-primary"
				)}
			>
				<Link2 aria-hidden className={cn("pointer-events-none absolute left-3.5 top-4 size-6 transition-colors", error ? "text-destructive" : "text-muted-foreground group-focus-within/field:text-primary")} strokeWidth={1.9} />
				{hasItems && (
					// The top padding sits outside the scroller so rows never slide under the label.
					<div className="pl-12 pr-12 pt-8">
						<ol ref={listRef} aria-label="Track links" className="max-h-[min(36dvh,296px)] space-y-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
							{ids.map((id, i) => (
								<motion.li
									key={id}
									initial={{ opacity: 0, y: 6 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.015, ease: [0.2, 0, 0, 1] }}
									className="flex h-8 items-center gap-2 rounded-m3-sm bg-surface-high pl-2 pr-0.5 text-xs"
								>
									<span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{i + 1}</span>
									<Music aria-hidden className="size-3.5 shrink-0 text-[#13843c] dark:text-[#1ed760]" />
									<span className="min-w-0 flex-1 truncate font-mono">
										<span className="text-muted-foreground">open.spotify.com/track/</span>
										{id}
									</span>
									<button
										type="button"
										aria-label={`Remove link ${i + 1}`}
										title="Remove"
										onClick={(e) => {
											e.stopPropagation();
											onValueChange(removeLink(value, id));
											inputRef.current?.focus();
										}}
										className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,transform] hover:bg-foreground/[0.08] hover:text-foreground active:scale-90"
									>
										<X className="size-3.5" />
									</button>
								</motion.li>
							))}
						</ol>
					</div>
				)}
				<input
					ref={inputRef}
					id={fieldId}
					autoFocus={autoFocus}
					value={draft}
					placeholder={hasItems ? "Paste more links…" : "https://open.spotify.com/playlist/…"}
					autoComplete="off"
					spellCheck={false}
					enterKeyHint="go"
					aria-invalid={!!error || undefined}
					aria-describedby={error ? errorId : undefined}
					onChange={(e) => onValueChange(`${value.slice(0, value.length - draft.length)}${e.target.value}`)}
					onPaste={(e) => {
						if (commit(e.clipboardData.getData("text"))) e.preventDefault();
					}}
					onBlur={() => commit()}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.nativeEvent.isComposing) {
							e.preventDefault();
							if (!commit()) onSubmit();
						} else if (e.key === "Backspace" && !draft && hasItems) {
							e.preventDefault();
							onValueChange(removeLink(value, ids[ids.length - 1]));
						}
					}}
					className={cn(
						"peer block w-full bg-transparent pb-2 pl-12 pr-12 text-base text-foreground outline-none",
						hasItems ? "pt-2 placeholder:text-muted-foreground/70" : "pt-6 placeholder:text-transparent focus:placeholder:text-muted-foreground/70"
					)}
				/>
				<label
					htmlFor={fieldId}
					className={cn(
						"pointer-events-none absolute left-12 right-12 origin-left truncate leading-6 transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
						hasItems || draft ? "top-1.5 text-xs" : "top-4 text-base peer-focus:top-1.5 peer-focus:text-xs",
						error ? "text-destructive" : "text-muted-foreground peer-focus:text-primary"
					)}
				>
					{label}
				</label>
				{suffix && (
					<div className="absolute right-1.5 top-1.5" onClick={(e) => e.stopPropagation()}>
						{suffix}
					</div>
				)}
			</div>
			{error && (
				<motion.p id={errorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 px-4 text-xs font-medium text-destructive">
					{error}
				</motion.p>
			)}
		</div>
	);
}
