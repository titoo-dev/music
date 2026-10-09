"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { doneNavProgress, startNavProgress, useNavProgress } from "@/lib/nav-progress";
import { cn } from "@/lib/utils";

/** Quick navigations finish before the bar would show: no flicker. */
const SHOW_AFTER_MS = 120;

/**
 * Top loader: a thin bar under the status bar while the next page loads (or
 * compiles, in dev). Starts on any in-app link click (and ⌘K / search
 * submits, which call `startNavProgress`), ends when the URL changes.
 * Mount inside a <Suspense> (it reads the search params).
 */
export function NavProgress() {
	const since = useNavProgress((s) => s.since);
	const pathname = usePathname();
	const search = useSearchParams().toString();
	const [shown, setShown] = useState(false);
	const [finishing, setFinishing] = useState(false);

	// Any in-app link click starts it (Next.js links included — they navigate client-side).
	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			const a = (e.target as Element | null)?.closest?.("a[href]");
			if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || a.hasAttribute("download")) return;
			startNavProgress(a.href);
		};
		document.addEventListener("click", onClick, true);
		return () => document.removeEventListener("click", onClick, true);
	}, []);

	// The URL changed: the page is there.
	useEffect(() => {
		doneNavProgress();
	}, [pathname, search]);

	useEffect(() => {
		if (since === null) {
			if (!shown) return;
			// Run to 100%, then fade.
			const t1 = setTimeout(() => setFinishing(true), 0);
			const t2 = setTimeout(() => {
				setShown(false);
				setFinishing(false);
			}, 300);
			return () => {
				clearTimeout(t1);
				clearTimeout(t2);
			};
		}
		const t = setTimeout(() => setShown(true), SHOW_AFTER_MS);
		return () => clearTimeout(t);
	}, [since, shown]);

	if (!shown) return null;
	return (
		<div
			role="progressbar"
			aria-label="Loading page"
			className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-[100] h-0.5"
		>
			<div
				className={cn(
					"h-full origin-left bg-highlight shadow-[0_0_8px_var(--highlight)] motion-reduce:animate-none",
					finishing ? "w-full opacity-0 transition-[width,opacity] duration-300 ease-out" : "w-[80%] animate-[nav-progress_8s_cubic-bezier(0.1,0.7,0.2,1)]"
				)}
			/>
		</div>
	);
}
