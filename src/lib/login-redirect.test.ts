import { describe, it, expect } from "vitest";
import { loginHref, safeNext } from "./login-redirect";

describe("safeNext (NAV-10)", () => {
	it("keeps an in-app path with its query", () => {
		expect(safeNext("/library?tab=albums")).toBe("/library?tab=albums");
		expect(safeNext("/my-playlists/abc")).toBe("/my-playlists/abc");
	});

	it("refuses anything that could leave the app (open redirect)", () => {
		for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "evil", "javascript:alert(1)", "/\nhttps://x", ""]) {
			expect(safeNext(bad)).toBe("/");
		}
		expect(safeNext(null)).toBe("/");
		expect(safeNext(undefined)).toBe("/");
	});

	it("never sends the user back to /login", () => {
		expect(safeNext("/login")).toBe("/");
		expect(safeNext("/login?next=/library")).toBe("/");
	});
});

describe("loginHref", () => {
	it("carries the page to come back to (was: sign-in always landed on Home)", () => {
		expect(loginHref("/library?tab=albums")).toBe("/login?next=%2Flibrary%3Ftab%3Dalbums");
	});

	it("is plain /login from Home or an unsafe path", () => {
		expect(loginHref("/")).toBe("/login");
		expect(loginHref("//evil.example")).toBe("/login");
		expect(loginHref()).toBe("/login");
	});
});
