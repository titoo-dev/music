import { NextRequest } from "next/server";

/**
 * Build a NextRequest for route-handler unit tests. Default URL is a placeholder;
 * override via `url` to test query-param branches.
 */
export function makeNextRequest(opts: {
	url?: string;
	method?: string;
	headers?: Record<string, string>;
	body?: unknown;
} = {}): NextRequest {
	const url = opts.url ?? "http://localhost:3000/test";
	const init: RequestInit = {
		method: opts.method ?? "GET",
		headers: opts.headers,
	};
	if (opts.body !== undefined) {
		init.body =
			typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
		init.headers = {
			"Content-Type": "application/json",
			...(opts.headers ?? {}),
		};
	}
	return new NextRequest(new Request(url, init));
}

/**
 * Resolve route-handler `params` arg. Next 15+ passes a Promise.
 */
export function makeParams<T extends Record<string, string>>(p: T): { params: Promise<T> } {
	return { params: Promise.resolve(p) };
}

/**
 * Read a Response body as JSON regardless of how the handler emitted it.
 * Returns `null` when the body is empty (e.g., 302 redirects).
 */
export async function readJson<T = unknown>(res: Response): Promise<T | null> {
	const text = await res.text();
	if (!text) return null;
	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}
