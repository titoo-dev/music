"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BRAND_SEED, seedFromPixels, sizedCover, type CoverSeed } from "@/lib/cover-palette";

const cache = new Map<string, CoverSeed>();
const pending = new Map<string, Promise<CoverSeed>>();

function loadSeed(src: string): Promise<CoverSeed> {
	const hit = cache.get(src);
	if (hit) return Promise.resolve(hit);
	let p = pending.get(src);
	if (!p) {
		p = new Promise<CoverSeed>((resolve) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.decoding = "async";
			img.onload = () => {
				try {
					const side = 24;
					const canvas = document.createElement("canvas");
					canvas.width = side;
					canvas.height = side;
					const ctx = canvas.getContext("2d", { willReadFrequently: true });
					if (!ctx) return resolve(BRAND_SEED);
					ctx.drawImage(img, 0, 0, side, side);
					resolve(seedFromPixels(ctx.getImageData(0, 0, side, side).data));
				} catch {
					// Tainted canvas (no CORS) — keep the brand palette.
					resolve(BRAND_SEED);
				}
			};
			img.onerror = () => resolve(BRAND_SEED);
			img.src = sizedCover(src, 64);
		}).then((seed) => {
			cache.set(src, seed);
			pending.delete(src);
			return seed;
		});
		pending.set(src, p);
	}
	return p;
}

/** The artwork's seed colour (brand seed until it is known). */
export function useCoverSeed(src: string | null | undefined): CoverSeed {
	const [loaded, setLoaded] = useState<{ src: string; seed: CoverSeed } | null>(null);
	useEffect(() => {
		if (!src || cache.has(src)) return;
		let live = true;
		loadSeed(src).then((seed) => live && setLoaded({ src, seed }));
		return () => {
			live = false;
		};
	}, [src]);
	if (!src) return BRAND_SEED;
	return cache.get(src) ?? (loaded?.src === src ? loaded.seed : BRAND_SEED);
}

/** CSS variables that drive `.cover-theme`. */
export function coverThemeStyle(seed: CoverSeed): CSSProperties {
	return { ["--cv-h" as string]: seed.hue, ["--cv-c" as string]: seed.chroma };
}

/**
 * Re-themes its subtree with the palette of [src], gliding between palettes
 * as the artwork changes (the Flutter `CoverTheme`).
 */
export function CoverTheme({
	src,
	children,
	className,
	style,
}: {
	src: string | null | undefined;
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	const seed = useCoverSeed(src);
	return (
		<div className={cn("cover-theme", className)} style={{ ...coverThemeStyle(seed), ...style }}>
			{children}
		</div>
	);
}
