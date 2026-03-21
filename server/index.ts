import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = parseInt(process.env.WS_PORT || "6595");

// Track all connected clients
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
	clients.add(ws);
	console.log(`[WS] Client connected (${clients.size} total)`);

	ws.on("message", (raw) => {
		try {
			const { key, data } = JSON.parse(raw.toString());
			handleClientMessage(key, data, ws);
		} catch (e) {
			// ignore invalid messages
		}
	});

	ws.on("close", () => {
		clients.delete(ws);
		console.log(`[WS] Client disconnected (${clients.size} total)`);
	});

	ws.on("error", () => {
		clients.delete(ws);
	});
});

// Handle messages from clients (like removeFromQueue, cancelAllDownloads, etc.)
function handleClientMessage(key: string, data: any, ws: WebSocket) {
	switch (key) {
		case "removeFromQueue":
			// Forward to the deemix app via HTTP API call to Next.js
			fetch(`http://localhost:3000/api/remove-from-queue`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ uuid: data }),
			}).catch(() => {});
			break;
		case "cancelAllDownloads":
			fetch(`http://localhost:3000/api/cancel-all`, { method: "POST" }).catch(() => {});
			break;
		case "removeFinishedDownloads":
			fetch(`http://localhost:3000/api/remove-finished`, { method: "POST" }).catch(() => {});
			break;
		case "saveSettings":
			fetch(`http://localhost:3000/api/settings`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}).catch(() => {});
			break;
	}
}

// Broadcast to all connected clients
export function broadcast(key: string, data: any) {
	const message = JSON.stringify({ key, data });
	clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	});
}

// CORS headers - must be before routes
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	if (req.method === "OPTIONS") {
		res.sendStatus(200);
		return;
	}
	next();
});

// HTTP endpoint for internal broadcasts (called by Next.js API routes)
app.use(express.json());
app.post("/broadcast", (req, res) => {
	const { key, data } = req.body;
	broadcast(key, data);
	res.json({ ok: true });
});

server.listen(PORT, () => {
	console.log(`[WS Server] Running on port ${PORT}`);
});
