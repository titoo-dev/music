import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { parseRangeHeader } from "./play";

describe("parseRangeHeader", () => {
	it.each([
		[null, { kind: "none" }],
		["", { kind: "none" }],
		["bytes=0-", { kind: "open-start" }],
		[" bytes=0- ", { kind: "open-start" }],
		["bytes=0-1", { kind: "range", start: 0, end: 1 }],
		["bytes=100-199", { kind: "range", start: 100, end: 199 }],
		["bytes=500-", { kind: "range", start: 500, end: undefined }],
		["bytes=-500", { kind: "none" }],
		["bytes=0-1,5-6", { kind: "none" }],
		["bytes=9-3", { kind: "none" }],
		["items=0-1", { kind: "none" }],
		["bytes=99999999999999999999-", { kind: "none" }],
	])("%s → %o", (header, expected) => {
		expect(parseRangeHeader(header)).toEqual(expected);
	});
});
