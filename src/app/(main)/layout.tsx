"use client";

import { Suspense } from "react";
import Link from "next/link";
import { MotionConfig } from "motion/react";
import { Navigation } from "@/components/layout/Sidebar";
import { SearchBar } from "@/components/layout/SearchBar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useInitApp } from "@/hooks/useInitApp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
import { Menu, Info, LogOut, Music } from "lucide-react";
import { AudioPreview } from "@/components/audio/AudioPreview";
import { MiniPlayer } from "@/components/audio/MiniPlayer";
import { AudioEngine } from "@/components/audio/AudioEngine";
import { AudioEngineErrorBoundary } from "@/components/audio/AudioEngineErrorBoundary";
import { Player } from "@/components/audio/Player";
import { FullscreenPlayer } from "@/components/audio/FullscreenPlayer";
import { QueuePanel } from "@/components/audio/QueuePanel";
import { TrackAnnouncer } from "@/components/audio/TrackAnnouncer";
import { Toaster } from "@/components/ui/sonner";
import { LyricsPanel } from "@/components/audio/LyricsPanel";
import { LyricsImmersive } from "@/components/audio/LyricsImmersive";
import { TrackActionSheet } from "@/components/tracks/TrackActionSheet";

export default function MainLayout({ children }: { children: React.ReactNode }) {
	useInitApp();
	useKeyboardShortcuts();

	const sidebarOpen = useAppStore((s) => s.sidebarOpen);
	const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

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
		<MotionConfig reducedMotion="user">
		<div className="flex h-dvh bg-background max-w-full overflow-hidden">
			{/* ─── Desktop Sidebar (dark brutalist) ─── */}
			<aside className="hidden border-r-[3px] border-foreground bg-foreground text-background md:fixed md:inset-y-0 md:z-40 md:flex md:w-60 md:flex-col">
				{/* Logo */}
				<Link
					href="/"
					className="flex h-16 shrink-0 items-center gap-2.5 border-b-[2px] border-background/30 px-[18px] no-underline"
				>
					<div className="h-6 w-6 border-[2px] border-background bg-primary shrink-0" />
					<span className="text-xl font-black tracking-[-0.03em] text-background">
						DEEMIX
					</span>
				</Link>

				{/* Navigation */}
				<div className="flex-1 overflow-y-auto">
					<Navigation />
				</div>

				{/* User section */}
				{isAuthenticated && user ? (
					<div className="shrink-0 border-t-[2px] border-background/30 px-[18px] py-3.5">
						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-background bg-accent text-foreground">
								{avatarUrl ? (
									<Avatar className="h-full w-full">
										<AvatarImage src={avatarUrl} />
										<AvatarFallback className="bg-accent text-xs font-black text-foreground">
											{displayName.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								) : (
									<span className="text-sm font-black">{displayName.charAt(0).toUpperCase()}</span>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-[11px] font-bold tracking-[0.02em] uppercase text-background truncate">
									{displayName}
								</div>
								<div className="text-[9px] font-mono tracking-[0.1em] text-background/60 uppercase">
									FLAC · ACTIVE
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 shrink-0 text-background/60 hover:text-destructive hover:bg-background/10"
								onClick={handleLogout}
							>
								<LogOut className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				) : (
					<div className="shrink-0 border-t-[2px] border-background/30 px-[18px] py-3.5">
						<Link href="/login" className="no-underline">
							<button className="w-full border-[2px] border-background bg-transparent px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-background hover:bg-background hover:text-foreground transition-colors">
								Sign in
							</button>
						</Link>
					</div>
				)}
			</aside>

			{/* ─── Main Area ─── */}
			<div className="flex flex-1 flex-col min-w-0 md:pl-60">
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

						{/* Breadcrumb (desktop) */}
						<div className="hidden md:flex flex-1 min-w-0 items-center">
							<Suspense>
								<Breadcrumb />
							</Suspense>
						</div>

						{/* Spacer (mobile only) */}
						<div className="flex-1 md:hidden" />

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

				{/* ─── Main Content ─── */}
				<div className="flex flex-1 overflow-hidden min-w-0">
					<ScrollArea className="flex-1 min-w-0">
						<main className="mx-auto w-full max-w-6xl px-3 pt-6 pb-24 sm:px-6 lg:px-8 min-w-0">
							{children}
						</main>
					</ScrollArea>
				</div>
			</div>

			{/* ─── Mobile Navigation Sheet ─── */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent side="left" className="w-[280px] p-0 bg-foreground text-background border-r-[3px] border-foreground">
					<SheetHeader className="border-b-[2px] border-background/30 px-[18px] py-4">
						<SheetTitle className="flex items-center gap-2.5 text-xl font-black tracking-[-0.03em] text-background">
							<div className="h-6 w-6 border-[2px] border-background bg-primary shrink-0" />
							DEEMIX
						</SheetTitle>
						<SheetDescription className="text-[10px] font-mono text-background/60 uppercase tracking-[0.14em] font-bold">
							NAVIGATION
						</SheetDescription>
					</SheetHeader>
					<Navigation onNavigate={() => setSidebarOpen(false)} />
				</SheetContent>
			</Sheet>

			{/* ─── Audio ─── */}
			<AudioPreview />
			<MiniPlayer />
			<AudioEngineErrorBoundary>
				<AudioEngine />
			</AudioEngineErrorBoundary>
			<Player />
			<LyricsPanel />
			<LyricsImmersive />
			<FullscreenPlayer />
			<QueuePanel />
			<TrackAnnouncer />
			<TrackActionSheet />
			<Toaster />
		</div>
		</MotionConfig>
	);
}
