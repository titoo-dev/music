import { describe, expect, it } from "vitest";
import { formatRelative, formatTotal, groupByDay, plural, recentBucket, relativePhrase, uniqueCovers } from "./format";

describe("plural", () => {
	it("uses the singular for one and the plural otherwise", () => {
		expect(plural(1, "track")).toBe("1 track");
		expect(plural(0, "track")).toBe("0 tracks");
		expect(plural(12, "track")).toBe("12 tracks");
		expect(plural(2, "child", "children")).toBe("2 children");
	});
});

describe("formatTotal", () => {
	it("is empty for nothing", () => {
		expect(formatTotal(0)).toBe("");
		expect(formatTotal(-5)).toBe("");
		expect(formatTotal(Number.NaN)).toBe("");
	});
	it("never says 0 min", () => {
		expect(formatTotal(20)).toBe("1 min");
	});
	it("shows minutes under an hour", () => {
		expect(formatTotal(42 * 60 + 30)).toBe("42 min");
	});
	it("shows hours and minutes", () => {
		expect(formatTotal(3 * 3600 + 20 * 60)).toBe("3 h 20 min");
		expect(formatTotal(3600)).toBe("1 h 0 min");
	});
});

describe("formatRelative", () => {
	const now = new Date("2026-10-03T12:00:00Z").getTime();
	const ago = (ms: number) => new Date(now - ms).toISOString();
	it("is empty when unknown", () => {
		expect(formatRelative(null, now)).toBe("");
		expect(formatRelative("nope", now)).toBe("");
	});
	it("walks through minutes, hours and days", () => {
		expect(formatRelative(ago(10_000), now)).toBe("Just now");
		expect(formatRelative(ago(5 * 60_000), now)).toBe("5m ago");
		expect(formatRelative(ago(3 * 3_600_000), now)).toBe("3h ago");
		expect(formatRelative(ago(2 * 86_400_000), now)).toBe("2d ago");
	});
	it("falls back to a short date after a week", () => {
		expect(formatRelative("2026-03-04T12:00:00Z", now)).toBe("Mar 4");
	});
	it("treats future dates as just now", () => {
		expect(formatRelative(ago(-60_000), now)).toBe("Just now");
	});
	it("lower-cases only 'Just now' inside a sentence", () => {
		expect(relativePhrase(ago(1000), now)).toBe("just now");
		expect(relativePhrase(ago(3 * 3_600_000), now)).toBe("3h ago");
	});
});

describe("recentBucket", () => {
	const now = new Date(2026, 9, 3, 15, 0); // Oct 3, 15:00 local
	it("buckets by calendar day", () => {
		expect(recentBucket(new Date(2026, 9, 3, 0, 5).toISOString(), now)).toBe("Today");
		expect(recentBucket(new Date(2026, 9, 2, 23, 59).toISOString(), now)).toBe("Yesterday");
		expect(recentBucket(new Date(2026, 9, 1).toISOString(), now)).toBe("This week");
		expect(recentBucket(new Date(2026, 8, 20).toISOString(), now)).toBe("This month");
		expect(recentBucket(new Date(2026, 6, 1).toISOString(), now)).toBe("Earlier");
	});
	it("puts unknown dates in Earlier and future ones in Today", () => {
		expect(recentBucket(null, now)).toBe("Earlier");
		expect(recentBucket("garbage", now)).toBe("Earlier");
		expect(recentBucket(new Date(2026, 9, 5).toISOString(), now)).toBe("Today");
	});
});

describe("groupByDay", () => {
	it("keeps order and the index in the full list", () => {
		const now = new Date(2026, 9, 3, 15, 0);
		const items = [
			{ id: "a", at: new Date(2026, 9, 3, 14).toISOString() },
			{ id: "b", at: new Date(2026, 9, 3, 9).toISOString() },
			{ id: "c", at: new Date(2026, 9, 2, 9).toISOString() },
			{ id: "d", at: new Date(2026, 5, 2).toISOString() },
		];
		const groups = groupByDay(items, (i) => i.at, now);
		expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Earlier"]);
		expect(groups[0].items.map((x) => [x.item.id, x.index])).toEqual([
			["a", 0],
			["b", 1],
		]);
		expect(groups[2].items[0]).toEqual({ item: items[3], index: 3 });
	});
	it("returns nothing for nothing", () => {
		expect(groupByDay([], () => null)).toEqual([]);
	});
});

describe("uniqueCovers", () => {
	it("dedupes, skips blanks and caps", () => {
		expect(uniqueCovers([["a", null, "b"], ["a", "c", undefined, "d"]], 3)).toEqual(["a", "b", "c"]);
		expect(uniqueCovers([[null], []], 5)).toEqual([]);
	});
});
