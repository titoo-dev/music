import { describe, it, expect } from "vitest";
import { VIRTUALIZE_MIN, listOffset, listPadding, shouldVirtualize } from "./virtual-rows";

describe("shouldVirtualize", () => {
	it("leaves short lists whole and virtualizes long ones", () => {
		expect(shouldVirtualize(VIRTUALIZE_MIN - 1)).toBe(false);
		expect(shouldVirtualize(VIRTUALIZE_MIN)).toBe(true);
		expect(shouldVirtualize(500)).toBe(true);
	});

	it("honours a custom threshold", () => {
		expect(shouldVirtualize(5, 5)).toBe(true);
		expect(shouldVirtualize(4, 5)).toBe(false);
	});
});

describe("listPadding", () => {
	it("pads for the rows above and below the rendered window", () => {
		// rows of 60px, list starts 400px down the page, rows 10–19 rendered
		const items = Array.from({ length: 10 }, (_, k) => ({ start: 400 + (10 + k) * 60, end: 400 + (11 + k) * 60 }));
		expect(listPadding(items, 100 * 60, 400)).toEqual({ paddingTop: 600, paddingBottom: 80 * 60 });
	});

	it("has no padding when the whole list is rendered", () => {
		const items = [{ start: 100, end: 160 }, { start: 160, end: 220 }];
		expect(listPadding(items, 120, 100)).toEqual({ paddingTop: 0, paddingBottom: 0 });
	});

	it("reserves the full size when nothing is rendered yet", () => {
		expect(listPadding([], 3000, 0)).toEqual({ paddingTop: 0, paddingBottom: 3000 });
	});

	it("never goes negative on a stale scroll margin", () => {
		expect(listPadding([{ start: 0, end: 60 }], 60, 20)).toEqual({ paddingTop: 0, paddingBottom: 20 });
	});
});

describe("listOffset", () => {
	it("measures from the document top for the window", () => {
		expect(listOffset(-150, 0, 1000)).toBe(850);
	});

	it("measures inside a scrolled element", () => {
		expect(listOffset(320.4, 100, 50)).toBe(270);
	});
});
