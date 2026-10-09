import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

describe("--header-h (NAV-03)", () => {
	it("includes the top safe-area inset on phones and desktop (was: sticky sub-bars slid under the header in the PWA)", () => {
		const values = [...css.matchAll(/--header-h:\s*([^;]+);/g)].map((m) => m[1].trim());
		expect(values.length).toBeGreaterThanOrEqual(2);
		for (const v of values) expect(v).toMatch(/env\(safe-area-inset-top/);
	});
});
