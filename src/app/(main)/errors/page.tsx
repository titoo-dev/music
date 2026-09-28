"use client";

import { motion } from "motion/react";
import { useErrorStore } from "@/stores/useErrorStore";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/motion/icons";

export default function ErrorsPage() {
	const { errors, downloadInfo, clearErrors } = useErrorStore();

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			className="max-w-3xl mx-auto pt-2"
		>
			{/* Page header */}
			<div className="mb-8 flex items-end gap-5 justify-between flex-wrap">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight m-0">Errors</h1>
					<p className="mt-1 text-sm text-muted-foreground tabular-nums">
						{errors.length === 0
							? "Nothing failed. All clean."
							: `${errors.length} failed download${errors.length !== 1 ? "s" : ""} on record`}
					</p>
				</div>
				{errors.length > 0 && (
					<Button variant="destructive" size="sm" onClick={clearErrors} className="min-h-11 sm:min-h-8">
						Clear all
					</Button>
				)}
			</div>

			{/* Source download */}
			{downloadInfo && (
				<div className="mb-6 rounded-xl border border-border bg-card p-4">
					<p className="text-xs text-muted-foreground mb-1">Source</p>
					<p className="text-sm font-medium text-foreground truncate">{downloadInfo.title}</p>
					<p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
						{downloadInfo.artist} · {downloadInfo.size} tracks
					</p>
				</div>
			)}

			{/* List */}
			{errors.length === 0 ? (
				<EmptyState title="No errors" description="All downloads completed cleanly." />
			) : (
				<div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
					{errors.map((error, idx) => (
						<div
							key={idx}
							className="grid grid-cols-[28px_1fr_auto] gap-3 items-start px-4 py-3 hover:bg-accent/40 transition-colors"
						>
							<span className="text-xs font-mono tabular-nums text-muted-foreground mt-0.5">
								{String(idx + 1).padStart(2, "0")}
							</span>
							<div className="min-w-0">
								<p className="text-sm font-medium text-foreground leading-snug">
									{error.message}
								</p>
								{error.data && (
									<p className="text-xs text-muted-foreground mt-1 truncate">
										{error.data.artist} · {error.data.title} · <span className="font-mono">ID {error.data.id}</span>
									</p>
								)}
							</div>
							{error.errid ? (
								<span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-mono text-[11px] text-destructive shrink-0">
									{error.errid}
								</span>
							) : (
								<span className="text-xs text-muted-foreground shrink-0 mt-0.5">—</span>
							)}
						</div>
					))}
				</div>
			)}
		</motion.div>
	);
}
