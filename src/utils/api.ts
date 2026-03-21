const API_BASE = "/api";
const WS_PORT = 6595;

export async function fetchData(endpoint: string, params: Record<string, string> = {}) {
	const url = new URL(`${API_BASE}/${endpoint}`, window.location.origin);
	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json();
}

export async function postToServer(endpoint: string, data: Record<string, any> = {}) {
	const res = await fetch(`${API_BASE}/${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json();
}

export function getWsUrl() {
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	return `${protocol}://${window.location.hostname}:${WS_PORT}`;
}
