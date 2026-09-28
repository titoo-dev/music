"use client";

import { useEffect } from "react";
import { animate, useMotionValue, useReducedMotion, type MotionValue } from "motion/react";
import { getAnalyser } from "@/utils/audio-context";
import { levelFromFrequencies } from "@/lib/spectrum";

/**
 * Live bass energy (0..1) from the shared AnalyserNode, as a MotionValue so
 * consumers can bind it to transforms without re-rendering React every frame.
 * Settles to 0 when `active` is false or the user prefers reduced motion.
 */
export function useAudioLevel(active: boolean): MotionValue<number> {
	const level = useMotionValue(0);
	const reduced = useReducedMotion();

	useEffect(() => {
		if (!active || reduced) {
			const ctl = animate(level, 0, { duration: 0.6, ease: "easeOut" });
			return () => ctl.stop();
		}
		let raf = 0;
		let buf: Uint8Array<ArrayBuffer> | null = null;
		const tick = () => {
			raf = requestAnimationFrame(tick);
			const analyser = getAnalyser();
			if (!analyser) return;
			if (!buf || buf.length !== analyser.frequencyBinCount) buf = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(buf);
			const target = levelFromFrequencies(buf, 6);
			// Fast attack, slow release — reads as a "breath" rather than flicker.
			const prev = level.get();
			level.set(prev + (target - prev) * (target > prev ? 0.35 : 0.08));
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [active, reduced, level]);

	return level;
}
