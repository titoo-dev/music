import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	resolveTheme,
	readThemePreference,
	applyThemePreference,
	THEME_STORAGE_KEY,
	THEME_SCRIPT,
	THEME_COLORS,
} from "./theme";

const themeColor = () =>
	Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map((m) => m.content);

const origMatchMedia = window.matchMedia;

function mockMatchMedia(dark: boolean) {
	window.matchMedia = vi.fn(() => ({ matches: dark, addEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove("dark");
	document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
});

afterEach(() => {
	window.matchMedia = origMatchMedia;
});

describe("theme", () => {
	it("resolves system against the OS preference", () => {
		expect(resolveTheme("system", true)).toBe("dark");
		expect(resolveTheme("system", false)).toBe("light");
		expect(resolveTheme("light", true)).toBe("light");
		expect(resolveTheme("dark", false)).toBe("dark");
	});

	it("reads a stored preference, defaulting to system", () => {
		expect(readThemePreference()).toBe("system");
		localStorage.setItem(THEME_STORAGE_KEY, "dark");
		expect(readThemePreference()).toBe("dark");
		localStorage.setItem(THEME_STORAGE_KEY, "garbage");
		expect(readThemePreference()).toBe("system");
	});

	it("applies and persists a preference", () => {
		mockMatchMedia(false);
		applyThemePreference("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
		applyThemePreference("system");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("inline script applies the dark class from storage before paint", () => {
		mockMatchMedia(false);
		localStorage.setItem(THEME_STORAGE_KEY, "dark");
		new Function(THEME_SCRIPT)();
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("inline script follows the OS when no preference is stored", () => {
		mockMatchMedia(true);
		new Function(THEME_SCRIPT)();
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("paints the PWA title bar with the app theme, not the OS one (was: white title bar over the dark app)", () => {
		mockMatchMedia(false);
		applyThemePreference("dark");
		expect(themeColor()).toEqual([THEME_COLORS.dark]);
		applyThemePreference("light");
		expect(themeColor()).toEqual([THEME_COLORS.light]);
	});

	it("rewrites existing theme-color metas instead of adding more", () => {
		mockMatchMedia(true);
		const meta = document.createElement("meta");
		meta.name = "theme-color";
		meta.content = "#123456";
		meta.media = "(prefers-color-scheme: light)";
		document.head.appendChild(meta);
		applyThemePreference("system");
		expect(themeColor()).toEqual([THEME_COLORS.dark]);
		expect(meta.hasAttribute("media")).toBe(false);
	});

	it("inline script sets the theme-color before paint", () => {
		mockMatchMedia(false);
		localStorage.setItem(THEME_STORAGE_KEY, "dark");
		new Function(THEME_SCRIPT)();
		expect(themeColor()).toEqual([THEME_COLORS.dark]);
	});
});
