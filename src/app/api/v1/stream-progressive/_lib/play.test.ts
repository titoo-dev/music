import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { parseRangeHeader } from "./play";

describe("parseRangeHeader", () => {
	it.each([
		[null, { kind: "none" }],
		["", { kind: "none" }],
		["bytes=0-", { kind: "from-start", end: undefined }],
		[" bytes=0- ", { kind: "from-start", end: undefined }],
		// Safari / AVPlayer open with bytes=0-1, then bytes=0-(n-1): a play
		// that starts at 0 (was: live-only, so iOS plays never persisted).
		["bytes=0-1", { kind: "from-start", end: 1 }],
		["bytes=0-3623704", { kind: "from-start", end: 3623704 }],
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
