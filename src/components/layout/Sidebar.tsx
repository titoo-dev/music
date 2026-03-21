"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { useLoginStore } from "@/stores/useLoginStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Home,
	Search,
	BarChart3,
	Link2,
	Settings,
	Info,
} from "lucide-react";

const navItems = [
	{ path: "/", label: "Home", icon: Home },
	{ path: "/search", label: "Search", icon: Search },
	{ path: "/charts", label: "Charts", icon: BarChart3 },
	{ path: "/link-analyzer", label: "Analyzer", icon: Link2 },
];

const secondaryItems = [
	{ path: "/settings", label: "Settings", icon: Settings },
	{ path: "/about", label: "About", icon: Info },
];

interface NavigationProps {
	isMobile?: boolean;
	onNavigate?: () => void;
}

/**
 * Navigation component used both in the top bar (desktop: horizontal)
 * and in the mobile Sheet (vertical list).
 */
export function Navigation({ isMobile = false, onNavigate }: NavigationProps) {
	const pathname = usePathname();

	if (isMobile) {
		return (
			<nav className="flex flex-col py-2">
				{navItems.map((item) => {
					const isActive = pathname === item.path;
					const Icon = item.icon;
					return (
						<Link key={item.path} href={item.path} className="no-underline" onClick={onNavigate}>
							<Button
								variant="ghost"
								className={`w-full justify-start gap-3 rounded-none px-6 py-6 text-sm font-medium ${
									isActive
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								<span>{item.label}</span>
							</Button>
						</Link>
					);
				})}

				<Separator className="my-2" />

				{secondaryItems.map((item) => {
					const isActive = pathname === item.path;
					const Icon = item.icon;
					return (
						<Link key={item.path} href={item.path} className="no-underline" onClick={onNavigate}>
							<Button
								variant="ghost"
								className={`w-full justify-start gap-3 rounded-none px-6 py-6 text-sm font-medium ${
									isActive
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								<span>{item.label}</span>
							</Button>
						</Link>
					);
				})}
			</nav>
		);
	}

	// Desktop: horizontal nav links
	return (
		<nav className="flex items-center gap-1">
			{navItems.map((item) => {
				const isActive = pathname === item.path;
				const Icon = item.icon;
				return (
					<Link key={item.path} href={item.path} className="no-underline">
						<Button
							variant="ghost"
							size="sm"
							className={`gap-1.5 text-sm font-medium ${
								isActive
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<Icon className="h-3.5 w-3.5" />
							<span>{item.label}</span>
						</Button>
					</Link>
				);
			})}
		</nav>
	);
}

// Keep old export name for any remaining references
export const Sidebar = Navigation;
