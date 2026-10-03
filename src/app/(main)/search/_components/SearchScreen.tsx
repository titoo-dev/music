"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchGlyph } from "@/components/motion/icons";
import { DUR, EASE, FilterPills } from "@/components/expressive";
import { useDownloadedAlbums } from "@/hooks/useDownloadedAlbums";
import { mainTotals, parseTab, type SearchTab } from "../_lib/search-model";
import { recentSearches } from "../_lib/useRecentSearches";
import { useMainSearch } from "../_lib/useSearch";
import { Browse } from "./Browse";
import { Suggestions } from "./Suggestions";
import { AllResults, TypedResults } from "./Results";

const HINT = "Songs, albums, artists or a Deezer link";

/** Pointer state, so a blur caused by a click doesn't move the target mid-click. */
function usePointerDown() {
	const down = useRef(false);
	useEffect(() => {
		const on = () => (down.current = true);
		const off = () => (down.current = false);
		window.addEventListener("pointerdown", on, true);
		window.addEventListener("pointerup", off, true);
		window.addEventListener("pointercancel", off, true);
		return () => {
			window.removeEventListener("pointerdown", on, true);
			window.removeEventListener("pointerup", off, true);
			window.removeEventListener("pointercancel", off, true);
		};
	}, []);
	return down;
}

export function SearchScreen() {
	const params = useSearchParams();
	const router = useRouter();
	const term = (params.get("term") || "").trim();
	const tab = parseTab(params.get("tab"));

	const inputRef = useRef<HTMLInputElement>(null);
	const pointerDown = usePointerDown();
	const [typed, setTyped] = useState(term);
	const [focused, setFocused] = useState(false);

	// A new submitted term (palette, back/forward, a link) refills the field.
	const [shownTerm, setShownTerm] = useState(term);
	if (shownTerm !== term) {
		setShownTerm(term);
		setTyped(term);
	}

	useEffect(() => {
		if (term) recentSearches.add(term);
	}, [term]);

	const main = useMainSearch(term);
	const { albumMap } = useDownloadedAlbums();

	const submit = useCallback(
		(value: string) => {
			const t = value.trim();
			if (!t) return;
			setTyped(t);
			inputRef.current?.blur();
			recentSearches.add(t);
			if (t === term && tab === "all") return;
			router.push(`/search?term=${encodeURIComponent(t)}`, { scroll: true });
		},
		[router, term, tab]
	);

	const setTab = useCallback(
		(t: SearchTab) => {
			const q = new URLSearchParams({ term });
			if (t !== "all") q.set("tab", t);
			router.replace(`/search?${q.toString()}`, { scroll: false });
		},
		[router, term]
	);

	const clear = () => {
		setTyped("");
		inputRef.current?.focus();
		if (term) router.replace("/search", { scroll: false });
	};

	/** Back arrow / Escape: leave the field and drop an unsubmitted edit. */
	const leave = () => {
		inputRef.current?.blur();
		setTyped(term);
	};

	const onBlur = () => {
		if (!pointerDown.current) return setFocused(false);
		window.addEventListener("pointerup", () => setTimeout(() => setFocused(false), 0), { once: true });
	};

	const draft = typed.trim();
	const idle = !draft && !term;
	const mode: "browse" | "suggest" | "results" = idle ? "browse" : draft !== term ? "suggest" : "results";
	const totals = mainTotals(main.data);

	return (
		<div>
			{/* Large title; collapses away once the user starts searching. */}
			<AnimatePresence initial={false}>
				{idle && !focused && (
					<motion.header
						key="title"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: DUR.medium, ease: EASE.emphasized }}
						className="overflow-hidden"
					>
						<div className="pb-1 pt-3 sm:pt-6">
							<p className="type-eyebrow text-[0.75rem] tracking-[0.18em] text-primary">Discover</p>
							<h1 className="type-display mt-0.5 text-[2.25rem] sm:text-5xl lg:text-6xl">Search</h1>
						</div>
					</motion.header>
				)}
			</AnimatePresence>

			{/* The bar (+ result filters) stays pinned under the top bar. */}
			<div className="sticky top-[var(--header-h)] z-20 mx-[calc(50%-50vw)] glass border-b border-border px-[calc(50vw-50%)] pb-2 pt-2.5">
				<SearchBar
					inputRef={inputRef}
					value={typed}
					focused={focused}
					onChange={setTyped}
					onSubmit={() => submit(typed)}
					onFocus={() => setFocused(true)}
					onBlur={onBlur}
					onClear={clear}
					onLeave={leave}
				/>
				<AnimatePresence initial={false}>
					{mode === "results" && (
						<motion.div
							key="pills"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: DUR.medium, ease: EASE.emphasized }}
							className="overflow-hidden"
						>
							<FilterPills<SearchTab>
								ariaLabel="Result type"
								className="pt-3"
								value={tab}
								onChange={(t) => {
									setTab(t);
									window.scrollTo({ top: 0, behavior: "smooth" });
								}}
								items={[
									{ value: "all", label: "All" },
									{ value: "track", label: "Tracks", count: totals.track },
									{ value: "album", label: "Albums", count: totals.album },
									{ value: "artist", label: "Artists", count: totals.artist },
									{ value: "playlist", label: "Playlists", count: totals.playlist },
								]}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={mode === "results" ? `results:${term}:${tab}` : mode}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0, transition: { duration: DUR.medium, ease: EASE.decelerate } }}
					exit={{ opacity: 0, transition: { duration: DUR.short, ease: EASE.accelerate } }}
					className="pt-2"
				>
					{mode === "browse" && <Browse onSearch={submit} />}
					{mode === "suggest" && <Suggestions term={draft} onSubmit={submit} />}
					{mode === "results" &&
						(tab === "all" ? (
							<AllResults term={term} main={main.data} loading={main.loading} error={main.error} onRetry={main.retry} onTab={setTab} albumMap={albumMap} />
						) : (
							<TypedResults term={term} tab={tab} albumMap={albumMap} />
						))}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

/** M3 search bar; a brand-gradient ring lights up around it while focused. */
function SearchBar({
	inputRef,
	value,
	focused,
	onChange,
	onSubmit,
	onFocus,
	onBlur,
	onClear,
	onLeave,
}: {
	inputRef: React.RefObject<HTMLInputElement | null>;
	value: string;
	focused: boolean;
	onChange: (v: string) => void;
	onSubmit: () => void;
	onFocus: () => void;
	onBlur: () => void;
	onClear: () => void;
	onLeave: () => void;
}) {
	return (
		<form
			role="search"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
			className={cn(
				"relative isolate rounded-[30px] p-[2px] transition-shadow duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
				focused && "shadow-[0_6px_18px_rgb(129_140_248/0.28)]"
			)}
		>
			<span aria-hidden className={cn("bg-brand-gradient absolute inset-0 -z-10 rounded-[30px] transition-opacity duration-300", focused ? "opacity-100" : "opacity-0")} />
			<div className={cn("flex h-14 items-center gap-1 rounded-[28px] pl-1.5 pr-1.5 transition-colors duration-300", focused ? "bg-surface-lowest" : "bg-surface-high hover:bg-surface-highest")}>
				<span className="relative flex size-11 shrink-0 items-center justify-center">
					<AnimatePresence initial={false} mode="popLayout">
						{focused ? (
							<motion.button
								key="back"
								type="button"
								aria-label="Back"
								title="Back"
								onPointerDown={(e) => e.preventDefault()}
								onClick={onLeave}
								initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
								animate={{ rotate: 0, opacity: 1, scale: 1 }}
								exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
								transition={{ duration: DUR.short }}
								className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10"
							>
								<ArrowLeft className="size-[22px]" />
							</motion.button>
						) : (
							<motion.span
								key="search"
								initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
								animate={{ rotate: 0, opacity: 1, scale: 1 }}
								exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
								transition={{ duration: DUR.short }}
								className="flex size-11 items-center justify-center text-foreground"
								onClick={() => inputRef.current?.focus()}
							>
								<SearchGlyph className="size-[22px]" />
							</motion.span>
						)}
					</AnimatePresence>
				</span>
				<input
					ref={inputRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={onFocus}
					onBlur={onBlur}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							e.preventDefault();
							onLeave();
						}
					}}
					type="text"
					enterKeyHint="search"
					placeholder={HINT}
					aria-label="Search Deezer"
					autoComplete="off"
					autoCorrect="off"
					spellCheck={false}
					className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
				/>
				<AnimatePresence initial={false}>
					{value && (
						<motion.button
							key="clear"
							type="button"
							aria-label="Clear"
							title="Clear"
							onPointerDown={(e) => e.preventDefault()}
							onClick={onClear}
							initial={{ rotate: -90, scale: 0, opacity: 0 }}
							animate={{ rotate: 0, scale: 1, opacity: 1 }}
							exit={{ rotate: -90, scale: 0, opacity: 0 }}
							transition={{ duration: DUR.short, ease: EASE.emphasized }}
							className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
						>
							<X className="size-[22px]" />
						</motion.button>
					)}
				</AnimatePresence>
			</div>
		</form>
	);
}
