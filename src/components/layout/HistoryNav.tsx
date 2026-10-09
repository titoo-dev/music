"use client";

import { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Back / Forward for the installed app. A PWA window (`standalone`, or the
 * desktop window without a title bar) has no browser arrows, so deep pages
 * would be dead ends. In a browser tab this renders nothing.
 */

const INSTALLED = ["(display-mode: standalone)", "(display-mode: window-controls-overlay)", "(display-mode: fullscreen)"];

const media = (q: string) => (typeof window.matchMedia === "function" ? window.matchMedia(q) : null);

function subscribeInstalled(onChange: () => void) {
	const lists = INSTALLED.map(media);
	lists.forEach((l) => l?.addEventListener?.("change", onChange));
	return () => lists.forEach((l) => l?.removeEventListener?.("change", onChange));
}
const isInstalled = () => INSTALLED.some((q) => media(q)?.matches) || (navigator as { standalone?: boolean }).standalone === true;

/** The Navigation API (Chromium) knows whether there is an entry behind / ahead. */
type NavigationLike = EventTarget & { canGoBack?: boolean; canGoForward?: boolean };
const navigation = () => (window as unknown as { navigation?: NavigationLike }).navigation;

function subscribeHistory(onChange: () => void) {
	const nav = navigation();
	nav?.addEventListener("currententrychange", onChange);
	window.addEventListener("popstate", onChange);
	return () => {
		nav?.removeEventListener("currententrychange", onChange);
		window.removeEventListener("popstate", onChange);
	};
}
// Without the Navigation API, assume there is somewhere to go back to once the tab has history.
const canGoBack = () => navigation()?.canGoBack ?? window.history.length > 1;
const canGoForward = () => navigation()?.canGoForward ?? false;

/** Where Back goes when the page was opened with nothing behind it (a shared link, a notification). */
export function parentRoute(pathname: string): string | null {
	if (pathname === "/") return null;
	if (["/album", "/artist", "/playlist"].includes(pathname)) return "/search";
	if (pathname.startsWith("/my-playlists/")) return "/my-playlists";
	if (pathname === "/errors" || pathname === "/about") return "/settings";
	return "/";
}

export function HistoryNav() {
	const router = useRouter();
	const pathname = usePathname();
	const installed = useSyncExternalStore(subscribeInstalled, isInstalled, () => false);
	const back = useSyncExternalStore(subscribeHistory, canGoBack, () => false);
	const forward = useSyncExternalStore(subscribeHistory, canGoForward, () => false);
	if (!installed) return null;

	const parent = parentRoute(pathname);
	const goBack = () => {
		if (back) router.back();
		else if (parent) router.replace(parent);
	};

	return (
		<div className="flex shrink-0 items-center">
			<Button variant="ghost" size="icon-touch" aria-label="Back" title="Back" disabled={!back && !parent} onClick={goBack}>
				<ChevronLeft />
			</Button>
			{/* Phones have a system back gesture but nothing for Forward: keep the bar light there. */}
			<Button variant="ghost" size="icon-touch" aria-label="Forward" title="Forward" disabled={!forward} onClick={() => router.forward()} className="hidden md:inline-flex">
				<ChevronRight />
			</Button>
		</div>
	);
}
