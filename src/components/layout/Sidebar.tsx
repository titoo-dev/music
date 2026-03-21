"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { useLoginStore } from "@/stores/useLoginStore";

const navItems = [
	{ path: "/", label: "Home", icon: "🏠" },
	{ path: "/search", label: "Search", icon: "🔍" },
	{ path: "/charts", label: "Charts", icon: "📊" },
	{ path: "/favorites", label: "Favorites", icon: "❤️" },
	{ path: "/link-analyzer", label: "Link Analyzer", icon: "🔗" },
];

const bottomItems = [
	{ path: "/settings", label: "Settings", icon: "⚙️" },
	{ path: "/about", label: "About", icon: "ℹ️" },
];

export function Sidebar() {
	const pathname = usePathname();
	const slimSidebar = useAppStore((s) => s.slimSidebar);
	const toggleSlimSidebar = useAppStore((s) => s.toggleSlimSidebar);
	const user = useLoginStore((s) => s.user);
	const loggedIn = useLoginStore((s) => s.loggedIn);

	return (
		<aside
			className="fixed left-0 top-0 h-full flex flex-col transition-all z-20"
			style={{
				width: slimSidebar ? "var(--sidebar-slim-width)" : "var(--sidebar-width)",
				background: "var(--bg-secondary)",
				borderRight: "1px solid var(--border)",
			}}
		>
			{/* Logo */}
			<div className="p-4 flex items-center gap-3">
				<div
					className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
					style={{ background: "var(--primary)" }}
				>
					d
				</div>
				{!slimSidebar && <span className="text-lg font-semibold">deemix</span>}
			</div>

			{/* User info */}
			{loggedIn && user && (
				<div className="px-4 py-2 flex items-center gap-3">
					{user.picture ? (
						<img
							src={`https://e-cdns-images.dzcdn.net/images/user/${user.picture}/56x56-000000-80-0-0.jpg`}
							alt=""
							className="w-8 h-8 rounded-full"
						/>
					) : (
						<div
							className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
							style={{ background: "var(--bg-tertiary)" }}
						>
							👤
						</div>
					)}
					{!slimSidebar && (
						<span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
							{user.name || "User"}
						</span>
					)}
				</div>
			)}

			{/* Navigation */}
			<nav className="flex-1 mt-4">
				{navItems.map((item) => (
					<Link
						key={item.path}
						href={item.path}
						className="flex items-center gap-3 px-4 py-3 transition-colors no-underline"
						style={{
							background: pathname === item.path ? "var(--bg-tertiary)" : "transparent",
							color:
								pathname === item.path ? "var(--text-primary)" : "var(--text-secondary)",
						}}
					>
						<span className="text-lg">{item.icon}</span>
						{!slimSidebar && <span className="text-sm">{item.label}</span>}
					</Link>
				))}
			</nav>

			{/* Bottom nav */}
			<div className="border-t" style={{ borderColor: "var(--border)" }}>
				{bottomItems.map((item) => (
					<Link
						key={item.path}
						href={item.path}
						className="flex items-center gap-3 px-4 py-3 transition-colors no-underline"
						style={{
							background: pathname === item.path ? "var(--bg-tertiary)" : "transparent",
							color:
								pathname === item.path ? "var(--text-primary)" : "var(--text-secondary)",
						}}
					>
						<span className="text-lg">{item.icon}</span>
						{!slimSidebar && <span className="text-sm">{item.label}</span>}
					</Link>
				))}
				<button
					onClick={toggleSlimSidebar}
					className="flex items-center gap-3 px-4 py-3 w-full transition-colors cursor-pointer"
					style={{ color: "var(--text-muted)" }}
				>
					<span className="text-lg">{slimSidebar ? "▶" : "◀"}</span>
					{!slimSidebar && <span className="text-sm">Collapse</span>}
				</button>
			</div>
		</aside>
	);
}
