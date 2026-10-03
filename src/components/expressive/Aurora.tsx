import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Palette {
	base: string;
	lights: [string, string, string];
}

/** Brand night palette for hero banners (white content stays legible on it). */
export const HERO_NIGHT: Palette = { base: "#1a1440", lights: ["#38bdf8", "#818cf8", "#f472b6"] };

/** Time-of-day aurora palettes (same as the Flutter home hero). */
export function paletteNow(date = new Date()): Palette {
	const h = date.getHours();
	if (h < 5) return { base: "#0b0b1a", lights: ["#6366f1", "#a855f7", "#0ea5e9"] };
	if (h < 12) return { base: "#0c4a6e", lights: ["#38bdf8", "#fbbf24", "#f472b6"] };
	if (h < 18) return { base: "#1e1b4b", lights: ["#38bdf8", "#818cf8", "#22d3ee"] };
	return { base: "#2e1065", lights: ["#818cf8", "#f472b6", "#fb923c"] };
}

const BLOBS = [
	{ anim: "aurora-a 19s ease-in-out infinite", pos: "-left-[20%] -top-[30%]" },
	{ anim: "aurora-b 23s ease-in-out infinite", pos: "-right-[25%] top-[0%]" },
	{ anim: "aurora-c 29s ease-in-out infinite", pos: "-bottom-[40%] left-[15%]" },
];

/**
 * Slowly drifting light blobs over a deep base colour: the living backdrop of
 * hero cards. Pure CSS (compositor-only transforms); holds still with reduced
 * motion.
 */
export function Aurora({ palette = HERO_NIGHT, className, children }: { palette?: Palette; className?: string; children?: ReactNode }) {
	return (
		<div aria-hidden={!children} className={cn("absolute inset-0 overflow-hidden", className)} style={{ backgroundColor: palette.base }}>
			{BLOBS.map((b, i) => (
				<div
					key={i}
					className={cn("motion-drift absolute aspect-square w-[110%] rounded-full will-change-transform", b.pos)}
					style={
						{
							animation: b.anim,
							background: `radial-gradient(closest-side, color-mix(in srgb, ${palette.lights[i]} 75%, transparent), transparent)`,
						} as CSSProperties
					}
				/>
			))}
			{children}
		</div>
	);
}
