"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArtworkWall } from "./ArtworkWall";

/**
 * Edge-to-edge page hero (Library, Playlists): it slides up under the glass
 * header, a drifting wall of [covers] veiled by the surface behind it, an
 * indigo light leak, and a fade into the page. Copy stays on the theme colours.
 */
export function PageHero({ covers, children, className }: { covers: string[]; children: ReactNode; className?: string }) {
	return (
		<div className="relative mx-[calc(50%-50vw)] -mt-[calc(var(--header-h)+24px)] px-[calc(50vw-50%)] pt-[calc(var(--header-h)+24px)] sm:-mt-[calc(var(--header-h)+32px)] sm:pt-[calc(var(--header-h)+32px)]">
			<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
				<AnimatePresence>
					{covers.length > 0 && (
						<motion.div key="wall" data-testid="page-hero-wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }} className="absolute inset-0">
							<ArtworkWall urls={covers} columns={7} tilt={-14} period={90} />
							{/* A surface veil, not an opacity layer: the wall keeps compositing cheaply. */}
							<div className="absolute inset-0 bg-background/[0.62] dark:bg-background/50" />
						</motion.div>
					)}
				</AnimatePresence>
				<div className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_80%_at_0%_0%,color-mix(in_srgb,var(--brand-indigo)_22%,transparent),transparent_70%)]" />
				<div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--background)_10%,transparent),color-mix(in_srgb,var(--background)_65%,transparent)_55%,var(--background)_92%)]" />
			</div>
			<div className={cn("relative flex min-h-[220px] flex-col gap-5 pb-6 pt-10 sm:min-h-[280px]", className)}>{children}</div>
		</div>
	);
}
