import { cn } from "@/lib/utils";
import { sizedCover } from "@/lib/cover-palette";

/**
 * Tilted columns of artwork drifting in alternating directions: the living
 * backdrop of hero moments. Each column holds its run twice and slides by
 * exactly one run (CSS keyframes), so it loops seamlessly. Holds still with
 * reduced motion.
 */
export function ArtworkWall({
	urls,
	columns = 5,
	tilt = -11,
	period = 60,
	rows = 10,
	className,
}: {
	urls: string[];
	columns?: number;
	/** Rotation in degrees. */
	tilt?: number;
	/** Seconds for a column to drift through one run. */
	period?: number;
	/** Tiles per run, per column. */
	rows?: number;
	className?: string;
}) {
	if (urls.length === 0) return null;
	return (
		<div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
			<div
				className="absolute left-1/2 top-1/2 flex gap-2.5"
				// A square as wide as the diagonal still covers the box once tilted.
				style={{ width: "150%", height: "260%", transform: `translate(-50%, -50%) rotate(${tilt}deg)` }}
			>
				{Array.from({ length: columns }, (_, col) => {
					const run = Array.from({ length: rows }, (_, k) => urls[(k * columns + col * 3) % urls.length]);
					return (
						<div key={col} className="min-w-0 flex-1 overflow-hidden">
							<div
								className="motion-drift flex flex-col will-change-transform"
								style={{
									animation: `${col % 2 ? "wall-rise" : "wall-fall"} ${period}s linear infinite`,
									animationDelay: `-${(col * 0.37 * period).toFixed(1)}s`,
								}}
							>
								{[...run, ...run].map((src, k) => (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										key={k}
										src={sizedCover(src, 250)}
										alt=""
										loading="lazy"
										decoding="async"
										className="mb-2.5 aspect-square w-full rounded-[14px] object-cover"
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
