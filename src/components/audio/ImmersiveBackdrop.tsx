"use client";

import { useId } from "react";
import { motion, AnimatePresence, useReducedMotion, useTransform, type MotionValue } from "motion/react";

// Three blurred crops of the cover drift on long, out-of-phase loops — a
// "mesh gradient" made of the artwork's own colours. Durations are co-prime so
// the composition never visibly repeats.
const BLOBS: { pos: string; className: string; drift: Record<"x" | "y" | "rotate", number[]>; duration: number }[] = [
	{ pos: "20% 20%", className: "-left-[20%] -top-[25%]", drift: { x: [0, 120, -40, 0], y: [0, 60, 140, 0], rotate: [0, 40, -20, 0] }, duration: 23 },
	{ pos: "80% 40%", className: "-right-[25%] top-[5%]", drift: { x: [0, -140, -30, 0], y: [0, 90, -60, 0], rotate: [0, -35, 25, 0] }, duration: 29 },
	{ pos: "50% 90%", className: "-bottom-[35%] left-[10%]", drift: { x: [0, 80, -110, 0], y: [0, -120, -30, 0], rotate: [0, 30, -45, 0] }, duration: 37 },
];

/**
 * Full-bleed ambient background for the fullscreen player. Crossfades per
 * track, breathes with the music (`level`, 0..1) and carries a fine film grain
 * so the large blurs don't band.
 */
export function ImmersiveBackdrop({ cover, level }: { cover: string | null | undefined; level: MotionValue<number> }) {
	const reduced = useReducedMotion();
	const grainId = `grain-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
	const glow = useTransform(level, [0, 1], [0.55, 0.9]);
	const swell = useTransform(level, [0, 1], [1, 1.12]);

	return (
		<div aria-hidden data-testid="immersive-backdrop" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background">
			<AnimatePresence initial={false}>
				{cover && (
					<motion.div
						key={cover}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 1.2, ease: "easeOut" }}
						className="absolute inset-0"
					>
						<motion.div className="absolute inset-0" style={{ opacity: glow, scale: swell }}>
							{BLOBS.map((b, i) => (
								<motion.div
									key={i}
									className={`absolute size-[75vmax] rounded-full bg-cover blur-[90px] saturate-[1.8] will-change-transform ${b.className}`}
									style={{ backgroundImage: `url("${cover}")`, backgroundPosition: b.pos }}
									animate={reduced ? undefined : b.drift}
									transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut" }}
								/>
							))}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Legibility veil — lighter at the top so the colour reads, denser under the controls. */}
			<div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/45 to-background/85" />
			<div className="absolute inset-0 [background:radial-gradient(120%_80%_at_50%_0%,transparent_40%,var(--background)_100%)] opacity-60" />

			{/* Film grain */}
			<svg className="absolute inset-0 size-full opacity-[0.09] mix-blend-overlay">
				<filter id={grainId}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#${grainId})`} />
			</svg>
		</div>
	);
}
