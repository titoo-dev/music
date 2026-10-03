import { describe, it, expect, vi, afterEach } from "vitest";
import { WaveletApp, DOWNLOAD_LOCK_TTL_MS } from "./wavelet-app";
import type { Listener } from "@/lib/wavelet/types/listener";
import type { ConfigStore } from "@/lib/wavelet/config-store/ConfigStore";

const makeApp = () => new WaveletApp({} as Listener, {} as ConfigStore);

describe("WaveletApp.acquireDownloadLock", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("makes a second caller wait for the first, then frees the slot on release", async () => {
		const app = makeApp();
		const first = app.acquireDownloadLock("1", 9);
		expect(first.alreadyInProgress).toBe(false);

		const second = app.acquireDownloadLock("1", 9);
		expect(second.alreadyInProgress).toBe(true);
		let waited = false;
		const wait = second.waitForExisting().then(() => (waited = true));
		await Promise.resolve();
		expect(waited).toBe(false);

		first.release();
		await wait;
		expect(waited).toBe(true);
		expect(app.acquireDownloadLock("1", 9).alreadyInProgress).toBe(false);
	});

	it("keys locks per track and bitrate", () => {
		const app = makeApp();
		app.acquireDownloadLock("1", 9);
		expect(app.acquireDownloadLock("1", 3).alreadyInProgress).toBe(false);
		expect(app.acquireDownloadLock("2", 9).alreadyInProgress).toBe(false);
	});

	it("drops a lock its holder never released (was: stream stuck buffering after the holder timed out)", () => {
		vi.useFakeTimers();
		const app = makeApp();
		app.acquireDownloadLock("1", 9); // holder killed at maxDuration: no release

		vi.advanceTimersByTime(DOWNLOAD_LOCK_TTL_MS - 1);
		expect(app.acquireDownloadLock("1", 9).alreadyInProgress).toBe(true);

		vi.advanceTimersByTime(2);
		const next = app.acquireDownloadLock("1", 9);
		expect(next.alreadyInProgress).toBe(false);
	});

	it("a stale holder releasing late does not free its successor's lock", () => {
		vi.useFakeTimers();
		const app = makeApp();
		const stale = app.acquireDownloadLock("1", 9);
		vi.advanceTimersByTime(DOWNLOAD_LOCK_TTL_MS + 1);
		app.acquireDownloadLock("1", 9);

		stale.release();
		expect(app.acquireDownloadLock("1", 9).alreadyInProgress).toBe(true);
	});

	it("bounds the wait on a lock that is never released", async () => {
		vi.useFakeTimers();
		const app = makeApp();
		app.acquireDownloadLock("1", 9);
		const waiter = app.acquireDownloadLock("1", 9);
		let waited = false;
		const wait = waiter.waitForExisting().then(() => (waited = true));

		await vi.advanceTimersByTimeAsync(DOWNLOAD_LOCK_TTL_MS);
		await wait;
		expect(waited).toBe(true);
	});
});
