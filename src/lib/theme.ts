export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "wavelet-theme";

/** Resolve a stored preference against the OS setting. */
export function resolveTheme(
	pref: ThemePreference,
	systemPrefersDark: boolean
): "light" | "dark" {
	if (pref === "system") return systemPrefersDark ? "dark" : "light";
	return pref;
}

export function readThemePreference(): ThemePreference {
	try {
		const v = localStorage.getItem(THEME_STORAGE_KEY);
		if (v === "light" || v === "dark" || v === "system") return v;
	} catch {
		// Storage blocked — fall through to system.
	}
	return "system";
}

/** Persist the preference and apply it to <html> immediately. */
export function applyThemePreference(pref: ThemePreference) {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, pref);
	} catch {
		// Non-fatal — theme still applies for this session.
	}
	const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	document.documentElement.classList.toggle(
		"dark",
		resolveTheme(pref, dark) === "dark"
	);
}

/**
 * Inlined in <head> so the `.dark` class lands before first paint, and kept
 * in sync with the OS setting while the preference is "system".
 */
export const THEME_SCRIPT = `(function(){try{var k=${JSON.stringify(
	THEME_STORAGE_KEY
)};var m=window.matchMedia("(prefers-color-scheme: dark)");var a=function(){var p=localStorage.getItem(k)||"system";var d=p==="dark"||(p==="system"&&m.matches);document.documentElement.classList.toggle("dark",d);};a();m.addEventListener("change",a);}catch(e){}})();`;
