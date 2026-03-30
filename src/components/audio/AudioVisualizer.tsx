"use client";

import { useEffect, useRef } from "react";
import { getAnalyser } from "@/utils/audio-context";

interface Props {
	/** Number of frequency bars to draw. */
	barCount?: number;
	className?: string;
}

/**
 * Draws a real-time frequency bar graph using the shared Web Audio AnalyserNode.
 * Shows nothing when the AnalyserNode isn't connected yet (before first play).
 *
 * The canvas inherits `color` from Tailwind classes on the element, so you can
 * set `text-foreground` / `text-muted-foreground` to control bar colour.
 */
export function AudioVisualizer({ barCount = 40, className = "" }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx2d = canvas.getContext("2d");
		if (!ctx2d) return;

		// Read CSS `color` from the canvas element for bar colour.
		// Re-read on every resize in case the theme changes.
		let fgColor = getComputedStyle(canvas).color;

		let rafId = 0;
		let active = true;

		function draw() {
			if (!active) return;
			rafId = requestAnimationFrame(draw);

			const analyser = getAnalyser();
			const w = canvas!.offsetWidth;
			const h = canvas!.offsetHeight;
			if (w === 0 || h === 0) return;

			// Keep canvas resolution in sync with its CSS size
			if (canvas!.width !== w || canvas!.height !== h) {
				canvas!.width = w;
				canvas!.height = h;
				fgColor = getComputedStyle(canvas!).color;
			}

			ctx2d!.clearRect(0, 0, w, h);
			if (!analyser) return;

			const freq = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(freq);

			const gap = 1;
			const barW = Math.max(1, Math.floor((w - (barCount - 1) * gap) / barCount));
			const step = Math.floor(freq.length / barCount);

			// Build rgba string from the computed rgb() colour
			const base = fgColor.startsWith("rgb(")
				? fgColor.replace("rgb(", "rgba(").replace(")", "")
				: "rgba(128,128,128";

			for (let i = 0; i < barCount; i++) {
				const v = freq[i * step] / 255;
				if (v < 0.02) continue;
				const bh = Math.max(1, v * h);
				const alpha = 0.3 + v * 0.55; // 0.3 – 0.85
				ctx2d!.fillStyle = `${base}, ${alpha})`;
				ctx2d!.fillRect(i * (barW + gap), h - bh, barW, bh);
			}
		}

		draw();
		return () => {
			active = false;
			cancelAnimationFrame(rafId);
		};
	}, [barCount]);

	return <canvas ref={canvasRef} className={`block w-full ${className}`} />;
}
