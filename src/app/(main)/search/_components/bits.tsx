"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Stadium label: "Album", "Artist", "Top result" kinds. */
export function KindPill({ children, tone = "secondary", className }: { children: ReactNode; tone?: "secondary" | "primary"; className?: string }) {
	return (
		<span
			className={cn(
				"inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold leading-none",
				tone === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
				className
			)}
		>
			{children}
		</span>
	);
}

/** `matchMedia` as state (false on the server and during hydration). */
export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		(cb) => {
			const mq = window.matchMedia(query);
			mq.addEventListener("change", cb);
			return () => mq.removeEventListener("change", cb);
		},
		() => window.matchMedia(query).matches,
		() => false
	);
}
