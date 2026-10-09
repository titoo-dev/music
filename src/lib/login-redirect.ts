/**
 * Coming back after signing in: `/login?next=<path>` carries the page the
 * user was on. Only an in-app path is honoured — anything that could leave
 * the site (`https://…`, `//host`, `/\host`, control characters) falls back
 * to Home, so `next` can't be used as an open redirect.
 */
export function safeNext(raw: string | null | undefined): string {
	if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
	if (/[\u0000-\u001f\u007f]/.test(raw)) return "/";
	if (raw === "/login" || raw.startsWith("/login?") || raw.startsWith("/login/")) return "/";
	return raw;
}

/** The sign-in page, set to come back to `from` (a path with its query). */
export function loginHref(from?: string | null): string {
	const next = safeNext(from);
	return next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
}

/** The sign-in page, set to come back to the current page (client only). */
export function currentLoginHref(): string {
	if (typeof window === "undefined") return "/login";
	return loginHref(window.location.pathname + window.location.search);
}
