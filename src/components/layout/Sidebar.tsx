"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import {
	Home,
	Search,
	BarChart3,
	Link2,
	Settings,
	Info,
	Music,
	History,
} from "lucide-react";

const navItems = [
	{ path: "/", label: "Home", icon: Home },
	{ path: "/search", label: "Search", icon: Search },
	{ path: "/charts", label: "Charts", icon: BarChart3 },
	{ path: "/link-analyzer", label: "Analyzer", icon: Link2 },
];

const authItems = [
	{ path: "/my-playlists", label: "Playlists", icon: Music },
	{ path: "/download-history", label: "History", icon: History },
];

const secondaryItems = [
	{ path: "/settings", label: "Settings", icon: Settings },
	{ path: "/about", label: "About", icon: Info },
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
			<Link key={item.path} href={item.path} className="no-underline" onClick={onNavigate}>
				<Button
					variant="ghost"
					className={`w-full justify-start gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider border-transparent ${
						isActive
							? "bg-foreground text-background border-foreground"
							: "text-muted-foreground hover:text-foreground hover:bg-muted"
					}`}
				>
					<Icon className="h-4 w-4" />
					<span>{item.label}</span>
				</Button>
			</Link>
		);
	};

	return (
		<nav className="flex h-full flex-col">
			<div className="flex flex-col gap-0.5 px-3 py-3">
				{navItems.map(renderItem)}
				{isAuthenticated && (
					<>
						<div className="my-2 h-[2px] bg-foreground" />
						{authItems.map(renderItem)}
					</>
				)}
			</div>

			<div className="flex-1" />

			<div className="flex flex-col gap-0.5 px-3 pb-3">
				<div className="mb-2 h-[2px] bg-foreground" />
				{secondaryItems.map(renderItem)}
			</div>
		</nav>
	);
}

// Keep old export name for any remaining references
export const Sidebar = Navigation;
