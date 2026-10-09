// @vitest-environment node
import { describe, it, expect } from "vitest";
import { loadOgFont } from "./og-font";

describe("loadOgFont", () => {
	it("loads a real TrueType font from the repo (was: fetched a Google Fonts URL that answered 404, so the OG image failed)", async () => {
		const font = await loadOgFont();
		expect(font).not.toBeNull();
		const head = new Uint8Array(font!.slice(0, 4));
		expect([...head]).toEqual([0x00, 0x01, 0x00, 0x00]);
	});
});
