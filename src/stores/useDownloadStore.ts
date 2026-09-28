import { create } from "zustand";
import {
	fetchTrackFile,
	fileNameFor,
	saveBlob,
	type DownloadableTrack,
	type DownloadProgress,
} from "@/lib/download";

// ─────────────────────────────────────────────────────────────────────────────
// Download queue — the single place every "download" action in the UI goes
// through (⌘K palette, track menus, album heroes). Runs up to MAX_CONCURRENT
// transfers at a time; the rest wait in FIFO order.
// ─────────────────────────────────────────────────────────────────────────────

export type DownloadStatus = "queued" | "downloading" | "done" | "error" | "canceled";

export interface DownloadItem extends DownloadableTrack {
	/** Unique per enqueue — the same track can be downloaded again later. */
	id: string;
	status: DownloadStatus;
	loaded: number;
	total: number | null;
	error: string | null;
	/** Optional group label ("Album · Discovery") shown in the palette. */
	group: string | null;
	createdAt: number;
}

export const MAX_CONCURRENT = 2;

export interface DownloadTransport {
	fetchFile: (
		trackId: string,
		onProgress: (p: DownloadProgress) => void,
		signal: AbortSignal
	) => Promise<{ blob: Blob; contentType: string | null }>;
	save: (blob: Blob, fileName: string) => void;
}

const defaultTransport: DownloadTransport = {
	fetchFile: fetchTrackFile,
	save: saveBlob,
};

let transport: DownloadTransport = defaultTransport;
const controllers = new Map<string, AbortController>();
let seq = 0;

/** Test seam — swap the network/save layer. Pass nothing to restore. */
export function setDownloadTransport(t?: DownloadTransport) {
	transport = t ?? defaultTransport;
}

interface DownloadState {
	items: DownloadItem[];
	enqueue: (tracks: DownloadableTrack[], group?: string | null) => number;
	cancel: (id: string) => void;
	retry: (id: string) => void;
	remove: (id: string) => void;
	clearFinished: () => void;
}

const isActive = (s: DownloadStatus) => s === "queued" || s === "downloading";

export const useDownloadStore = create<DownloadState>((set, get) => ({
	items: [],

	enqueue: (tracks, group = null) => {
		const active = new Set(
			get()
				.items.filter((i) => isActive(i.status))
				.map((i) => i.trackId)
		);
		const fresh: DownloadItem[] = [];
		for (const t of tracks) {
			if (!t.trackId || active.has(t.trackId)) continue;
			active.add(t.trackId);
			fresh.push({
				...t,
				id: `dl-${Date.now().toString(36)}-${(seq++).toString(36)}`,
				status: "queued",
				loaded: 0,
				total: null,
				error: null,
				group,
				createdAt: Date.now(),
			});
		}
		if (fresh.length === 0) return 0;
		set((s) => ({ items: [...fresh, ...s.items] }));
		pump();
		return fresh.length;
	},

	cancel: (id) => {
		controllers.get(id)?.abort();
		controllers.delete(id);
		patch(id, (i) => (isActive(i.status) ? { status: "canceled" } : {}));
		pump();
	},

	retry: (id) => {
		patch(id, (i) =>
			i.status === "error" || i.status === "canceled"
				? { status: "queued", loaded: 0, total: null, error: null }
				: {}
		);
		pump();
	},

	remove: (id) => {
		controllers.get(id)?.abort();
		controllers.delete(id);
		set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
		pump();
	},

	clearFinished: () =>
		set((s) => ({ items: s.items.filter((i) => isActive(i.status)) })),
}));

function patch(id: string, fn: (item: DownloadItem) => Partial<DownloadItem>) {
	useDownloadStore.setState((s) => ({
		items: s.items.map((i) => (i.id === id ? { ...i, ...fn(i) } : i)),
	}));
}

/** Start queued items (oldest first) until MAX_CONCURRENT are running. */
function pump() {
	const { items } = useDownloadStore.getState();
	const running = items.filter((i) => i.status === "downloading").length;
	const slots = MAX_CONCURRENT - running;
	if (slots <= 0) return;
	const next = items
		.filter((i) => i.status === "queued")
		.sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1))
		.slice(0, slots);
	for (const item of next) void run(item);
}

async function run(item: DownloadItem) {
	const controller = new AbortController();
	controllers.set(item.id, controller);
	patch(item.id, () => ({ status: "downloading", loaded: 0, total: null, error: null }));
	try {
		const { blob, contentType } = await transport.fetchFile(
			item.trackId,
			(p) => patch(item.id, () => ({ loaded: p.loaded, total: p.total })),
			controller.signal
		);
		if (controller.signal.aborted) return;
		transport.save(blob, fileNameFor(item, contentType));
		patch(item.id, () => ({ status: "done", loaded: blob.size, total: blob.size }));
	} catch (e) {
		if (controller.signal.aborted) return;
		patch(item.id, () => ({
			status: "error",
			error: e instanceof Error ? e.message : "Download failed",
		}));
	} finally {
		controllers.delete(item.id);
		pump();
	}
}

/** Aggregate progress across active items, 0..1 (null = nothing running). */
export function selectOverallProgress(items: DownloadItem[]): number | null {
	const active = items.filter((i) => isActive(i.status));
	if (active.length === 0) return null;
	let sum = 0;
	for (const i of active) {
		sum += i.status === "downloading" && i.total ? Math.min(1, i.loaded / i.total) : 0;
	}
	return sum / active.length;
}

export function selectActiveCount(items: DownloadItem[]): number {
	return items.filter((i) => isActive(i.status)).length;
}
