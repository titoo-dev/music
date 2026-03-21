import { create } from "zustand";

export interface QueueItem {
	uuid: string;
	type: string;
	status: string;
	id: string;
	title: string;
	artist: string;
	cover: string;
	size: number;
	bitrate: number;
	progress: number;
	downloaded: number;
	failed: number;
	errors: any[];
}

interface QueueState {
	queue: Record<string, QueueItem>;
	queueOrder: string[];
	current: QueueItem | null;

	setQueue: (queue: Record<string, QueueItem>, queueOrder: string[]) => void;
	setCurrent: (current: QueueItem | null) => void;
	addToQueue: (item: QueueItem) => void;
	updateQueueItem: (uuid: string, data: Partial<QueueItem>) => void;
	removeFromQueue: (uuid: string) => void;
	clearQueue: () => void;
	clearCompleted: () => void;
	syncFromServer: (serverQueue: Record<string, any>, serverCurrent?: any) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
	queue: {},
	queueOrder: [],
	current: null,

	setQueue: (queue, queueOrder) => set({ queue, queueOrder }),
	setCurrent: (current) => set({ current }),
	addToQueue: (item) =>
		set((s) => {
			const existing = s.queue[item.uuid];
			if (existing) {
				// Item already exists — merge metadata but keep current status/progress
				// to prevent race condition (WS addedToQueue arriving after startDownload)
				return {
					queue: {
						...s.queue,
						[item.uuid]: {
							...item,
							status: existing.status,
							progress: existing.progress ?? item.progress,
							downloaded: existing.downloaded ?? item.downloaded,
							failed: existing.failed ?? item.failed,
						},
					},
				};
			}
			return {
				queue: {
					...s.queue,
					[item.uuid]: { ...item, status: item.status || "inQueue" },
				},
				queueOrder: [...s.queueOrder, item.uuid],
			};
		}),
	updateQueueItem: (uuid, data) =>
		set((s) => {
			if (s.queue[uuid]) {
				return {
					queue: {
						...s.queue,
						[uuid]: { ...s.queue[uuid], ...data },
					},
				};
			}
			// Item not yet in store (race condition: startDownload arrived before addedToQueue)
			// Store the partial data so it can be merged when addedToQueue arrives
			return {
				queue: {
					...s.queue,
					[uuid]: { uuid, status: "inQueue", ...data } as QueueItem,
				},
				queueOrder: s.queueOrder.includes(uuid)
					? s.queueOrder
					: [...s.queueOrder, uuid],
			};
		}),
	removeFromQueue: (uuid) =>
		set((s) => {
			const newQueue = { ...s.queue };
			delete newQueue[uuid];
			return {
				queue: newQueue,
				queueOrder: s.queueOrder.filter((id) => id !== uuid),
			};
		}),
	clearQueue: () => set({ queue: {}, queueOrder: [], current: null }),
	clearCompleted: () =>
		set((s) => {
			const newQueue = { ...s.queue };
			const newOrder = s.queueOrder.filter((uuid) => {
				if (newQueue[uuid]?.status === "completed") {
					delete newQueue[uuid];
					return false;
				}
				return true;
			});
			return { queue: newQueue, queueOrder: newOrder };
		}),
	syncFromServer: (serverQueue, serverCurrent) =>
		set((s) => {
			const merged: Record<string, QueueItem> = {};
			// Merge server queue state into client, server is authoritative for status/progress
			for (const [uuid, serverItem] of Object.entries(serverQueue)) {
				const clientItem = s.queue[uuid];
				merged[uuid] = {
					...(clientItem || {}),
					...serverItem,
				} as QueueItem;
			}
			// If server has a current downloading item, merge its live progress
			if (serverCurrent?.uuid && merged[serverCurrent.uuid]) {
				merged[serverCurrent.uuid] = {
					...merged[serverCurrent.uuid],
					...serverCurrent,
					status: "downloading",
				};
			}
			return { queue: merged };
		}),
}));
