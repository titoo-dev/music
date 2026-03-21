"use client";

import { useEffect, useRef } from "react";
import { useQueueStore } from "@/stores/useQueueStore";

const POLL_INTERVAL = 1000;

/**
 * Polls /api/queue to sync download status from the server.
 * Active when there are items in the queue that aren't completed/failed.
 * This ensures UI stays in sync even if WebSocket is unavailable.
 */
export function useQueuePolling() {
	const queue = useQueueStore((s) => s.queue);
	const syncFromServer = useQueueStore((s) => s.syncFromServer);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const hasActiveItems = Object.values(queue).some((item) =>
		["inQueue", "downloading", "cancelling"].includes(item.status)
	);

	useEffect(() => {
		if (!hasActiveItems) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		async function poll() {
			try {
				const res = await fetch("/api/v1/downloads/queue");
				if (!res.ok) return;
				const data = await res.json();
				const queueData = data.data ?? data;
				if (queueData.queue) {
					syncFromServer(queueData.queue, queueData.current);
				}
			} catch {
				// ignore
			}
		}

		// Poll immediately, then on interval
		poll();
		intervalRef.current = setInterval(poll, POLL_INTERVAL);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [hasActiveItems, syncFromServer]);
}
