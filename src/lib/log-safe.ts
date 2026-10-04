// Keeping secrets out of server logs and of wrapped error messages.
//
// got errors are the main hazard: an HTTPError's message embeds the request
// URL (gw-light's api_token, api.deezer.com's access_token in the query) and
// every RequestError carries its request `options` as an enumerable property
// (the JSON body with the Deezer license_token, the cookie jar holding the
// ARL), which console.error(err) prints in full. So errors are described by
// name, message and stack only, with URL query strings masked.

const URL_WITH_QUERY = /(\bhttps?:\/\/[^\s?#"'<>]+)\?[^\s#"'<>]*/gi;

/** `text` with the query string of every http(s) URL replaced by "[redacted]". */
export function redactUrlQueries(text: string): string {
	return text.replace(URL_WITH_QUERY, "$1?[redacted]");
}

/** "Name: message" of an error, URL queries masked — for log lines and wrapped messages. */
export function errorSummary(e: unknown): string {
	if (e !== null && typeof e === "object") {
		const { name, message } = e as { name?: unknown; message?: unknown };
		const label = typeof name === "string" && name ? name : "Error";
		return redactUrlQueries(typeof message === "string" && message ? `${label}: ${message}` : label);
	}
	return redactUrlQueries(String(e));
}

const MAX_CAUSES = 3;

/**
 * A multi-line description for server logs: the stack (or summary) of `e`
 * and of at most three causes, URL queries masked — never the error's other
 * properties.
 */
export function describeErrorForLog(e: unknown): string {
	if (!(e instanceof Error)) return errorSummary(e);
	const lines: string[] = [];
	let current: unknown = e;
	for (let depth = 0; depth <= MAX_CAUSES && current !== undefined && current !== null; depth++) {
		const text = current instanceof Error && current.stack ? redactUrlQueries(current.stack) : errorSummary(current);
		lines.push(depth === 0 ? text : `[cause] ${text}`);
		current = current instanceof Error ? (current as { cause?: unknown }).cause : undefined;
	}
	return lines.join("\n");
}
