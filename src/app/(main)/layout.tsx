"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/Sidebar";
import { SearchBar } from "@/components/layout/SearchBar";
import { DownloadTrigger } from "@/components/downloads/DownloadTrigger";
import { DownloadPanel } from "@/components/downloads/DownloadPanel";
import { useSocket } from "@/hooks/useSocket";
import { useInitApp } from "@/hooks/useInitApp";
import { useQueuePolling } from "@/hooks/useQueuePolling";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { authClient } from "@/lib/auth-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Menu, Settings, Info, LogOut, Music, History } from "lucide-react";
import { AudioPreview } from "@/components/audio/AudioPreview";
import { MiniPlayer } from "@/components/audio/MiniPlayer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
	useSocket();
	useInitApp();
	useQueuePolling();

	const sidebarOpen = useAppStore((s) => s.sidebarOpen);
	const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
	const downloadsOpen = useAppStore((s) => s.downloadsOpen);

	const user = useAuthStore((s) => s.user);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const deezerUser = useAuthStore((s) => s.deezerUser);
	const logout = useAuthStore((s) => s.logout);

	const handleLogout = async () => {
		// Sign out from better-auth (clears session cookie)
		await authClient.signOut();
		// Clear Deezer session server-side
		try {
			await fetch("/api/v1/auth/logout", { method: "POST" });
		} catch {
			// Ignore errors
		}
		// Clear client state
		logout();
	};

	// Determine avatar display: prefer Deezer picture, fallback to Google image
	const avatarUrl = deezerUser?.picture
		? `https://e-cdns-images.dzcdn.net/images/user/${deezerUser.picture}/56x56-000000-80-0-0.jpg`
		: user?.image || null;
	const displayName = user?.name || deezerUser?.name || "User";

	return (
		<div className="flex min-h-screen flex-col bg-white">
			{/* ─── Top Navigation Bar ─── */}
			<header className="sticky top-0 z-30 border-b border-border/40 bg-white/80 backdrop-blur-sm">
				<div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
					{/* Mobile hamburger */}
					<Button
						variant="ghost"
						size="icon"
						className="shrink-0 text-muted-foreground md:hidden"
						onClick={() => setSidebarOpen(true)}
					>
						<Menu className="h-5 w-5" />
					</Button>

					{/* Logo */}
					<Link
						href="/"
						className="mr-2 flex shrink-0 items-center gap-2 no-underline"
					>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
							d
						</div>
						<span className="hidden text-base font-semibold tracking-tight text-foreground sm:inline">
							deemix
						</span>
					</Link>

					{/* Desktop nav links */}
					<div className="hidden md:flex">
						<Navigation />
					</div>

					{/* Spacer */}
					<div className="flex-1" />

					{/* Search bar (desktop) */}
					<div className="hidden md:block">
						<Suspense>
							<SearchBar />
						</Suspense>
					</div>

					{/* Downloads panel trigger */}
					<DownloadTrigger />

					{/* User avatar / menu */}
					{isAuthenticated && user ? (
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button variant="ghost" size="icon" className="shrink-0 rounded-full" />
								}
							>
								<Avatar className="h-7 w-7">
									{avatarUrl ? (
										<AvatarImage src={avatarUrl} />
									) : null}
									<AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
										{displayName.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-48">
								<DropdownMenuItem className="gap-2 text-sm">
									<span className="truncate font-medium">{displayName}</span>
								</DropdownMenuItem>
								<Link href="/my-playlists" className="no-underline">
									<DropdownMenuItem className="gap-2 text-sm">
										<Music className="h-3.5 w-3.5" />
										My Playlists
									</DropdownMenuItem>
								</Link>
								<Link href="/download-history" className="no-underline">
									<DropdownMenuItem className="gap-2 text-sm">
										<History className="h-3.5 w-3.5" />
										Download History
									</DropdownMenuItem>
								</Link>
								<Link href="/settings" className="no-underline">
									<DropdownMenuItem className="gap-2 text-sm">
										<Settings className="h-3.5 w-3.5" />
										Settings
									</DropdownMenuItem>
								</Link>
								<Link href="/about" className="no-underline">
									<DropdownMenuItem className="gap-2 text-sm">
										<Info className="h-3.5 w-3.5" />
										About
									</DropdownMenuItem>
								</Link>
								<DropdownMenuItem
									className="gap-2 text-sm text-red-500"
									onClick={() => handleLogout()}
								>
									<LogOut className="h-3.5 w-3.5" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Link href="/login" className="no-underline">
							<Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
								Sign in
							</Button>
						</Link>
					)}
				</div>

				{/* Mobile search bar - below the nav on small screens */}
				<div className="border-t border-border/40 px-4 py-2 md:hidden">
					<Suspense>
						<SearchBar />
					</Suspense>
				</div>
			</header>

			{/* ─── Mobile Navigation Sheet ─── */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent side="left" className="w-[280px] p-0">
					<SheetHeader className="border-b border-border/40 px-6 py-4">
						<SheetTitle className="flex items-center gap-2 text-base font-semibold">
							<div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
								d
							</div>
							deemix
						</SheetTitle>
						<SheetDescription className="text-xs text-muted-foreground">
							Navigation
						</SheetDescription>
					</SheetHeader>
					<Navigation isMobile onNavigate={() => setSidebarOpen(false)} />
				</SheetContent>
			</Sheet>

			{/* ─── Main Content + Downloads Panel ─── */}
			<div className="flex flex-1 overflow-hidden">
				<ScrollArea
					className={`flex-1 transition-all duration-300 ${
						downloadsOpen ? "mr-[340px]" : ""
					}`}
				>
					<main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
						{children}
					</main>
				</ScrollArea>

				{/* ─── Downloads Side Panel ─── */}
				<DownloadPanel />
			</div>

			{/* ─── Audio Preview ─── */}
			<AudioPreview />
			<MiniPlayer />
		</div>
	);
}
