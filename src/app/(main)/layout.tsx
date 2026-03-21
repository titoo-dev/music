"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { SearchBar } from "@/components/layout/SearchBar";
import { DownloadBar } from "@/components/downloads/DownloadBar";
import { useSocket } from "@/hooks/useSocket";
import { useInitApp } from "@/hooks/useInitApp";
import { useAppStore } from "@/stores/useAppStore";

export default function MainLayout({ children }: { children: React.ReactNode }) {
	useSocket();
	useInitApp();

	const slimSidebar = useAppStore((s) => s.slimSidebar);
	const slimDownloads = useAppStore((s) => s.slimDownloads);

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar />
			<div
				className="flex flex-col flex-1 overflow-hidden transition-all"
				style={{
					marginLeft: slimSidebar ? "var(--sidebar-slim-width)" : "var(--sidebar-width)",
				}}
			>
				<SearchBar />
				<main className="flex-1 overflow-y-auto p-6">{children}</main>
			</div>
			<DownloadBar />
		</div>
	);
}
