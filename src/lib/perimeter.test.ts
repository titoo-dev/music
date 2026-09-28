import { describe, it, expect } from "vitest";
import { perimeterLength, pointAtRatio, ratioAtPoint, roundedRectPath } from "./perimeter";

const rect = { w: 200, h: 60, r: 18 };
const total = 2 * (200 - 36) + 2 * (60 - 36) + 2 * Math.PI * 18;

describe("perimeter geometry", () => {
	it("computes the rounded-rect perimeter", () => {
		expect(perimeterLength(rect)).toBeCloseTo(total, 6);
	});

	it("clamps the radius to half the shortest side", () => {
		expect(perimeterLength({ w: 100, h: 40, r: 999 })).toBeCloseTo(2 * 60 + Math.PI * 40, 6);
	});

	it("treats negative sizes as empty", () => {
		expect(perimeterLength({ w: -5, h: -5, r: 3 })).toBe(0);
		expect(ratioAtPoint({ w: 0, h: 0, r: 0 }, 3, 3)).toBe(0);
	});

	it("starts at top-center and runs clockwise", () => {
		expect(pointAtRatio(rect, 0)).toEqual({ x: 100, y: 0 });
		const half = pointAtRatio(rect, 0.5);
		expect(half.x).toBeCloseTo(100, 6);
		expect(half.y).toBeCloseTo(60, 6);
		const end = pointAtRatio(rect, 1);
		expect(end.x).toBeCloseTo(100, 6);
		expect(end.y).toBeCloseTo(0, 6);
	});

	it("reaches the right edge before the left edge", () => {
		const quarter = pointAtRatio(rect, 0.25);
		expect(quarter.x).toBeCloseTo(200, 6);
		const threeQuarter = pointAtRatio(rect, 0.75);
		expect(threeQuarter.x).toBeCloseTo(0, 6);
	});

	it("places arc points on the corner circle", () => {
		// Midway through the top-right arc.
		const d = (100 - 18 + (Math.PI * 18) / 4) / total;
		const p = pointAtRatio(rect, d);
		expect(Math.hypot(p.x - 182, p.y - 18)).toBeCloseTo(18, 6);
		expect(p.x).toBeGreaterThan(182);
		expect(p.y).toBeLessThan(18);
	});

	it("clamps out-of-range progress", () => {
		expect(pointAtRatio(rect, -1)).toEqual(pointAtRatio(rect, 0));
		expect(pointAtRatio(rect, 2)).toEqual(pointAtRatio(rect, 1));
	});

	it.each([0.03, 0.12, 0.25, 0.4, 0.5, 0.61, 0.75, 0.88, 0.97])("round-trips ratio %s", (t) => {
		const p = pointAtRatio(rect, t);
		expect(ratioAtPoint(rect, p.x, p.y)).toBeCloseTo(t, 6);
	});

	it("projects points off the border onto the nearest edge", () => {
		// Inside, just under the top edge right of center → just after 0.
		expect(ratioAtPoint(rect, 110, 4)).toBeCloseTo(10 / total, 6);
		// Outside the right edge, mid-height → exactly a quarter.
		expect(ratioAtPoint(rect, 260, 30)).toBeCloseTo(0.25, 6);
		// Far outside a corner snaps onto that corner's arc.
		const r = ratioAtPoint(rect, 400, -200);
		const p = pointAtRatio(rect, r);
		expect(p.x).toBeGreaterThan(182);
		expect(p.y).toBeLessThan(18);
	});

	it("maps top-center to 0 (not 1) and just-left-of-center near 1", () => {
		expect(ratioAtPoint(rect, 100, 0)).toBe(0);
		expect(ratioAtPoint(rect, 99, 0)).toBeCloseTo(1 - 1 / total, 6);
	});

	it("snaps points behind an arc to its nearest end", () => {
		// Point toward the rect's center from the TR corner center → nearest valid is an arc end or edge.
		const r = ratioAtPoint(rect, 170, 30);
		expect(r).toBeGreaterThanOrEqual(0);
		expect(r).toBeLessThanOrEqual(1);
	});

	it("builds a closed SVG path offset by the inset", () => {
		const d = roundedRectPath(rect, 6);
		expect(d.startsWith("M106 6 H188 A18 18 0 0 1 206 24")).toBe(true);
		expect(d.endsWith("Z")).toBe(true);
		expect(d.match(/A/g)).toHaveLength(4);
	});
});
