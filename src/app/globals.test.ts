// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "lightningcss";

const source = readFileSync(join(__dirname, "globals.css"), "utf8");

/** Runs globals.css through Lightning CSS (Tailwind 4's minifier) and returns one compiled rule's body. */
function compiledRule(selector: string) {
	const { code } = transform({ filename: "globals.css", code: Buffer.from(source), errorRecovery: true });
	const css = code.toString();
	const at = css.search(new RegExp(`(^|\\s)${selector.replace(".", "\\.")}\\s*\\{`));
	expect(at, `${selector} missing from compiled CSS`).toBeGreaterThanOrEqual(0);
	return css.slice(at, css.indexOf("}", at));
}

describe("globals.css", () => {
	it("keeps the unprefixed backdrop-filter on .glass (was: Lightning CSS kept only -webkit-, so no frost in Chrome)", () => {
		expect(compiledRule(".glass")).toMatch(/(^|[\s;{])backdrop-filter:\s*[^;]*blur\(/);
	});
});
