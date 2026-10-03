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
		<div className="relative min-h-0 flex-1">
			<div
				ref={containerRef}
				className={`h-full overflow-y-auto overscroll-contain scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] ${
					compact ? "px-6 py-[40%]" : "px-6 py-[38%] min-[840px]:px-2"
				}`}
			>
				{lines.map((line, i) => (
					<p
						key={i}
						data-state="future"
						onClick={() => handleClick(line)}
						className={`cursor-pointer origin-left py-2 font-semibold leading-[1.22] tracking-[-0.02em] text-balance text-foreground transition-[opacity,scale,color] duration-500 ease-[cubic-bezier(0.2,0,0,1)]
							scale-[0.92] opacity-55 hover:opacity-80
							data-[state=past]:opacity-35
							data-[state=active]:scale-100 data-[state=active]:opacity-100
							${compact ? "text-[22px]" : "text-[26px] min-[840px]:text-[34px]"}
							${line.text === "" ? "h-4" : ""}
						`}
					>
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
		<div className="relative min-h-0 flex-1">
			<div
				className={`h-full overflow-y-auto overscroll-contain scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-3rem),transparent)] ${
					compact ? "px-6 py-8" : "px-6 py-10 min-[840px]:px-2"
				}`}
			>
				<pre
					className={`whitespace-pre-wrap font-sans font-semibold leading-relaxed tracking-[-0.01em] text-foreground/85 ${compact ? "text-lg" : "text-xl min-[840px]:text-2xl"}`}
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
			<div className="flex flex-1 items-center justify-center">
				<span className="flex size-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
					<Spinner size={22} />
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
				<span className="bg-tonal-gradient flex size-20 items-center justify-center rounded-full text-on-primary-container shadow-[0_0_32px_2px_color-mix(in_srgb,var(--primary)_22%,transparent)]">
					<MusicOffIcon />
				</span>
				<p className="max-w-60 text-base font-semibold text-foreground/80">{error}</p>
			</div>
		);
	}

	if (instrumental) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
				<span className="bg-tonal-gradient flex size-20 items-center justify-center rounded-full text-on-primary-container shadow-[0_0_32px_2px_color-mix(in_srgb,var(--primary)_22%,transparent)]">
					<MusicIcon />
				</span>
				<p className="text-xl font-semibold tracking-tight">Instrumental</p>
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
