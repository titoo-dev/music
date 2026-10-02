"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "motion/react";
import { Info, ListMusic, LogOut, Monitor, Moon, Search, Settings, Sun } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useCommandStore } from "@/stores/useCommandStore";
import { authClient } from "@/lib/auth-client";
import { applyThemePreference, readThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogoMark } from "@/components/motion/icons";
import { CommandTrigger } from "@/components/command/CommandPalette";

const NAV = [
	{ href: "/", label: "All music", auth: false },
	{ href: "/library", label: "Library", auth: true },
	{ href: "/my-playlists", label: "Playlists", auth: true },
	{ href: "/settings", label: "Settings", auth: false },
];

function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/" || pathname === "/search";
	return pathname === href || pathname.startsWith(`${href}/`);
}

function ThemeSwitch() {
	// Only mounts inside the open account menu (client-side), so reading storage here is safe.
	const [pref, setPref] = useState<ThemePreference>(readThemePreference);
	const options: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
		{ value: "system", icon: Monitor, label: "System" },
		{ value: "light", icon: Sun, label: "Light" },
		{ value: "dark", icon: Moon, label: "Dark" },
	];
	return (
		<div className="flex items-center justify-between gap-3 px-2 py-1.5 text-sm">
			<span className="text-muted-foreground">Theme</span>
			<LayoutGroup id="theme-switch">
				<div className="flex rounded-full border border-border p-0.5">
					{options.map(({ value, icon: Icon, label }) => (
						<button
							key={value}
							type="button"
							aria-label={`${label} theme`}
							aria-pressed={pref === value}
							onClick={(e) => {
								e.stopPropagation();
								setPref(value);
								applyThemePreference(value);
							}}
							className={cn("relative flex size-6 items-center justify-center rounded-full", pref === value ? "text-foreground" : "text-muted-foreground")}
						>
							{pref === value && <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-full bg-accent" />}
							<Icon className="relative size-3.5" />
						</button>
					))}
				</div>
			</LayoutGroup>
		</div>
	);
}

export function AppHeader() {
	const pathname = usePathname();
	const user = useAuthStore((s) => s.user);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const deezerUser = useAuthStore((s) => s.deezerUser);
	const logout = useAuthStore((s) => s.logout);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const openPalette = useCommandStore((s) => s.open);

	const handleLogout = async () => {
		await authClient.signOut();
		try {
			await fetch("/api/v1/auth/logout", { method: "POST" });
		} catch {
			// Ignore errors
		}
		logout();
	};

	const avatarUrl = deezerUser?.picture
		? `https://e-cdns-images.dzcdn.net/images/user/${deezerUser.picture}/56x56-000000-80-0-0.jpg`
		: user?.image || null;
	const displayName = user?.name || deezerUser?.name || "User";
	const nav = NAV.filter((n) => !n.auth || isAuthenticated);

	return (
		<header className="app-titlebar glass sticky top-0 z-40 border-b border-border">
			<div className="mx-auto flex h-[var(--header-h)] w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
				<Link href="/" className="flex shrink-0 items-center gap-2 no-underline" aria-label="wavelet home">
					<LogoMark animated={isPlaying} className="size-6" />
					<span className="hidden text-[15px] font-semibold tracking-tight text-foreground sm:inline">wavelet</span>
				</Link>

				<span aria-hidden className="hidden h-5 w-px rotate-12 bg-border md:block" />

				<LayoutGroup id="main-nav">
					<nav aria-label="Primary" className="hidden items-center md:flex">
						{nav.map((item) => {
							const active = isActive(pathname, item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"relative rounded-md px-3 py-1.5 text-sm no-underline transition-colors",
										active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
									)}
								>
									{active && (
										<motion.span
											layoutId="nav-active"
											className="absolute inset-0 rounded-md bg-accent"
											transition={{ type: "spring", stiffness: 500, damping: 38 }}
										/>
									)}
									<span className="relative">{item.label}</span>
								</Link>
							);
						})}
					</nav>
				</LayoutGroup>

				<div className="flex flex-1 items-center justify-end gap-2">
					<CommandTrigger className="hidden sm:flex" />
					<Button variant="ghost" size="icon-touch" aria-label="Search" className="sm:hidden" onClick={() => openPalette()}>
						<Search />
					</Button>

					{isAuthenticated && user ? (
						<DropdownMenu>
							<DropdownMenuTrigger
								aria-label="Account"
								className="flex size-8 shrink-0 items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
							>
								<Avatar className="size-8 border border-border">
									{avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
									<AvatarFallback className="bg-gradient-to-br from-muted to-accent text-xs font-medium text-foreground">
										{displayName.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-60">
								<DropdownMenuGroup>
									<DropdownMenuLabel className="font-normal">
										<p className="truncate text-sm font-medium text-foreground">{displayName}</p>
										{user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
									</DropdownMenuLabel>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<ThemeSwitch />
								<DropdownMenuSeparator />
								<DropdownMenuItem render={<Link href="/my-playlists" />} className="gap-2">
									<ListMusic className="size-4" />
									My playlists
								</DropdownMenuItem>
								<DropdownMenuItem render={<Link href="/settings" />} className="gap-2">
									<Settings className="size-4" />
									Settings
								</DropdownMenuItem>
								<DropdownMenuItem render={<Link href="/about" />} className="gap-2">
									<Info className="size-4" />
									About
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleLogout()}>
									<LogOut className="size-4" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button size="sm" render={<Link href="/login" />} nativeButton={false}>
							Sign in
						</Button>
					)}
				</div>
			</div>

			{/* Mobile nav — horizontal segmented row */}
			<LayoutGroup id="mobile-nav">
				<nav aria-label="Primary mobile" className="scrollbar-hide flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
					{nav.map((item) => {
						const active = isActive(pathname, item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"relative shrink-0 rounded-full px-3 py-1.5 text-[13px] no-underline",
									active ? "text-background" : "text-muted-foreground"
								)}
							>
								{active && <motion.span layoutId="mobile-nav-active" className="absolute inset-0 rounded-full bg-foreground" />}
								<span className="relative">{item.label}</span>
							</Link>
						);
					})}
				</nav>
			</LayoutGroup>
		</header>
	);
}
