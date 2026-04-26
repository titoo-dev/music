"use client";

import { useErrorStore } from "@/stores/useErrorStore";
import { Button } from "@/components/ui/button";

export default function ErrorsPage() {
	const { errors, downloadInfo, clearErrors } = useErrorStore();

	return (
		<div className="max-w-3xl mx-auto">
			{/* Page header */}
			<div className="mb-7">
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					ERROR LOG · DOWNLOADS
				</p>
				<div className="flex items-end gap-5 justify-between flex-wrap">
					<div className="min-w-0 flex-1">
						<h1 className="text-brutal-xl m-0">
							ERRORS<span className="text-primary">.</span>
						</h1>
						<p className="mt-2 text-sm font-bold text-muted-foreground uppercase tracking-[0.05em]">
							{errors.length === 0
								? "Nothing failed. All clean."
								: `${errors.length} failed transaction${errors.length !== 1 ? "s" : ""} on record`}
						</p>
					</div>
					{errors.length > 0 && (
						<Button variant="destructive" size="sm" onClick={clearErrors} className="font-mono uppercase tracking-[0.1em]">
							Clear all
						</Button>
					)}
				</div>
			</div>

			{/* Source download */}
			{downloadInfo && (
				<div className="mb-6 border-[2px] sm:border-[3px] border-foreground bg-card p-4 shadow-[var(--shadow-brutal-sm)]">
					<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
						SOURCE
					</p>
					<p className="text-sm font-bold text-foreground truncate">{downloadInfo.title}</p>
					<p className="text-[11px] text-muted-foreground font-mono mt-0.5">
						{downloadInfo.artist} · {downloadInfo.size} TRACKS
					</p>
				</div>
			)}

			{/* List */}
			{errors.length === 0 ? (
				<div className="border-[2px] sm:border-[3px] border-foreground bg-card flex flex-col items-center justify-center py-20 px-6 gap-2 shadow-[var(--shadow-brutal)]">
					<div className="text-3xl mb-2 font-black tracking-[0.2em]">∅</div>
					<p className="text-sm font-black text-foreground uppercase tracking-[0.14em]">
						NO ERRORS
					</p>
					<p className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
						All downloads completed cleanly.
					</p>
				</div>
			) : (
				<div className="border-[2px] sm:border-[3px] border-foreground bg-card divide-y-[2px] divide-foreground shadow-[var(--shadow-brutal)]">
					{/* Header row */}
					<div className="grid grid-cols-[28px_1fr_auto] gap-3 px-4 py-2 bg-foreground text-background">
						<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em]">#</span>
						<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em]">MESSAGE / DATA</span>
						<span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em]">CODE</span>
					</div>
					{errors.map((error, idx) => (
						<div
							key={idx}
							className="grid grid-cols-[28px_1fr_auto] gap-3 items-start px-4 py-3 hover:bg-destructive/5 transition-colors"
						>
							<span className="text-[11px] font-mono font-bold tabular-nums text-destructive mt-0.5">
								{String(idx + 1).padStart(2, "0")}
							</span>
							<div className="min-w-0">
								<p className="text-[13px] font-bold text-foreground leading-snug">
									{error.message}
								</p>
								{error.data && (
									<p className="text-[11px] text-muted-foreground font-mono mt-1 truncate">
										{error.data.artist} · {error.data.title} · ID {error.data.id}
									</p>
								)}
							</div>
							{error.errid ? (
								<span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] border-[2px] border-foreground bg-destructive text-white px-2 py-1 shrink-0">
									{error.errid}
								</span>
							) : (
								<span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground shrink-0 mt-1">
									—
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
