"use client";

import { motion } from "motion/react";
import { useAppStore } from "@/stores/useAppStore";
import { LogoMark } from "@/components/motion/icons";

const STACK: { k: string; v: string }[] = [
	{ k: "Runtime", v: "Next.js 16" },
	{ k: "Database", v: "Postgres · Prisma 7" },
	{ k: "UI", v: "React 19 · Tailwind 4" },
];

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-5 px-4 py-4">
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium">{label}</p>
				<p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
			</div>
			{children}
		</div>
	);
}

export default function AboutPage() {
	const { currentVersion, latestVersion, updateAvailable } = useAppStore();

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			className="max-w-2xl mx-auto pt-2"
		>
			{/* Page header */}
			<div className="mb-10 flex items-center gap-4">
				<LogoMark animated className="size-12 shrink-0" />
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight m-0">wavelet</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Self-hosted music downloader, web edition.
					</p>
				</div>
			</div>

			{/* Version */}
			<section className="mb-10">
				<h2 className="mb-3 text-sm font-medium">Version</h2>
				<div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
					{currentVersion && (
						<Row label="Current build" hint="Currently installed version of wavelet.">
							<span className="text-sm font-mono tabular-nums">{currentVersion}</span>
						</Row>
					)}
					{latestVersion && (
						<Row label="Latest release" hint="Most recent published version on the registry.">
							<span className="text-sm font-mono tabular-nums">{latestVersion}</span>
						</Row>
					)}
					{updateAvailable && (
						<div className="flex items-center justify-between gap-5 px-4 py-4 bg-highlight/5">
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-highlight">Update available</p>
								<p className="text-sm text-muted-foreground mt-0.5">A newer build is published. Pull to refresh.</p>
							</div>
							<span className="rounded-full bg-highlight/10 px-2.5 py-0.5 text-xs font-medium text-highlight">New</span>
						</div>
					)}
				</div>
			</section>

			{/* Credits */}
			<section>
				<h2 className="mb-3 text-sm font-medium">Credits</h2>
				<div className="rounded-xl border border-border bg-card">
					<dl className="divide-y divide-border">
						{STACK.map((s) => (
							<div key={s.k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
								<dt className="text-muted-foreground">{s.k}</dt>
								<dd className="m-0 font-medium">{s.v}</dd>
							</div>
						))}
					</dl>
				</div>
			</section>
		</motion.div>
	);
}
