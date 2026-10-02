export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "wavelet-theme";

/** `--background` per theme — also paints the browser / PWA title bar. */
export const THEME_COLORS = { light: "#ffffff", dark: "#0a0a0a" } as const;

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
	const theme = resolveTheme(pref, dark);
	document.documentElement.classList.toggle("dark", theme === "dark");
	syncThemeColor(theme);
}

/**
 * Point every `<meta name="theme-color">` at the app theme (creating one if
 * needed). Without this the installed PWA's title bar follows the OS scheme,
 * e.g. white over a dark app.
 */
export function syncThemeColor(theme: "light" | "dark") {
	let metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
	if (metas.length === 0) {
		const meta = document.createElement("meta");
		meta.name = "theme-color";
		document.head.appendChild(meta);
		metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
	}
	metas.forEach((m) => {
		m.removeAttribute("media");
		m.content = THEME_COLORS[theme];
	});
}

/**
 * Inlined in <head> so the `.dark` class lands before first paint, and kept
 * in sync with the OS setting while the preference is "system".
 */
export const THEME_SCRIPT = `(function(){try{var k=${JSON.stringify(
	THEME_STORAGE_KEY
)};var c=${JSON.stringify(THEME_COLORS)};var m=window.matchMedia("(prefers-color-scheme: dark)");var a=function(){var p=localStorage.getItem(k)||"system";var d=p==="dark"||(p==="system"&&m.matches);document.documentElement.classList.toggle("dark",d);var t=document.querySelectorAll('meta[name="theme-color"]');if(!t.length){var e=document.createElement("meta");e.name="theme-color";document.head.appendChild(e);t=[e];}for(var i=0;i<t.length;i++){t[i].removeAttribute("media");t[i].content=d?c.dark:c.light;}};a();m.addEventListener("change",a);}catch(e){}})();`;
