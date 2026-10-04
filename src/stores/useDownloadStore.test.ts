import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	useDownloadStore,
	setDownloadTransport,
	selectOverallProgress,
	selectActiveCount,
	MAX_CONCURRENT,
	type DownloadTransport,
	type DownloadItem,
} from "./useDownloadStore";
import type { DownloadProgress } from "@/lib/download";

type Pending = {
	trackId: string;
	onProgress: (p: DownloadProgress) => void;
	signal: AbortSignal;
	resolve: (v: { blob: Blob; contentType: string | null }) => void;
	reject: (e: unknown) => void;
};

let pending: Pending[];
let saved: { size: number; name: string }[];

function makeTransport(): DownloadTransport {
	return {
		fetchFile: (trackId, onProgress, signal) =>
			new Promise((resolve, reject) => {
				pending.push({ trackId, onProgress, signal, resolve, reject });
			}),
		save: (blob, name) => saved.push({ size: blob.size, name }),
	};
}

const track = (id: string) => ({ trackId: id, title: `Song ${id}`, artist: `Artist ${id}` });
const flush = () => new Promise((r) => setTimeout(r, 0));
const statusOf = (trackId: string) =>
	useDownloadStore.getState().items.find((i) => i.trackId === trackId)?.status;

beforeEach(() => {
	pending = [];
	saved = [];
	useDownloadStore.setState({ items: [] });
	setDownloadTransport(makeTransport());
});

afterEach(() => setDownloadTransport());

describe("useDownloadStore — enqueue", () => {
	it("starts at most MAX_CONCURRENT transfers and queues the rest in order", () => {
		const n = useDownloadStore.getState().enqueue([track("1"), track("2"), track("3")]);
		expect(n).toBe(3);
		expect(MAX_CONCURRENT).toBe(2);
		expect(pending.map((p) => p.trackId)).toEqual(["1", "2"]);
		expect(statusOf("1")).toBe("downloading");
		expect(statusOf("2")).toBe("downloading");
		expect(statusOf("3")).toBe("queued");
	});

	it("skips tracks already queued or downloading", () => {
		const { enqueue } = useDownloadStore.getState();
		enqueue([track("1")]);
		expect(enqueue([track("1"), track("1")])).toBe(0);
		expect(useDownloadStore.getState().items).toHaveLength(1);
	});

	it("ignores entries without a trackId", () => {
		expect(useDownloadStore.getState().enqueue([{ ...track("x"), trackId: "" }])).toBe(0);
	});

	it("stores the group label", () => {
		useDownloadStore.getState().enqueue([track("1")], "Album · Discovery");
		expect(useDownloadStore.getState().items[0].group).toBe("Album · Discovery");
	});
});

describe("useDownloadStore — lifecycle", () => {
	it("reports progress, saves with a proper filename and starts the next item", async () => {
		useDownloadStore.getState().enqueue([track("1"), track("2"), track("3")]);
		pending[0].onProgress({ loaded: 50, total: 100 });
		const item = useDownloadStore.getState().items.find((i) => i.trackId === "1")!;
		expect(item.loaded).toBe(50);
		expect(item.total).toBe(100);

		pending[0].resolve({ blob: new Blob(["abcd"]), contentType: "audio/flac" });
		await flush();

		expect(saved).toEqual([{ size: 4, name: "Artist 1 - Song 1.flac" }]);
		expect(statusOf("1")).toBe("done");
		expect(statusOf("3")).toBe("downloading");
		expect(pending.map((p) => p.trackId)).toEqual(["1", "2", "3"]);
	});

	it("throttles progress updates (was: one store update per network chunk)", () => {
		let t = 1000;
		const now = vi.spyOn(Date, "now").mockImplementation(() => t);
		try {
			useDownloadStore.getState().enqueue([track("1")]);
			const writes: number[] = [];
			const stop = useDownloadStore.subscribe((s) => writes.push(s.items[0].loaded));
			for (let i = 1; i <= 50; i++) pending[0].onProgress({ loaded: i, total: 100 });
			t += 250;
			pending[0].onProgress({ loaded: 60, total: 100 });
			pending[0].onProgress({ loaded: 100, total: 100 });
			stop();
			expect(writes).toEqual([1, 60, 100]);
		} finally {
			now.mockRestore();
		}
	});

	it("marks failures with the error message and frees the slot", async () => {
		useDownloadStore.getState().enqueue([track("1"), track("2"), track("3")]);
		pending[0].reject(new Error("NOT_FOUND"));
		await flush();
		const failed = useDownloadStore.getState().items.find((i) => i.trackId === "1")!;
		expect(failed.status).toBe("error");
		expect(failed.error).toBe("NOT_FOUND");
		expect(statusOf("3")).toBe("downloading");
	});

	it("uses a generic message when a non-Error is thrown", async () => {
		useDownloadStore.getState().enqueue([track("1")]);
		pending[0].reject("boom");
		await flush();
		expect(useDownloadStore.getState().items[0].error).toBe("Download failed");
	});

	it("retry re-queues a failed item", async () => {
		useDownloadStore.getState().enqueue([track("1")]);
		pending[0].reject(new Error("x"));
		await flush();
		const id = useDownloadStore.getState().items[0].id;
		useDownloadStore.getState().retry(id);
		expect(useDownloadStore.getState().items[0].status).toBe("downloading");
		expect(useDownloadStore.getState().items[0].error).toBeNull();
		expect(pending).toHaveLength(2);
	});

	it("retry is a no-op on a finished item", async () => {
		useDownloadStore.getState().enqueue([track("1")]);
		pending[0].resolve({ blob: new Blob(["a"]), contentType: null });
		await flush();
		const id = useDownloadStore.getState().items[0].id;
		useDownloadStore.getState().retry(id);
		expect(useDownloadStore.getState().items[0].status).toBe("done");
		expect(pending).toHaveLength(1);
	});

	it("cancel aborts the transfer, never saves, and starts the next one", async () => {
		useDownloadStore.getState().enqueue([track("1"), track("2"), track("3")]);
		const id = useDownloadStore.getState().items.find((i) => i.trackId === "1")!.id;
		useDownloadStore.getState().cancel(id);
		expect(pending[0].signal.aborted).toBe(true);
		expect(statusOf("1")).toBe("canceled");
		expect(statusOf("3")).toBe("downloading");

		pending[0].reject(new DOMException("aborted", "AbortError"));
		await flush();
		expect(statusOf("1")).toBe("canceled");
		expect(saved).toHaveLength(0);
	});

	it("cancel is a no-op on a finished item", async () => {
		useDownloadStore.getState().enqueue([track("1")]);
		pending[0].resolve({ blob: new Blob(["a"]), contentType: null });
		await flush();
		useDownloadStore.getState().cancel(useDownloadStore.getState().items[0].id);
		expect(useDownloadStore.getState().items[0].status).toBe("done");
	});

	it("does not save if the transfer resolves after being canceled", async () => {
		useDownloadStore.getState().enqueue([track("1")]);
		const id = useDownloadStore.getState().items[0].id;
		useDownloadStore.getState().cancel(id);
		pending[0].resolve({ blob: new Blob(["a"]), contentType: null });
		await flush();
		expect(saved).toHaveLength(0);
		expect(useDownloadStore.getState().items[0].status).toBe("canceled");
	});

	it("allows re-downloading a track once the previous run finished", async () => {
		useDownloadStore.getState().enqueue([track("1")]);
		pending[0].resolve({ blob: new Blob(["a"]), contentType: null });
		await flush();
		expect(useDownloadStore.getState().enqueue([track("1")])).toBe(1);
	});

	it("remove drops the item and aborts it", () => {
		useDownloadStore.getState().enqueue([track("1")]);
		const id = useDownloadStore.getState().items[0].id;
		useDownloadStore.getState().remove(id);
		expect(useDownloadStore.getState().items).toHaveLength(0);
		expect(pending[0].signal.aborted).toBe(true);
	});

	it("clearFinished keeps only active items", async () => {
		useDownloadStore.getState().enqueue([track("1"), track("2"), track("3")]);
		pending[0].resolve({ blob: new Blob(["a"]), contentType: null });
		pending[1].reject(new Error("x"));
		await flush();
		useDownloadStore.getState().clearFinished();
		expect(useDownloadStore.getState().items.map((i) => [i.trackId, i.status])).toEqual([["3", "downloading"]]);
	});
});

describe("selectors", () => {
	const base = { trackId: "t", title: "", artist: "", id: "i", error: null, group: null, createdAt: 0 };

	it("selectOverallProgress is null when idle", () => {
		expect(selectOverallProgress([])).toBeNull();
		expect(selectOverallProgress([{ ...base, status: "done", loaded: 1, total: 1 } as DownloadItem])).toBeNull();
	});

	it("averages known progress across active items", () => {
		const items = [
			{ ...base, status: "downloading", loaded: 50, total: 100 },
			{ ...base, status: "downloading", loaded: 10, total: null },
			{ ...base, status: "queued", loaded: 0, total: null },
			{ ...base, status: "downloading", loaded: 300, total: 100 },
			{ ...base, status: "error", loaded: 0, total: null },
		] as DownloadItem[];
		expect(selectOverallProgress(items)).toBeCloseTo((0.5 + 0 + 0 + 1) / 4);
		expect(selectActiveCount(items)).toBe(4);
	});
});
