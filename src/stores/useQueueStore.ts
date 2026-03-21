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
}

export const useQueueStore = create<QueueState>((set) => ({
	queue: {},
	queueOrder: [],
	current: null,

	setQueue: (queue, queueOrder) => set({ queue, queueOrder }),
	setCurrent: (current) => set({ current }),
	addToQueue: (item) =>
		set((s) => ({
			queue: { ...s.queue, [item.uuid]: item },
			queueOrder: [...s.queueOrder, item.uuid],
		})),
	updateQueueItem: (uuid, data) =>
		set((s) => ({
			queue: {
				...s.queue,
				[uuid]: s.queue[uuid] ? { ...s.queue[uuid], ...data } : s.queue[uuid],
			},
		})),
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
}));
