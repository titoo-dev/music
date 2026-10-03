"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HardDrive, Trash2 } from "lucide-react";
import { getCacheStats, clearCache, setCacheLimit, getCacheLimit } from "@/lib/audio-cache";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/motion/icons";
import { DUR, EASE, SlidingSegments } from "@/components/expressive";

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const CACHE_LIMITS = [
	{ label: "250 MB", bytes: 250 * 1024 * 1024 },
	{ label: "500 MB", bytes: 500 * 1024 * 1024 },
	{ label: "1 GB", bytes: 1024 * 1024 * 1024 },
	{ label: "2 GB", bytes: 2 * 1024 * 1024 * 1024 },
];

/** Saved limit from localStorage (applied to the cache), else the current one. */
function restoreLimit(): number {
	try {
		const saved = typeof window === "undefined" ? null : localStorage.getItem("wavelet-cache-limit");
		const bytes = saved ? parseInt(saved, 10) : NaN;
		if (!isNaN(bytes) && bytes > 0) {
			setCacheLimit(bytes);
			return bytes;
		}
	} catch {}
	return getCacheLimit();
}

/**
 * Local audio cache as an M3 settings tile: usage meter, size limit segments
 * and a tonal "Clear". Renders as a single tile root so it slots straight
 * into a settings section.
 */
export function AudioCacheManager({ className }: { className?: string }) {
	const [stats, setStats] = useState<{
		trackCount: number;
		totalBytes: number;
		maxBytes: number;
	} | null>(null);
	const [clearing, setClearing] = useState(false);
	// Restores the saved limit on first render (client-only tile).
	const [currentLimit, setCurrentLimit] = useState(restoreLimit);

	const refreshStats = useCallback(async () => {
		const s = await getCacheStats();
		setStats({ trackCount: s.trackCount, totalBytes: s.totalBytes, maxBytes: s.maxBytes });
	}, []);

	useEffect(() => {
		let live = true;
		getCacheStats().then((s) => {
			if (live) setStats({ trackCount: s.trackCount, totalBytes: s.totalBytes, maxBytes: s.maxBytes });
		});
		return () => {
			live = false;
		};
	}, []);

	const handleClear = async () => {
		setClearing(true);
		await clearCache();
		await refreshStats();
		setClearing(false);
	};

	const handleLimitChange = (bytes: number) => {
		setCacheLimit(bytes);
		setCurrentLimit(bytes);
		// Persist to localStorage
		try {
			localStorage.setItem("wavelet-cache-limit", String(bytes));
		} catch {}
	};

	const usagePercent = stats ? Math.min(100, (stats.totalBytes / currentLimit) * 100) : 0;
	const summary = stats
		? `${formatBytes(stats.totalBytes)} of ${formatBytes(currentLimit)} · ${stats.trackCount} track${stats.trackCount !== 1 ? "s" : ""}`
		: "Calculating…";

	return (
		<div className={cn("px-4 pb-4 pt-3.5", className)}>
			<div className="flex items-center gap-4">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
					<HardDrive className="size-[22px]" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-base font-semibold leading-snug text-foreground">Audio cache</p>
					<AnimatePresence mode="popLayout" initial={false}>
						<motion.p
							key={summary}
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: DUR.short }}
							className="mt-0.5 truncate text-sm tabular-nums leading-snug text-muted-foreground"
						>
							{summary}
						</motion.p>
					</AnimatePresence>
				</div>
				<motion.button
					type="button"
					whileTap={{ scale: 0.94 }}
					onClick={handleClear}
					disabled={!stats || clearing || stats.trackCount === 0}
					className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
				>
					{clearing ? <Spinner size={14} /> : <Trash2 className="size-4" />}
					Clear
				</motion.button>
			</div>

			{/* Usage meter */}
			<div
				role="progressbar"
				aria-label="Audio cache usage"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(usagePercent)}
				className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-highest"
			>
				<motion.div
					className="h-full rounded-full bg-primary"
					initial={false}
					animate={{ width: `${Math.max(usagePercent, stats && stats.totalBytes > 0 ? 1.5 : 0)}%` }}
					transition={{ duration: DUR.long, ease: EASE.emphasized }}
				/>
			</div>

			{/* Cache limit */}
			<p className="type-eyebrow mb-2 mt-5 text-muted-foreground">Max cache size</p>
			<SlidingSegments
				id="cache-limit"
				size="sm"
				value={String(currentLimit)}
				onChange={(v) => handleLimitChange(Number(v))}
				items={CACHE_LIMITS.map((o) => ({ value: String(o.bytes), label: o.label }))}
			/>

			<p className="mt-3 text-xs leading-relaxed text-muted-foreground">
				Cached tracks play instantly without network requests. Tracks are cached as you listen and when you browse playlists.
			</p>
		</div>
	);
}
