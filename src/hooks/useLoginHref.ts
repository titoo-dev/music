"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { currentLoginHref } from "@/lib/login-redirect";

const noop = () => () => {};

/**
 * `/login?next=<this page>` for a sign-in link, so signing in comes back here.
 * Plain `/login` on the server; the page's query is read on the client, and
 * the pathname keeps it current across navigations.
 */
export function useLoginHref(): string {
	usePathname();
	return useSyncExternalStore(noop, currentLoginHref, () => "/login");
}
