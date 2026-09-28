"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { getAnalyser } from "@/utils/audio-context";
import { mirroredBars } from "@/lib/spectrum";

interface Props {
	/** Number of frequency bars to draw. */
	barCount?: number;
	className?: string;
}

/**
 * Real-time, mirrored spectrum from the shared Web Audio AnalyserNode: bass in
 * the middle, highs fanning out to both sides, bars growing up *and* down from
 * a centre line. Silent / not-yet-connected audio rests as a row of dots.
 *
 * The canvas inherits `color` from Tailwind classes on the element, so you can
 * set `text-foreground` / `text-muted-foreground` to control bar colour.
 */
export function AudioVisualizer({ barCount = 40, className = "" }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx2d = canvas.getContext("2d");
		if (!ctx2d) return;

		let fgColor = getComputedStyle(canvas).color;
		const heights = new Float32Array(barCount);
		let freq: Uint8Array<ArrayBuffer> | null = null;
		let rafId = 0;
		let active = true;

		function draw() {
			if (!active) return;
			if (!reducedMotion) rafId = requestAnimationFrame(draw);

			const dpr = window.devicePixelRatio || 1;
			const w = canvas!.offsetWidth;
			const h = canvas!.offsetHeight;
			if (w === 0 || h === 0) return;

			// Keep canvas resolution in sync with its CSS size (crisp on HiDPI).
			if (canvas!.width !== Math.round(w * dpr) || canvas!.height !== Math.round(h * dpr)) {
				canvas!.width = Math.round(w * dpr);
				canvas!.height = Math.round(h * dpr);
				fgColor = getComputedStyle(canvas!).color;
			}
			ctx2d!.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx2d!.clearRect(0, 0, w, h);

			const analyser = reducedMotion ? null : getAnalyser();
			let target: number[] = [];
			if (analyser) {
				if (!freq || freq.length !== analyser.frequencyBinCount) freq = new Uint8Array(analyser.frequencyBinCount);
				analyser.getByteFrequencyData(freq);
				target = mirroredBars(freq, barCount);
			}

			const gap = Math.max(2, Math.round(w / barCount / 3));
			const barW = Math.max(2, (w - (barCount - 1) * gap) / barCount);
			const mid = h / 2;
			const base = fgColor.startsWith("rgb(") ? fgColor.replace("rgb(", "rgba(").replace(")", "") : "rgba(128,128,128";

			for (let i = 0; i < barCount; i++) {
				// Rise fast, fall slow — keeps the motion fluid instead of jittery.
				const t = target[i] ?? 0;
				heights[i] += (t - heights[i]) * (t > heights[i] ? 0.5 : 0.12);
				const v = heights[i];
				const bh = Math.max(barW, v * h);
				ctx2d!.fillStyle = `${base}, ${0.3 + v * 0.6})`;
				const x = i * (barW + gap);
				ctx2d!.beginPath();
				if (typeof ctx2d!.roundRect === "function") {
					ctx2d!.roundRect(x, mid - bh / 2, barW, bh, barW / 2);
				} else {
					ctx2d!.rect(x, mid - bh / 2, barW, bh);
				}
				ctx2d!.fill();
			}
		}

		draw();
		return () => {
			active = false;
			cancelAnimationFrame(rafId);
		};
	}, [barCount, reducedMotion]);

	return <canvas ref={canvasRef} className={`block w-full ${className}`} aria-hidden />;
}
