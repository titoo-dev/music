"use client";

import { useEffect, useRef, useCallback, memo } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore, type LyricLine } from "@/stores/useLyricsStore";
import { Spinner } from "@/components/motion/icons";

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

		activeIndexRef.current = -1;
		for (const el of container.children) {
			(el as HTMLElement).dataset.state = "future";
		}

		const unsubscribe = usePlayerStore.subscribe((state) => {
			const idx = getActiveIndex(lines, state.currentTime);
			if (idx === activeIndexRef.current) return;
			activeIndexRef.current = idx;

			for (let i = 0; i < container.children.length; i++) {
				const el = container.children[i] as HTMLElement;
				const state = i === idx ? "active" : i < idx ? "past" : "future";
				el.dataset.state = state;
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
			<div
				ref={containerRef}
				className={`h-full overflow-y-auto overscroll-contain scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_4rem,black_calc(100%-4rem),transparent)] ${
					compact ? "px-6 py-[40%]" : "px-8 py-[40%]"
				}`}
			>
				{lines.map((line, i) => (
					<p
						key={i}
						data-state="future"
						onClick={() => handleClick(line)}
						className={`group relative cursor-pointer leading-[1.35] tracking-tight py-1.5 transition-all duration-300 ease-out
							text-foreground font-semibold opacity-40 hover:opacity-70
							data-[state=past]:opacity-30 data-[state=past]:text-muted-foreground
							data-[state=active]:opacity-100 data-[state=active]:tracking-[-0.02em]
							${compact ? "text-[17px] data-[state=active]:text-[20px]" : "text-[18px] data-[state=active]:text-[22px]"}
							${line.text === "" ? "h-3.5" : ""}
						`}
					>
						{line.text && (
							<span className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-highlight opacity-0 scale-y-50 group-data-[state=active]:opacity-100 group-data-[state=active]:scale-y-100 transition-[opacity,transform] duration-300" />
						)}
						{line.text || " "}
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
			<div
				className={`h-full overflow-y-auto overscroll-contain scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-3rem),transparent)] ${
					compact ? "px-6 py-8" : "px-8 py-8"
				}`}
			>
				<pre
					className="whitespace-pre-wrap font-sans text-base font-medium leading-relaxed text-foreground/80"
				>
					{text}
				</pre>
			</div>
		</div>
	);
});

function MusicOffIcon({ className }: { className?: string }) {
	return (
		<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
			<path d="M9 18V5l12-2v13" />
			<circle cx="6" cy="18" r="3" />
			<circle cx="18" cy="16" r="3" />
			<line x1="2" y1="2" x2="22" y2="22" />
		</svg>
	);
}

function MusicIcon({ className }: { className?: string }) {
	return (
		<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
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

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Spinner size={20} className="text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
				<MusicOffIcon className="text-muted-foreground/40" />
				<p className="text-sm text-muted-foreground text-center">
					{error}
				</p>
			</div>
		);
	}

	if (instrumental) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
				<MusicIcon className="text-muted-foreground/50" />
				<p className="text-sm text-muted-foreground">
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
