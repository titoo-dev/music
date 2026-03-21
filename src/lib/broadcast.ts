// Helper to broadcast events to WebSocket clients from API routes
export async function broadcast(key: string, data: any) {
	try {
		await fetch(`http://localhost:${process.env.WS_PORT || 6595}/broadcast`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ key, data }),
		});
	} catch {
		// WS server might not be running
	}
}
