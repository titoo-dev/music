import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import {
	authMock,
	setSessionUser,
	clearSession,
} from "@/test/helpers/mockAuth";
import {
	makeNextRequest,
	makeParams,
	readJson,
} from "@/test/helpers/nextRequest";
import {
	StorageNotFoundError,
	StorageUnavailableError,
} from "@/lib/wavelet/storage/objects";

// ── Mock setup ──

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

// vi.mock factories are hoisted above imports — use vi.hoisted() so test
// code can share refs with the factory below.
const { serverStateMock, blobStreamMock, startProgressiveStreamMock, afterMock } = vi.hoisted(
	() => ({
		serverStateMock: {
			getWaveletApp: vi.fn(),
			getUserDz: vi.fn(),
			setUserDz: vi.fn(),
			getGuestDz: vi.fn(),
		},
		blobStreamMock: {
			headObject: vi.fn(),
		},
		startProgressiveStreamMock: vi.fn(),
		afterMock: vi.fn(),
	})
);

// after() throws outside a real request scope — capture the callbacks instead.
vi.mock("next/server", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/server")>()),
	after: afterMock,
}));

vi.mock("@/lib/server-state", () => serverStateMock);
vi.mock("@/lib/object-stream", () => blobStreamMock);
vi.mock("@/lib/wavelet/progressive-stream", () => ({
	startProgressiveStream: startProgressiveStreamMock,
}));

import { GET } from "./route";

// ── Local helpers / factories (kept inline per test guidance) ──

const blobRow = {
	id: "x",
	trackId: "1",
	bitrate: 320,
	storagePath: "music/foo.mp3",
	storageType: "r2",
} as any;


function fakeBody() {
	return new ReadableStream({
		start(c) {
			c.enqueue(new Uint8Array([1, 2, 3]));
			c.close();
		},
	});
}

interface FakeLock {
	alreadyInProgress: boolean;
	waitForExisting: ReturnType<typeof vi.fn>;
	release: ReturnType<typeof vi.fn>;
}

interface FakeAppOptions {
	storageProvider?: unknown;
	lockAlreadyInProgress?: boolean;
	maxBitrate?: number;
	/** What the config store holds now (another instance may have changed it). */
	savedBitrate?: number;
}

function makeApp(opts: FakeAppOptions = {}) {
	const lock: FakeLock = {
		alreadyInProgress: opts.lockAlreadyInProgress ?? false,
		waitForExisting: vi.fn(async () => {}),
		release: vi.fn(),
	};
	const acquireDownloadLock = vi.fn(() => lock);
	const settings = { maxBitrate: opts.maxBitrate ?? 320 };
	const app = {
		settings,
		freshSettings: vi.fn(async () => (opts.savedBitrate != null ? { ...settings, maxBitrate: opts.savedBitrate } : settings)),
		acquireDownloadLock,
		storageProvider:
			opts.storageProvider === undefined ? {} : opts.storageProvider,
	};
	return { app, lock, acquireDownloadLock };
}

/** Configure the auth + Deezer + WaveletApp mocks for a successful guard. */
function arrangeAuthOk(app: unknown) {
	setSessionUser("u1");
	serverStateMock.getUserDz.mockReturnValue({ loggedIn: true });
	serverStateMock.getWaveletApp.mockResolvedValue(app);
}

describe("GET /api/v1/stream-progressive/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		serverStateMock.getWaveletApp.mockReset();
		serverStateMock.getUserDz.mockReset();
		serverStateMock.setUserDz.mockReset();
		serverStateMock.getGuestDz.mockReset();
		blobStreamMock.headObject.mockReset();
		startProgressiveStreamMock.mockReset();
		afterMock.mockReset();
	});

	it("returns 401 NOT_AUTHENTICATED when there is no session", async () => {
		// No session, no Deezer ARL → guard fails before any work happens.
		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
		expect(startProgressiveStreamMock).not.toHaveBeenCalled();
	});

	it("returns 403 NO_DEEZER_ARL when user is signed in but has no Deezer credential", async () => {
		setSessionUser("u1");
		serverStateMock.getUserDz.mockReturnValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue(null);

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(403);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NO_DEEZER_ARL");
	});

	it("redirects to /stream when stored row exists in Blob and headObject succeeds", async () => {
		const { app, acquireDownloadLock } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([blobRow]);
		blobStreamMock.headObject.mockResolvedValue({
			contentLength: 100,
			contentType: "audio/mpeg",
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/v1/stream/1");
		expect(blobStreamMock.headObject).toHaveBeenCalledWith("music/foo.mp3");
		expect(acquireDownloadLock).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).not.toHaveBeenCalled();
	});

	it("on headObject StorageNotFoundError: deletes the rows of the missing object and falls through to live stream", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([blobRow]);
		blobStreamMock.headObject.mockRejectedValue(new StorageNotFoundError("music/foo.mp3"));
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/mpeg",
			contentLength: 0,
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		// Every row pointing at the missing object; copies at other keys stay.
		expect(prismaMock.storedTrack.deleteMany).toHaveBeenCalledWith({
			where: { storagePath: "music/foo.mp3" },
		});
		expect(startProgressiveStreamMock).toHaveBeenCalled();
	});

	it("on headObject StorageUnavailableError: falls through to live stream WITHOUT deleting the row", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([blobRow]);
		blobStreamMock.headObject.mockRejectedValue(new StorageUnavailableError(new Error("503")));
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/mpeg",
			contentLength: 0,
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).toHaveBeenCalled();
	});

	it("with live=1 streams from Deezer without touching the cache (was: /stream ↔ /stream-progressive redirect loop while storage refused reads)", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([blobRow]);
		blobStreamMock.headObject.mockResolvedValue({ contentLength: 1, contentType: "audio/mpeg" });
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/mpeg",
			contentLength: 0,
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1?live=1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		expect(blobStreamMock.headObject).not.toHaveBeenCalled();
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).toHaveBeenCalled();
	});

	it.each(["s3", "local", "blob"])(
		"drops pre-R2 %s rows and streams live (was: 302 to /stream for local rows; blob: unreadable suspended Vercel Blob store)",
		async (storageType) => {
			const { app } = makeApp();
			arrangeAuthOk(app);
			prismaMock.storedTrack.findMany.mockResolvedValue([{ ...blobRow, storageType }]);
			startProgressiveStreamMock.mockResolvedValue({
				body: fakeBody(),
				contentType: "audio/mpeg",
				contentLength: 0,
			});

			const res = await GET(
				makeNextRequest({
					url: "http://localhost:3000/api/v1/stream-progressive/1",
				}),
				makeParams({ trackId: "1" })
			);
			expect(res.status).toBe(200);
			expect(blobStreamMock.headObject).not.toHaveBeenCalled();
			// Only the rows in older storage are dropped.
			expect(prismaMock.storedTrack.deleteMany).toHaveBeenCalledWith({
				where: { id: { in: ["x"] } },
			});
			expect(startProgressiveStreamMock).toHaveBeenCalled();
		}
	);

	it("hands the persist promise to after() so Vercel doesn't freeze the upload (was: fire-and-forget)", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
		const persisted = Promise.resolve();
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/mpeg",
			contentLength: 0,
			persisted,
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		expect(afterMock).toHaveBeenCalledTimes(1);
		const callback = afterMock.mock.calls[0][0] as () => unknown;
		expect(callback()).toBe(persisted);
	});

	it("opens a live stream when no stored row exists", async () => {
		const { app, acquireDownloadLock } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/mpeg",
			contentLength: 9001,
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("Cache-Control")).toBe("no-store");
		expect(res.headers.get("Accept-Ranges")).toBe("none");
		expect(res.headers.get("Content-Length")).toBe("9001");
		expect(acquireDownloadLock).toHaveBeenCalledWith("1", 320);
		expect(startProgressiveStreamMock).toHaveBeenCalledWith(
			expect.objectContaining({ persist: true, trackId: "1", bitrate: 320 })
		);
	});

	it("streams at the server quality saved since this instance started (was: kept the cold-start maxBitrate)", async () => {
		const { app, acquireDownloadLock } = makeApp({ maxBitrate: 1, savedBitrate: 3 });
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
		startProgressiveStreamMock.mockResolvedValue({ body: fakeBody(), contentType: "audio/mpeg", contentLength: 0 });

		const res = await GET(makeNextRequest({ url: "http://localhost:3000/api/v1/stream-progressive/1" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		expect(acquireDownloadLock).toHaveBeenCalledWith("1", 3);
		expect(startProgressiveStreamMock).toHaveBeenCalledWith(expect.objectContaining({ bitrate: 3, settings: expect.objectContaining({ maxBitrate: 3 }) }));
	});

	it("preview mode: skips download lock and passes persist: false", async () => {
		const { app, acquireDownloadLock } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/mpeg",
			contentLength: 0,
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1?preview=1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		expect(acquireDownloadLock).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).toHaveBeenCalledWith(
			expect.objectContaining({ persist: false })
		);
	});

	it("head mode (preview=1&head=1): passes maxBytes: 64 * 1024", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/mpeg",
			contentLength: 0,
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1?preview=1&head=1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		expect(startProgressiveStreamMock).toHaveBeenCalledWith(
			expect.objectContaining({ persist: false, maxBytes: 64 * 1024 })
		);
	});

	it("when lock is already in progress: awaits waitForExisting and 302s to /stream", async () => {
		const { app, lock } = makeApp({ lockAlreadyInProgress: true });
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/v1/stream/1");
		expect(lock.waitForExisting).toHaveBeenCalled();
		expect(startProgressiveStreamMock).not.toHaveBeenCalled();
	});

	it("STORAGE_UNAVAILABLE: releases lock and 500s when app.storageProvider is null on a non-preview request", async () => {
		const { app, lock } = makeApp({ storageProvider: null });
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("STORAGE_UNAVAILABLE");
		expect(lock.release).toHaveBeenCalled();
		expect(startProgressiveStreamMock).not.toHaveBeenCalled();
	});

	it("when startProgressiveStream throws: releases the lock and surfaces 500", async () => {
		const { app, lock } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
		startProgressiveStreamMock.mockRejectedValue(new Error("upstream broke"));

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(500);
		expect(lock.release).toHaveBeenCalled();
	});

	it("successful live stream emits no-store + Accept-Ranges: none", async () => {
		// Distinct from the basic "no stored row" case — explicitly locks in
		// header policy on the live-stream response (recent fix surface).
		const { app } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
		startProgressiveStreamMock.mockResolvedValue({
			body: fakeBody(),
			contentType: "audio/flac",
			contentLength: 0, // 0 → no Content-Length header
		});

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("audio/flac");
		expect(res.headers.get("Cache-Control")).toBe("no-store");
		expect(res.headers.get("Accept-Ranges")).toBe("none");
		expect(res.headers.get("Content-Length")).toBeNull();
	});
	it("checks the MP3_320 copy rather than MP3_MISC (was: orderBy bitrate desc picked MP3_MISC=8 over MP3_320=3)", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		prismaMock.storedTrack.findMany.mockResolvedValue([
			{ ...blobRow, id: "misc", bitrate: 8, storagePath: "tracks/1/8.mp3" },
			{ ...blobRow, id: "hq", bitrate: 3, storagePath: "tracks/1/3.mp3" },
		]);
		blobStreamMock.headObject.mockResolvedValue({ contentLength: 1, contentType: "audio/mpeg" });

		const res = await GET(makeNextRequest({ url: "http://localhost:3000/api/v1/stream-progressive/1" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(302);
		expect(blobStreamMock.headObject).toHaveBeenCalledWith("tracks/1/3.mp3");
	});

	it("re-persists when the cached copy is below the listener's quality (was: the free account's 128 copy was redirected to forever)", async () => {
		const { app } = makeApp({ maxBitrate: 3 });
		arrangeAuthOk(app);
		prismaMock.deezerCredential.findUnique.mockResolvedValue({ canStreamHq: true, canStreamLossless: false });
		prismaMock.storedTrack.findMany.mockResolvedValue([{ ...blobRow, bitrate: 1, requestedBitrate: 1 }]);
		startProgressiveStreamMock.mockResolvedValue({ body: fakeBody(), contentType: "audio/mpeg", contentLength: 0 });

		const res = await GET(makeNextRequest({ url: "http://localhost:3000/api/v1/stream-progressive/1" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		expect(blobStreamMock.headObject).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).toHaveBeenCalledWith(expect.objectContaining({ persist: true, bitrate: 3 }));
	});
});
