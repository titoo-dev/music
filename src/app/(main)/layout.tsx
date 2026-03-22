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
import { AudioEngine } from "@/components/audio/AudioEngine";
import { Player } from "@/components/audio/Player";
import { FullscreenPlayer } from "@/components/audio/FullscreenPlayer";

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

	return (
		<div className="flex min-h-screen bg-background max-w-full overflow-x-hidden">
			{/* ─── Desktop Sidebar ─── */}
			<aside className="hidden border-r-[3px] border-foreground bg-sidebar md:fixed md:inset-y-0 md:z-40 md:flex md:w-56 md:flex-col">
				{/* Logo */}
				<Link
					href="/"
					className="flex h-16 shrink-0 items-center gap-3 border-b-[3px] border-sidebar-border px-5 no-underline"
				>
					<div className="flex h-8 w-8 items-center justify-center border-[2px] border-foreground bg-primary text-sm font-black text-white">
						D
					</div>
					<span className="text-lg font-black tracking-tight text-sidebar-foreground uppercase">
						deemix
					</span>
				</Link>

				{/* Navigation */}
				<div className="flex-1 overflow-y-auto">
					<Navigation />
				</div>

				{/* User section */}
				{isAuthenticated && user ? (
					<div className="shrink-0 border-t-[3px] border-sidebar-border p-3">
						<div className="flex items-center gap-3 px-2 py-2">
							<Avatar className="h-8 w-8 shrink-0 border-[2px] border-foreground">
								{avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
								<AvatarFallback className="bg-muted text-xs font-bold text-foreground">
									{displayName.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="flex-1 truncate text-sm font-bold text-foreground">
								{displayName}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0 border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								onClick={handleLogout}
							>
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					</div>
				) : (
					<div className="shrink-0 border-t-[3px] border-sidebar-border p-3">
						<Link href="/login" className="no-underline">
							<Button variant="outline" size="sm" className="w-full">
								Sign in
							</Button>
						</Link>
					</div>
				)}
			</aside>

			{/* ─── Main Area ─── */}
			<div className="flex flex-1 flex-col min-w-0 md:pl-56">
				{/* Top bar */}
				<header className="sticky top-0 z-30 border-b-[3px] border-foreground bg-background">
					<div className="flex h-16 items-center gap-4 px-4 sm:px-6">
						{/* Mobile hamburger */}
						<Button
							variant="ghost"
							size="icon"
							className="shrink-0 md:hidden"
							onClick={() => setSidebarOpen(true)}
						>
							<Menu className="h-5 w-5" />
						</Button>

						{/* Mobile logo */}
						<Link
							href="/"
							className="flex shrink-0 items-center gap-2 no-underline md:hidden"
						>
							<div className="flex h-7 w-7 items-center justify-center border-[2px] border-foreground bg-primary text-xs font-black text-white">
								D
							</div>
							<span className="text-base font-black tracking-tight text-foreground uppercase">
								deemix
							</span>
						</Link>

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

						{/* User avatar / menu (mobile only) */}
						<div className="md:hidden">
							{isAuthenticated && user ? (
								<DropdownMenu>
									<DropdownMenuTrigger
										render={
											<Button variant="ghost" size="icon" className="shrink-0" />
										}
									>
										<Avatar className="h-7 w-7 border-[2px] border-foreground">
											{avatarUrl ? (
												<AvatarImage src={avatarUrl} />
											) : null}
											<AvatarFallback className="bg-accent text-xs font-bold text-foreground">
												{displayName.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-48 border-[3px] border-foreground shadow-[var(--shadow-brutal)]">
										<DropdownMenuItem className="gap-2 text-sm font-bold">
											<span className="truncate">{displayName}</span>
										</DropdownMenuItem>
										<Link href="/my-playlists" className="no-underline">
											<DropdownMenuItem className="gap-2 text-sm font-bold">
												<Music className="h-3.5 w-3.5" />
												My Playlists
											</DropdownMenuItem>
										</Link>
										<Link href="/download-history" className="no-underline">
											<DropdownMenuItem className="gap-2 text-sm font-bold">
												<History className="h-3.5 w-3.5" />
												Download History
											</DropdownMenuItem>
										</Link>
										<Link href="/settings" className="no-underline">
											<DropdownMenuItem className="gap-2 text-sm font-bold">
												<Settings className="h-3.5 w-3.5" />
												Settings
											</DropdownMenuItem>
										</Link>
										<Link href="/about" className="no-underline">
											<DropdownMenuItem className="gap-2 text-sm font-bold">
												<Info className="h-3.5 w-3.5" />
												About
											</DropdownMenuItem>
										</Link>
										<DropdownMenuItem
											className="gap-2 text-sm font-bold text-destructive"
											onClick={() => handleLogout()}
										>
											<LogOut className="h-3.5 w-3.5" />
											Log out
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								<Link href="/login" className="no-underline">
									<Button variant="ghost" size="sm">
										Sign in
									</Button>
								</Link>
							)}
						</div>
					</div>

					{/* Mobile search bar */}
					<div className="border-t-[2px] border-foreground px-4 py-2 md:hidden">
						<Suspense>
							<SearchBar />
						</Suspense>
					</div>
				</header>

				{/* ─── Main Content + Downloads Panel ─── */}
				<div className="flex flex-1 overflow-hidden min-w-0">
					<ScrollArea
						className={`flex-1 min-w-0 transition-all duration-300 ${
							downloadsOpen ? "hidden sm:block sm:mr-[340px]" : ""
						}`}
					>
						<main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 lg:px-8 min-w-0">
							{children}
						</main>
					</ScrollArea>

					{/* ─── Downloads Side Panel ─── */}
					<DownloadPanel />
				</div>
			</div>

			{/* ─── Mobile Navigation Sheet ─── */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
					<SheetHeader className="border-b-[3px] border-foreground px-6 py-4">
						<SheetTitle className="flex items-center gap-2 text-base font-black text-foreground">
							<div className="flex h-7 w-7 items-center justify-center border-[2px] border-foreground bg-primary text-[10px] font-black text-white">
								D
							</div>
							DEEMIX
						</SheetTitle>
						<SheetDescription className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
							Navigation
						</SheetDescription>
					</SheetHeader>
					<Navigation onNavigate={() => setSidebarOpen(false)} />
				</SheetContent>
			</Sheet>

			{/* ─── Audio ─── */}
			<AudioPreview />
			<MiniPlayer />
			<AudioEngine />
			<Player />
			<FullscreenPlayer />
		</div>
	);
}
