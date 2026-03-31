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
	const activeRef = useRef<HTMLParagraphElement>(null);
	const activeIndexRef = useRef(-1);

	// Subscribe to currentTime outside React render cycle for perf
	useEffect(() => {
		const unsubscribe = usePlayerStore.subscribe((state) => {
			const idx = getActiveIndex(lines, state.currentTime);
			if (idx === activeIndexRef.current) return;
			activeIndexRef.current = idx;

			const container = containerRef.current;
			if (!container) return;

			const children = container.children;
			for (let i = 0; i < children.length; i++) {
				const el = children[i] as HTMLElement;
				if (i === idx) {
					el.classList.add("text-foreground", "scale-[1.02]");
					el.classList.remove("text-muted-foreground/40");
					el.scrollIntoView({ behavior: "smooth", block: "center" });
				} else {
					el.classList.remove("text-foreground", "scale-[1.02]");
					el.classList.add("text-muted-foreground/40");
				}
			}
		});
		return unsubscribe;
	}, [lines]);

	const handleClick = useCallback(
		(line: LyricLine) => {
			usePlayerStore.getState().seek(line.time);
		},
		[]
	);

	return (
		<div
			ref={containerRef}
			className={`flex-1 overflow-y-auto overscroll-contain scrollbar-hide ${
				compact ? "px-4 py-4 space-y-2" : "px-8 py-8 space-y-3"
			}`}
		>
			{lines.map((line, i) => (
				<p
					key={i}
					ref={i === 0 ? activeRef : undefined}
					onClick={() => handleClick(line)}
					className={`cursor-pointer transition-all duration-300 text-muted-foreground/40 ${
						compact
							? "text-base font-bold"
							: "text-lg font-black uppercase tracking-wide"
					} ${line.text === "" ? "h-4" : ""}`}
				>
					{line.text || "\u00A0"}
				</p>
			))}
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
		<div
			className={`flex-1 overflow-y-auto overscroll-contain scrollbar-hide ${
				compact ? "px-4 py-4" : "px-8 py-8"
			}`}
		>
			<pre
				className={`whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground ${
					compact ? "text-sm" : "text-base font-medium"
				}`}
			>
				{text}
			</pre>
		</div>
	);
});

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
			<div className="flex-1 flex items-center justify-center px-8">
				<p className="text-sm text-muted-foreground text-center">{error}</p>
			</div>
		);
	}

	if (instrumental) {
		return (
			<div className="flex-1 flex items-center justify-center px-8">
				<p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
					Instrumental
				</p>
			</div>
		);
	}

	if (syncedLines.length > 0) {
		return <SyncedLyrics lines={syncedLines} compact={compact} />;
	}

	if (plainLyrics) {
		return <PlainLyrics text={plainLyrics} compact={compact} />;
	}

	return null;
}
