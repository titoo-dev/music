"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import {
	Home,
	Search,
	Info,
	Music,
	History,
	Settings,
} from "lucide-react";

const navItems = [
	{ path: "/", label: "HOME", icon: Home },
	{ path: "/search", label: "SEARCH", icon: Search },
];

const authItems = [
	{ path: "/my-playlists", label: "PLAYLISTS", icon: Music },
	{ path: "/download-history", label: "HISTORY", icon: History },
];

const secondaryItems = [
	{ path: "/settings", label: "SETTINGS", icon: Settings },
	{ path: "/about", label: "ABOUT", icon: Info },
];

interface NavigationProps {
	onNavigate?: () => void;
}

/**
 * Vertical navigation used in the desktop sidebar and mobile sheet.
 */
export function Navigation({ onNavigate }: NavigationProps) {
	const pathname = usePathname();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const renderItem = (item: { path: string; label: string; icon: any }) => {
		const isActive = pathname === item.path;
		const Icon = item.icon;

		return (
			<Link
				key={item.path}
				href={item.path}
				onClick={onNavigate}
				className={`group relative flex items-center gap-3 px-[18px] py-3 no-underline border-l-[4px] font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
					isActive
						? "border-l-accent bg-primary text-white"
						: "border-l-transparent text-background/70 hover:bg-white/[0.08] hover:text-background"
				}`}
			>
				<Icon className="h-4 w-4 shrink-0" />
				<span className="truncate">{item.label}</span>
			</Link>
		);
	};

	return (
		<nav className="flex h-full flex-col bg-foreground text-background">
			{/* Top nav block */}
			<div className="flex flex-col gap-0.5 py-3">
				{navItems.map(renderItem)}
				{isAuthenticated && (
					<>
						<div className="my-2 mx-[18px] h-[2px] bg-background/30" />
						{authItems.map(renderItem)}
					</>
				)}
			</div>

			<div className="flex-1" />

			{/* Bottom secondary block */}
			<div className="flex flex-col gap-0.5 pb-3 pt-3 border-t-[2px] border-background/30">
				{secondaryItems.map(renderItem)}
			</div>
		</nav>
	);
}

// Keep old export name for any remaining references
export const Sidebar = Navigation;
