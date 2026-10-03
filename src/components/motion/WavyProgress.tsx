"use client";

import { useId, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { M3_SPRING } from "@/components/expressive/motion";

/**
 * A closed wavy ring: radius `r` modulated by `waves` sine periods of
 * `amplitude`, starting at 12 o'clock and going clockwise.
 */
export function wavyCirclePath(cx: number, cy: number, r: number, amplitude: number, waves: number, steps = 240): string {
	const pts: string[] = [];
	for (let i = 0; i <= steps; i++) {
		const t = (i / steps) * Math.PI * 2;
		const rr = r + amplitude * Math.sin(waves * t);
		const x = cx + rr * Math.sin(t);
		const y = cy - rr * Math.cos(t);
		pts.push(`${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`);
	}
	return `${pts.join("")}Z`;
}

/** Gap between the indicator and the flat track, as a share of the ring. */
const GAP = 0.025;

/**
 * Material 3 Expressive circular progress: a wavy indicator over a flat track,
 * the wave flowing round while the arc grows. `value` 0…1, or null for
 * indeterminate. The arc grows from 0 on mount. `still` freezes the wave
 * (finished states).
 */
export function WavyProgress({
	value,
	size = 200,
	stroke = 10,
	waves = 11,
	amplitude = 3.5,
	still = false,
	fluid = false,
	className,
	trackClassName = "stroke-surface-highest",
	indicatorClassName = "stroke-primary",
	testId,
	children,
}: {
	value: number | null;
	size?: number;
	stroke?: number;
	waves?: number;
	amplitude?: number;
	still?: boolean;
	/** Let the parent size it (className) instead of `size` px. */
	fluid?: boolean;
	className?: string;
	trackClassName?: string;
	indicatorClassName?: string;
	testId?: string;
	children?: ReactNode;
}) {
	const maskId = `wavy-${useId().replace(/:/g, "")}`;
	const c = size / 2;
	const r = c - stroke / 2 - amplitude - 1;
	const p = value === null ? 0.28 : Math.min(1, Math.max(0, value));
	const full = p >= 1;
	// The track starts past the indicator (plus a gap at each end).
	const trackLen = p <= 0 ? 1 : Math.max(0, 1 - p - 2 * GAP);
	const spin = still ? undefined : { rotate: 360 };

	return (
		<div className={cn("relative", className)} style={fluid ? undefined : { width: size, height: size }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === null ? undefined : Math.round(p * 100)}>
			<svg viewBox={`0 0 ${size} ${size}`} className="size-full overflow-visible">
				<defs>
					<mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
						<motion.g
							style={{ originX: "50%", originY: "50%" }}
							animate={value === null ? { rotate: 360 } : { rotate: 0 }}
							transition={value === null ? { repeat: Infinity, duration: 1.6, ease: "linear" } : M3_SPRING.defaultSpatial}
						>
							<motion.circle
								cx={c}
								cy={c}
								r={r}
								fill="none"
								stroke="white"
								strokeWidth={stroke + amplitude * 2 + 4}
								pathLength={1}
								transform={`rotate(-90 ${c} ${c})`}
								initial={{ strokeDasharray: "0 1" }}
								animate={{ strokeDasharray: full ? "1 0" : `${p} 1` }}
								transition={M3_SPRING.slowEffects}
							/>
						</motion.g>
					</mask>
				</defs>
				{trackLen > 0 && (
					<motion.circle
						cx={c}
						cy={c}
						r={r}
						fill="none"
						strokeWidth={stroke * 0.55}
						strokeLinecap="round"
						pathLength={1}
						transform={`rotate(-90 ${c} ${c})`}
						className={trackClassName}
						initial={{ strokeDasharray: "1 0", strokeDashoffset: 0 }}
						animate={{ strokeDasharray: p <= 0 ? "1 0" : `${trackLen} 1`, strokeDashoffset: p <= 0 ? 0 : -(p + GAP) }}
						transition={M3_SPRING.slowEffects}
					/>
				)}
				<g mask={`url(#${maskId})`} opacity={value !== null && p <= 0 ? 0 : 1} data-testid={testId}>
					<motion.path
						d={wavyCirclePath(c, c, r, amplitude, waves)}
						fill="none"
						strokeWidth={stroke * 0.7}
						strokeLinecap="round"
						strokeLinejoin="round"
						className={indicatorClassName}
						style={{ originX: "50%", originY: "50%" }}
						animate={spin}
						transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
					/>
				</g>
			</svg>
			{children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
		</div>
	);
}
