"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueueStore } from "@/stores/useQueueStore";
import { useAppStore } from "@/stores/useAppStore";

function getWsUrl() {
	if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const port = process.env.NEXT_PUBLIC_WS_PORT || "6595";
	return `${protocol}://${window.location.hostname}:${port}`;
}

export function useSocket() {
	const wsRef = useRef<WebSocket | null>(null);
	const { addToQueue, updateQueueItem, removeFromQueue, setCurrent } = useQueueStore();

	const connect = useCallback(() => {
		const url = getWsUrl();

		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("[WS] Connected");
		};

		ws.onmessage = (event) => {
			try {
				const { key, data } = JSON.parse(event.data);
				handleMessage(key, data);
			} catch {
				// ignore invalid messages
			}
		};

		ws.onclose = () => {
			console.log("[WS] Disconnected, reconnecting...");
			setTimeout(connect, 3000);
		};

		ws.onerror = () => {
			ws.close();
		};
	}, []);

	const handleMessage = useCallback(
		(key: string, data: any) => {
			switch (key) {
				case "addedToQueue":
					if (Array.isArray(data)) {
						data.forEach((item: any) => addToQueue(item));
					} else {
						addToQueue(data);
					}
					// Auto-open the download sheet for visual feedback
					useAppStore.getState().setDownloadsOpen(true);
					break;
				case "startDownload":
					updateQueueItem(data, { status: "downloading" });
					break;
				case "updateQueue":
					if (data.uuid) {
						updateQueueItem(data.uuid, data);
					}
					break;
				case "removedFromQueue":
					removeFromQueue(data.uuid);
					break;
				case "removedAllDownloads":
					useQueueStore.getState().clearQueue();
					break;
				case "removedFinishedDownloads":
					useQueueStore.getState().clearCompleted();
					break;
				case "finishDownload":
					updateQueueItem(data.uuid, {
						status: data.status || "completed",
						...(data.extrasPath ? { extrasPath: data.extrasPath } : {}),
					});
					break;
				case "cancellingCurrentItem":
					updateQueueItem(data, { status: "cancelling" });
					break;
				case "currentItemCancelled":
					removeFromQueue(data.uuid);
					break;
				case "queueError":
					console.error("[Queue Error]", data);
					break;
			}
		},
		[addToQueue, updateQueueItem, removeFromQueue, setCurrent]
	);

	const send = useCallback((key: string, data: any = {}) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ key, data }));
		}
	}, []);

	useEffect(() => {
		connect();
		return () => {
			wsRef.current?.close();
		};
	}, [connect]);

	return { send };
}
