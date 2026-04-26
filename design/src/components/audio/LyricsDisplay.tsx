"use client";

import { useEffect, useRef, useCallback, memo } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore, type LyricLine } from "@/stores/useLyricsStore";
import { Loader2 } from "lucide-react";

function getActiveIndex(lines: LyricLine[], time: number): number {
	let idx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].time <= time) idx = i;
		else break;
	}
	return idx;
}

const SyncedLyrics = memo(function SyncedLyrics({
	lines,
	compact,
}: {
	lines: LyricLine[];
	compact?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const activeIndexRef = useRef(-1);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Reset all lines to inactive when track/lines change
		activeIndexRef.current = -1;
		for (const el of container.children) {
			(el as HTMLElement).dataset.active = "false";
		}

		// Subscribe to currentTime outside React render cycle for perf
		const unsubscribe = usePlayerStore.subscribe((state) => {
			const idx = getActiveIndex(lines, state.currentTime);
			if (idx === activeIndexRef.current) return;
			activeIndexRef.current = idx;

			for (let i = 0; i < container.children.length; i++) {
				const el = container.children[i] as HTMLElement;
				el.dataset.active = i === idx ? "true" : "false";
				if (i === idx) {
					el.scrollIntoView({ behavior: "smooth", block: "center" });
				}
			}
		});
		return unsubscribe;
	}, [lines]);

	const handleClick = useCallback((line: LyricLine) => {
		usePlayerStore.getState().seek(line.time);
	}, []);

	return (
		<div className="relative flex-1 min-h-0">
			{/* Top fade mask */}
			<div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-background to-transparent" />
			{/* Bottom fade mask */}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-background to-transparent" />
			<div
				ref={containerRef}
				className={`h-full overflow-y-auto overscroll-contain scrollbar-hide ${
					compact ? "px-5 py-8 space-y-3" : "px-8 py-10 space-y-4"
				}`}
			>
				{lines.map((line, i) => (
					<p
						key={i}
						data-active="false"
						onClick={() => handleClick(line)}
						className={`cursor-pointer origin-left transition-all duration-500
							text-muted-foreground/40
							data-[active=true]:text-foreground
							data-[active=true]:scale-105
							${compact ? "text-lg font-bold" : "text-xl font-black tracking-wide"}
							${line.text === "" ? "h-4" : ""}
						`}
					>
						{line.text || "\u00A0"}
					</p>
				))}
			</div>
		</div>
	);
});

const PlainLyrics = memo(function PlainLyrics({
	text,
	compact,
}: {
	text: string;
	compact?: boolean;
}) {
	return (
		<div className="relative flex-1 min-h-0">
			{/* Top fade mask */}
			<div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-background to-transparent" />
			{/* Bottom fade mask */}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-background to-transparent" />
			<div
				className={`h-full overflow-y-auto overscroll-contain scrollbar-hide ${
					compact ? "px-5 py-8" : "px-8 py-8"
				}`}
			>
				<pre
					className={`whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground ${
						compact ? "text-base" : "text-base font-medium"
					}`}
				>
					{text}
				</pre>
			</div>
		</div>
	);
});

function MusicOffIcon({ className }: { className?: string }) {
	return (
		<svg
			width="28"
			height="28"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			className={className}
		>
			<path d="M9 18V5l12-2v13" />
			<circle cx="6" cy="18" r="3" />
			<circle cx="18" cy="16" r="3" />
			<line x1="2" y1="2" x2="22" y2="22" />
		</svg>
	);
}

function MusicIcon({ className }: { className?: string }) {
	return (
		<svg
			width="28"
			height="28"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			className={className}
		>
			<path d="M9 18V5l12-2v13" />
			<circle cx="6" cy="18" r="3" />
			<circle cx="18" cy="16" r="3" />
		</svg>
	);
}

export function LyricsDisplay({ compact = false }: { compact?: boolean }) {
	const isLoading = useLyricsStore((s) => s.isLoading);
	const error = useLyricsStore((s) => s.error);
	const syncedLines = useLyricsStore((s) => s.syncedLines);
	const plainLyrics = useLyricsStore((s) => s.plainLyrics);
	const instrumental = useLyricsStore((s) => s.instrumental);
	const source = useLyricsStore((s) => s.source);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
				<MusicOffIcon className="text-muted-foreground/40" />
				<p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 text-center">
					{error}
				</p>
			</div>
		);
	}

	if (instrumental) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
				<MusicIcon className="text-muted-foreground/50" />
				<p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
					Instrumental
				</p>
			</div>
		);
	}

	if (syncedLines.length > 0) {
		return (
			<div className="flex-1 flex flex-col min-h-0">
				<SyncedLyrics lines={syncedLines} compact={compact} />
				{source && (
					<p className="shrink-0 pb-2 pt-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground/30">
						via {source}
					</p>
				)}
			</div>
		);
	}

	if (plainLyrics) {
		return (
			<div className="flex-1 flex flex-col min-h-0">
				<PlainLyrics text={plainLyrics} compact={compact} />
				{source && (
					<p className="shrink-0 pb-2 pt-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground/30">
						via {source}
					</p>
				)}
			</div>
		);
	}

	return null;
}
