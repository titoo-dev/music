import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	resolveTheme,
	readThemePreference,
	applyThemePreference,
	THEME_STORAGE_KEY,
	THEME_SCRIPT,
} from "./theme";

const origMatchMedia = window.matchMedia;

function mockMatchMedia(dark: boolean) {
	window.matchMedia = vi.fn(() => ({ matches: dark, addEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove("dark");
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
});
