"use client";

import { useEffect, useRef } from "react";
import { useQueueStore } from "@/stores/useQueueStore";

const ACTIVE_POLL_INTERVAL = 1000;
const IDLE_POLL_INTERVAL = 30000;

/**
 * Polls /api/queue to sync download status from the server.
 * Fast polling (1s) when active downloads exist, slow polling (30s) otherwise
 * to catch items added while WS was disconnected.
 */
export function useQueuePolling() {
	const queue = useQueueStore((s) => s.queue);
	const syncFromServer = useQueueStore((s) => s.syncFromServer);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const hasActiveItems = Object.values(queue).some((item) =>
		["inQueue", "downloading", "cancelling"].includes(item.status)
	);

	useEffect(() => {
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

		const interval = hasActiveItems ? ACTIVE_POLL_INTERVAL : IDLE_POLL_INTERVAL;

		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		poll();
		intervalRef.current = setInterval(poll, interval);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [hasActiveItems, syncFromServer]);
}
