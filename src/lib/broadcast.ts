// Helper to broadcast events to WebSocket clients from API routes
const WS_BROADCAST_URL =
	process.env.WS_BROADCAST_URL ||
	`http://localhost:${process.env.WS_PORT || 6595}`;

export async function broadcast(key: string, data: any) {
	try {
		await fetch(`${WS_BROADCAST_URL}/broadcast`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ key, data }),
		});
	} catch {
		// WS server might not be running
	}
}
