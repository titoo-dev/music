const API_BASE = "/api/v1";
const WS_PORT = 6595;

async function unwrap(res: Response) {
	const json = await res.json();
	if (!res.ok || json.success === false) {
		const msg = json.error?.message || `API error: ${res.status}`;
		const err = new Error(msg) as Error & { code?: string };
		err.code = json.error?.code;
		throw err;
	}
	return json.data ?? json;
}

export async function fetchData(endpoint: string, params: Record<string, string> = {}) {
	const url = new URL(`${API_BASE}/${endpoint}`, window.location.origin);
	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});
	const res = await fetch(url.toString(), { cache: "no-store", credentials: "include" });
	return unwrap(res);
}

export async function postToServer(endpoint: string, data: Record<string, any> = {}) {
	const res = await fetch(`${API_BASE}/${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(data),
	});
	return unwrap(res);
}

export function getWsUrl() {
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	return `${protocol}://${window.location.hostname}:${WS_PORT}`;
}
