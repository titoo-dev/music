import { describe, it, expect } from "vitest";
import { PREFETCH_LIMIT, queuePrefetchWindow, createPrefetchBudget } from "./prefetch-budget";

const q = (n: number) => Array.from({ length: n }, (_, i) => ({ trackId: `t${i}` }));

describe("queuePrefetchWindow", () => {
	it("caps a long queue at 5 tracks (was: next 5 + prev 2 = 7 R2 downloads per track change)", () => {
		const ids = queuePrefetchWindow(q(200), 10);
		expect(PREFETCH_LIMIT).toBe(5);
		expect(ids).toHaveLength(5);
		expect(ids).toEqual(["t11", "t12", "t13", "t14", "t9"]);
	});

	it("uses every slot for upcoming tracks at the start of the queue", () => {
		expect(queuePrefetchWindow(q(10), 0)).toEqual(["t1", "t2", "t3", "t4", "t5"]);
	});

	it("stops at the end of the queue", () => {
		expect(queuePrefetchWindow(q(4), 2)).toEqual(["t3", "t1"]);
		expect(queuePrefetchWindow(q(4), 3)).toEqual(["t2"]);
	});

	it("returns nothing for an empty queue or a non-positive limit", () => {
		expect(queuePrefetchWindow([], 0)).toEqual([]);
		expect(queuePrefetchWindow(q(10), 3, 0)).toEqual([]);
	});

	it("gives a single slot to the next track", () => {
		expect(queuePrefetchWindow(q(10), 3, 1)).toEqual(["t4"]);
	});

	it("falls back to the previous track when nothing is ahead", () => {
		expect(queuePrefetchWindow(q(10), 9, 1)).toEqual(["t8"]);
	});
});

describe("createPrefetchBudget", () => {
	it("grants at most 5 prefetches per page (was: every visible row of a playlist head-prefetched)", () => {
		const budget = createPrefetchBudget();
		const granted = Array.from({ length: 50 }, (_, i) => budget.take(`t${i}`, "/playlist/1")).filter(Boolean);
		expect(granted).toHaveLength(5);
	});

	it("re-granting an id already taken is free (virtualized rows re-mount)", () => {
		const budget = createPrefetchBudget(2);
		expect(budget.take("a", "/p")).toBe(true);
		expect(budget.take("b", "/p")).toBe(true);
		expect(budget.take("a", "/p")).toBe(true);
		expect(budget.take("c", "/p")).toBe(false);
	});

	it("refills when the scope changes", () => {
		const budget = createPrefetchBudget(1);
		expect(budget.take("a", "/p1")).toBe(true);
		expect(budget.take("b", "/p1")).toBe(false);
		expect(budget.take("b", "/p2")).toBe(true);
	});
});
