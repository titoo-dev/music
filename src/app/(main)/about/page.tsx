"use client";

import { useAppStore } from "@/stores/useAppStore";

export default function AboutPage() {
	const { currentVersion, latestVersion, updateAvailable } = useAppStore();

	return (
		<div className="max-w-2xl mx-auto">
			{/* Page header */}
			<div className="mb-10">
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					ABOUT · DEEMIX
				</p>
				<div className="flex items-end gap-5 flex-wrap">
					<div className="flex h-16 w-16 items-center justify-center border-[3px] border-foreground bg-primary text-2xl font-black text-white shadow-[var(--shadow-brutal)] shrink-0">
						D
					</div>
					<div className="min-w-0 flex-1">
						<h1 className="text-brutal-xl m-0">
							DEEMIX <span className="text-primary">NEXT.</span>
						</h1>
						<p className="mt-2 text-sm font-bold text-muted-foreground uppercase tracking-[0.05em]">
							Self-hosted music downloader · Web edition
						</p>
					</div>
				</div>
			</div>

			{/* Version */}
			<section className="mb-9">
				<div className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] pb-2 border-b-[2px] border-foreground">
					VERSION
				</div>
				<div className="border-l-[2px] border-r-[2px] border-b-[2px] border-foreground bg-card divide-y-[1px] divide-foreground/15">
					{currentVersion && (
						<div className="flex items-center justify-between gap-5 px-4 py-3.5">
							<div className="flex-1 min-w-0">
								<p className="text-[13px] font-bold tracking-[0.02em]">CURRENT BUILD</p>
								<p className="text-[11px] text-muted-foreground font-medium mt-0.5">Currently installed version of deemix-next.</p>
							</div>
							<span className="text-sm font-mono font-bold tabular-nums">{currentVersion}</span>
						</div>
					)}
					{latestVersion && (
						<div className="flex items-center justify-between gap-5 px-4 py-3.5">
							<div className="flex-1 min-w-0">
								<p className="text-[13px] font-bold tracking-[0.02em]">LATEST RELEASE</p>
								<p className="text-[11px] text-muted-foreground font-medium mt-0.5">Most recent published version on the registry.</p>
							</div>
							<span className="text-sm font-mono font-bold tabular-nums">{latestVersion}</span>
						</div>
					)}
					{updateAvailable && (
						<div className="flex items-center justify-between gap-5 px-4 py-3.5 bg-destructive/10">
							<div className="flex-1 min-w-0">
								<p className="text-[13px] font-bold tracking-[0.02em] text-destructive">UPDATE AVAILABLE</p>
								<p className="text-[11px] text-muted-foreground font-medium mt-0.5">A newer build is published. Pull to refresh.</p>
							</div>
							<span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] border-[2px] border-destructive bg-destructive text-white px-2 py-1">NEW</span>
						</div>
					)}
				</div>
			</section>

			{/* Receipt-style credits */}
			<div className="border-[2px] sm:border-[3px] border-foreground bg-[#fffdf6] shadow-[var(--shadow-brutal)] px-6 py-5 font-mono">
				<div className="text-center border-b-[2px] border-dashed border-foreground pb-3 mb-3">
					<div className="font-black text-base tracking-[0.2em]">DEEMIX</div>
					<div className="text-[10px] mt-0.5">── ABOUT / CREDITS ──</div>
				</div>
				<div className="text-[11px] leading-relaxed text-foreground space-y-1">
					<div className="flex justify-between"><span>RUNTIME</span><span className="font-bold">NEXT.JS 16</span></div>
					<div className="flex justify-between"><span>DATABASE</span><span className="font-bold">POSTGRES · PRISMA 7</span></div>
					<div className="flex justify-between"><span>UI</span><span className="font-bold">REACT 19 · TAILWIND 4</span></div>
					<div className="flex justify-between"><span>FORK OF</span><span className="font-bold">BAMBANAH/DEEMIX</span></div>
				</div>
				<div className="text-center border-t-[2px] border-dashed border-foreground pt-3 mt-4 text-[10px] text-muted-foreground">
					ORIGINAL PROJECT BY{" "}
					<a
						href="https://github.com/bambanah/deemix"
						target="_blank"
						rel="noreferrer"
						className="font-black text-foreground underline underline-offset-2"
					>
						BAMBANAH
					</a>
					<br />
					*** THANK YOU ***
				</div>
			</div>
		</div>
	);
}
