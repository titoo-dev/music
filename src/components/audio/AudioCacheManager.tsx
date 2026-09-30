"use client";

import { useEffect, useState, useCallback } from "react";
import { getCacheStats, clearCache, setCacheLimit, getCacheLimit } from "@/lib/audio-cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, HardDrive } from "lucide-react";
import { Spinner } from "@/components/motion/icons";

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

export function AudioCacheManager() {
	const [stats, setStats] = useState<{
		trackCount: number;
		totalBytes: number;
		maxBytes: number;
	} | null>(null);
	const [clearing, setClearing] = useState(false);
	const [currentLimit, setCurrentLimit] = useState(getCacheLimit());

	const refreshStats = useCallback(async () => {
		const s = await getCacheStats();
		setStats({ trackCount: s.trackCount, totalBytes: s.totalBytes, maxBytes: s.maxBytes });
	}, []);

	useEffect(() => {
		refreshStats();
	}, [refreshStats]);

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

	// Restore limit from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem("wavelet-cache-limit");
			if (saved) {
				const bytes = parseInt(saved, 10);
				if (!isNaN(bytes) && bytes > 0) {
					setCacheLimit(bytes);
					setCurrentLimit(bytes);
				}
			}
		} catch {}
	}, []);

	const usagePercent = stats ? Math.min(100, (stats.totalBytes / currentLimit) * 100) : 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<HardDrive className="size-4 text-muted-foreground" />
					Audio Cache
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!stats ? (
					<div className="flex justify-center py-4">
						<Spinner className="text-muted-foreground" />
					</div>
				) : (
					<>
						{/* Usage bar */}
						<div className="space-y-2">
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>{stats.trackCount} track{stats.trackCount !== 1 ? "s" : ""} cached</span>
								<span className="font-mono tabular-nums">{formatBytes(stats.totalBytes)} / {formatBytes(currentLimit)}</span>
							</div>
							<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
								<div
									className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
									style={{ width: `${usagePercent}%` }}
								/>
							</div>
						</div>

						{/* Cache limit selector */}
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Max cache size
							</p>
							<div className="flex gap-1.5 flex-wrap">
								{CACHE_LIMITS.map((opt) => (
									<Button
										key={opt.bytes}
										variant={currentLimit === opt.bytes ? "default" : "outline"}
										size="sm"
										className="font-mono text-xs tabular-nums"
										onClick={() => handleLimitChange(opt.bytes)}
									>
										{opt.label}
									</Button>
								))}
							</div>
						</div>

						{/* Clear button */}
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
							onClick={handleClear}
							disabled={clearing || stats.trackCount === 0}
						>
							{clearing ? (
								<Spinner size={14} />
							) : (
								<Trash2 className="size-3.5" />
							)}
							Clear audio cache
						</Button>

						<p className="text-xs text-muted-foreground">
							Cached tracks play instantly without network requests.
							Tracks are automatically cached as you listen and when you browse playlists.
						</p>
					</>
				)}
			</CardContent>
		</Card>
	);
}
