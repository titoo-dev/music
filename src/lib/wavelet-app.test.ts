import { describe, it, expect, vi, afterEach } from "vitest";
import { WaveletApp, DOWNLOAD_LOCK_TTL_MS, FOLLOW_WAIT_MS } from "./wavelet-app";
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

	it("outlives the progressive route's maxDuration", () => {
		expect(DOWNLOAD_LOCK_TTL_MS).toBeGreaterThan(300_000);
	});
});

describe("WaveletApp.acquireDownloadLock follower hand-off (C4)", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("hands a follower what the holder published, without waiting for the persist (was: the follower waited up to 330 s without a byte)", async () => {
		const app = makeApp();
		const holder = app.acquireDownloadLock("1", 3);
		const follower = app.acquireDownloadLock("1", 3);
		const followed = follower.follow<string>();

		holder.publish("spool-of-holder");
		await expect(followed).resolves.toBe("spool-of-holder");
		// The holder is still persisting: the lock stays taken.
		expect(app.acquireDownloadLock("1", 3).alreadyInProgress).toBe(true);
		// A late follower gets the same value at once.
		await expect(app.acquireDownloadLock("1", 3).follow()).resolves.toBe("spool-of-holder");
	});

	it("resolves a follower with null when the holder releases without publishing", async () => {
		const app = makeApp();
		const holder = app.acquireDownloadLock("1", 3);
		const followed = app.acquireDownloadLock("1", 3).follow();
		holder.release();
		await expect(followed).resolves.toBeNull();
	});

	it("bounds the follower's wait for the holder to open its stream", async () => {
		vi.useFakeTimers();
		const app = makeApp();
		app.acquireDownloadLock("1", 3); // never publishes
		let value: unknown = "pending";
		const followed = app.acquireDownloadLock("1", 3).follow().then((v) => (value = v));
		await vi.advanceTimersByTimeAsync(FOLLOW_WAIT_MS - 1);
		expect(value).toBe("pending");
		await vi.advanceTimersByTimeAsync(2);
		await followed;
		expect(value).toBeNull();
	});

	it("a holder's own handle never follows itself", async () => {
		const app = makeApp();
		const holder = app.acquireDownloadLock("1", 3);
		await expect(holder.follow()).resolves.toBeNull();
		holder.publish("x");
		holder.publish("y"); // first publish wins
		await expect(app.acquireDownloadLock("1", 3).follow()).resolves.toBe("x");
	});

	it("does not hand out a stale holder's value after the TTL", () => {
		vi.useFakeTimers();
		const app = makeApp();
		const stale = app.acquireDownloadLock("1", 3);
		stale.publish("old");
		vi.advanceTimersByTime(DOWNLOAD_LOCK_TTL_MS + 1);
		expect(app.acquireDownloadLock("1", 3).alreadyInProgress).toBe(false);
	});
});
