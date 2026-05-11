"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import {
	Home,
	Search,
	Library,
	ListMusic,
	Settings,
	type LucideIcon,
} from "lucide-react";

type Tab = {
	path: string;
	label: string;
	icon: LucideIcon;
	requireAuth: boolean;
};

const TABS: readonly Tab[] = [
	{ path: "/", label: "HOME", icon: Home, requireAuth: false },
	{ path: "/search", label: "SEARCH", icon: Search, requireAuth: false },
	{ path: "/library", label: "LIBRARY", icon: Library, requireAuth: true },
	{ path: "/my-playlists", label: "PLAYLISTS", icon: ListMusic, requireAuth: true },
	{ path: "/settings", label: "SETTINGS", icon: Settings, requireAuth: false },
] as const;

/**
 * Mobile primary navigation. Renders 3 tabs for guests (Home/Search/Settings)
 * and 5 tabs for authenticated users (adds Library/Playlists). Sits above the
 * floating MiniPlayer (z-50 over MiniPlayer's z-45) and respects the bottom
 * safe-area inset on devices that report one.
 */
export function BottomNav() {
	const pathname = usePathname();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const visible = TABS.filter((t) => !t.requireAuth || isAuthenticated);

	return (
		<nav
			aria-label="Primary"
			className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-foreground bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
		>
			<ul className="grid h-16 grid-flow-col auto-cols-fr">
				{visible.map((tab) => {
					const isActive =
						tab.path === "/"
							? pathname === "/"
							: pathname === tab.path || pathname.startsWith(`${tab.path}/`);
					const Icon = tab.icon;
					return (
						<li key={tab.path} className="contents">
							<Link
								href={tab.path}
								aria-current={isActive ? "page" : undefined}
								aria-label={tab.label.toLowerCase()}
								className={`group relative flex flex-col items-center justify-center gap-1 no-underline transition-colors ${
									isActive
										? "text-foreground"
										: "text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground"
								}`}
							>
								{isActive && (
									<span
										aria-hidden
										className="absolute inset-x-3 top-0 h-[3px] bg-primary"
									/>
								)}
								<Icon
									className={`h-5 w-5 ${isActive ? "" : "opacity-70"}`}
									aria-hidden
								/>
								<span className="font-mono text-[9px] font-bold tracking-[0.1em]">
									{tab.label}
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
