// ─────────────────────────────────────────────────────────────────────────────
// Rounded-rectangle perimeter geometry for the player's wrap-around seek ring.
// The path starts at the top-center and runs clockwise, so progress reads
// like a clock: 0 at 12 o'clock, 0.5 at the bottom-center, 1 back at the top.
// Coordinates are local to the rect: (0,0) top-left, y pointing down.
// ─────────────────────────────────────────────────────────────────────────────

export interface RoundedRect {
	w: number;
	h: number;
	r: number;
}

type Segment =
	| { kind: "line"; x0: number; y0: number; x1: number; y1: number; len: number }
	| { kind: "arc"; cx: number; cy: number; a0: number; len: number };

const HALF_PI = Math.PI / 2;

function normalize({ w, h, r }: RoundedRect): RoundedRect {
	const W = Math.max(0, w);
	const H = Math.max(0, h);
	return { w: W, h: H, r: Math.max(0, Math.min(r, W / 2, H / 2)) };
}

function segments(rect: RoundedRect): Segment[] {
	const { w, h, r } = normalize(rect);
	const line = (x0: number, y0: number, x1: number, y1: number): Segment => ({
		kind: "line",
		x0,
		y0,
		x1,
		y1,
		len: Math.hypot(x1 - x0, y1 - y0),
	});
	// Arcs sweep a quarter turn clockwise (increasing angle, y-down) from a0.
	const arc = (cx: number, cy: number, a0: number): Segment => ({ kind: "arc", cx, cy, a0, len: HALF_PI * r });
	return [
		line(w / 2, 0, w - r, 0),
		arc(w - r, r, -HALF_PI),
		line(w, r, w, h - r),
		arc(w - r, h - r, 0),
		line(w - r, h, r, h),
		arc(r, h - r, HALF_PI),
		line(0, h - r, 0, r),
		arc(r, r, Math.PI),
		line(r, 0, w / 2, 0),
	];
}

export function perimeterLength(rect: RoundedRect): number {
	return segments(rect).reduce((s, seg) => s + seg.len, 0);
}

/** SVG path for the perimeter, translated by `inset` on both axes. */
export function roundedRectPath(rect: RoundedRect, inset = 0): string {
	const { w, h, r } = normalize(rect);
	const x = (v: number) => +(v + inset).toFixed(2);
	const R = +r.toFixed(2);
	return [
		`M${x(w / 2)} ${x(0)}`,
		`H${x(w - r)}`,
		`A${R} ${R} 0 0 1 ${x(w)} ${x(r)}`,
		`V${x(h - r)}`,
		`A${R} ${R} 0 0 1 ${x(w - r)} ${x(h)}`,
		`H${x(r)}`,
		`A${R} ${R} 0 0 1 ${x(0)} ${x(h - r)}`,
		`V${x(r)}`,
		`A${R} ${R} 0 0 1 ${x(r)} ${x(0)}`,
		"Z",
	].join(" ");
}

/** Point on the perimeter at progress `t` (0..1, clamped). */
export function pointAtRatio(rect: RoundedRect, t: number): { x: number; y: number } {
	const segs = segments(rect);
	const total = segs.reduce((s, seg) => s + seg.len, 0);
	let d = Math.max(0, Math.min(1, t)) * total;
	for (const seg of segs) {
		if (d <= seg.len || seg === segs[segs.length - 1]) {
			const k = seg.len === 0 ? 0 : Math.min(1, d / seg.len);
			if (seg.kind === "line") {
				return { x: seg.x0 + (seg.x1 - seg.x0) * k, y: seg.y0 + (seg.y1 - seg.y0) * k };
			}
			const r = seg.len / HALF_PI;
			const a = seg.a0 + k * HALF_PI;
			return { x: seg.cx + r * Math.cos(a), y: seg.cy + r * Math.sin(a) };
		}
		d -= seg.len;
	}
	/* c8 ignore next */
	return { x: 0, y: 0 };
}

/** Progress (0..1) of the perimeter point closest to (px, py). */
export function ratioAtPoint(rect: RoundedRect, px: number, py: number): number {
	const segs = segments(rect);
	const total = segs.reduce((s, seg) => s + seg.len, 0);
	if (total === 0) return 0;

	let best = Infinity;
	let bestAt = 0;
	let offset = 0;
	for (const seg of segs) {
		let dist: number;
		let along: number;
		if (seg.kind === "line") {
			const dx = seg.x1 - seg.x0;
			const dy = seg.y1 - seg.y0;
			const k = seg.len === 0 ? 0 : Math.max(0, Math.min(1, ((px - seg.x0) * dx + (py - seg.y0) * dy) / (seg.len * seg.len)));
			dist = Math.hypot(px - (seg.x0 + dx * k), py - (seg.y0 + dy * k));
			along = k * seg.len;
		} else {
			const r = seg.len / HALF_PI;
			// Angle relative to the arc start, wrapped into [0, 2π).
			let rel = Math.atan2(py - seg.cy, px - seg.cx) - seg.a0;
			rel = ((rel % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
			// Outside the quarter sweep → snap to whichever end is angularly closer.
			if (rel > HALF_PI) rel = rel - HALF_PI < 2 * Math.PI - rel ? HALF_PI : 0;
			const a = seg.a0 + rel;
			dist = Math.hypot(px - (seg.cx + r * Math.cos(a)), py - (seg.cy + r * Math.sin(a)));
			along = (rel / HALF_PI) * seg.len;
		}
		if (dist < best) {
			best = dist;
			bestAt = offset + along;
		}
		offset += seg.len;
	}
	// The closing half-segment ends exactly where the path started.
	return bestAt / total >= 1 ? 1 : bestAt / total;
}
