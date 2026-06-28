import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	authServerMock,
	convexApiMock,
	setSessionUser,
	clearSession,
} from "@/test/helpers/mockAuth";
import {
	makeNextRequest,
	makeParams,
	readJson,
} from "@/test/helpers/nextRequest";

// ── Mock setup ──

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/repositories/storedTracks", () => ({ findHighestStored: vi.fn(), deleteStoredRows: vi.fn(), hasStored: vi.fn(), upsertStored: vi.fn() }));
vi.mock("@/lib/repositories/deezerCredentials", () => ({ getDeezerCredential: vi.fn(), upsertDeezerCredential: vi.fn() }));

// vi.mock factories are hoisted above imports — use vi.hoisted() so test
// code can share refs with the factory below.
const { serverStateMock, s3StreamMock, startProgressiveStreamMock } = vi.hoisted(
	() => ({
		serverStateMock: {
			getDeemixApp: vi.fn(),
			getUserDz: vi.fn(),
			setUserDz: vi.fn(),
			getGuestDz: vi.fn(),
		},
		s3StreamMock: {
			headObject: vi.fn(),
		},
		startProgressiveStreamMock: vi.fn(),
	})
);

vi.mock("@/lib/server-state", () => serverStateMock);
vi.mock("@/lib/s3-stream", () => s3StreamMock);
vi.mock("@/lib/deemix/progressive-stream", () => ({
	startProgressiveStream: startProgressiveStreamMock,
}));

import { GET } from "./route";
import { findHighestStored, deleteStoredRows } from "@/lib/repositories/storedTracks";
import { getDeezerCredential } from "@/lib/repositories/deezerCredentials";
const findHighestStoredMock = vi.mocked(findHighestStored);
const deleteStoredRowsMock = vi.mocked(deleteStoredRows);
const getDeezerCredentialMock = vi.mocked(getDeezerCredential);

// ── Local helpers / factories (kept inline per test guidance) ──

const s3Row = {
	id: "x",
	trackId: "1",
	bitrate: 320,
	storagePath: "deemix-music/foo.mp3",
	storageType: "s3",
} as any;

const localRow = { ...s3Row, storageType: "local" } as any;

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
}

function makeApp(opts: FakeAppOptions = {}) {
	const lock: FakeLock = {
		alreadyInProgress: opts.lockAlreadyInProgress ?? false,
		waitForExisting: vi.fn(async () => {}),
		release: vi.fn(),
	};
	const acquireDownloadLock = vi.fn(() => lock);
	const app = {
		settings: { maxBitrate: opts.maxBitrate ?? 320 },
		acquireDownloadLock,
		storageProvider:
			opts.storageProvider === undefined ? {} : opts.storageProvider,
	};
	return { app, lock, acquireDownloadLock };
}

/** Configure the auth + Deezer + DeemixApp mocks for a successful guard. */
function arrangeAuthOk(app: unknown) {
	setSessionUser("u1");
	serverStateMock.getUserDz.mockReturnValue({ loggedIn: true });
	serverStateMock.getDeemixApp.mockResolvedValue(app);
}

describe("GET /api/v1/stream-progressive/[trackId]", () => {
	beforeEach(() => {
		findHighestStoredMock.mockReset();
		deleteStoredRowsMock.mockReset();
		getDeezerCredentialMock.mockReset();
		clearSession();
		serverStateMock.getDeemixApp.mockReset();
		serverStateMock.getUserDz.mockReset();
		serverStateMock.setUserDz.mockReset();
		serverStateMock.getGuestDz.mockReset();
		s3StreamMock.headObject.mockReset();
		startProgressiveStreamMock.mockReset();
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
		getDeezerCredentialMock.mockResolvedValue(null);

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

	it("redirects to /stream when stored row exists on S3 and headObject succeeds", async () => {
		const { app, acquireDownloadLock } = makeApp();
		arrangeAuthOk(app);
		findHighestStoredMock.mockResolvedValue(s3Row);
		s3StreamMock.headObject.mockResolvedValue({
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
		expect(s3StreamMock.headObject).toHaveBeenCalledWith("deemix-music/foo.mp3");
		expect(acquireDownloadLock).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).not.toHaveBeenCalled();
	});

	it("on headObject NotFound: deletes stale rows and falls through to live stream", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		findHighestStoredMock.mockResolvedValue(s3Row);
		const err: any = new Error("Not found");
		err.name = "NotFound";
		s3StreamMock.headObject.mockRejectedValue(err);
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
		expect(deleteStoredRowsMock).toHaveBeenCalledWith("1");
		expect(startProgressiveStreamMock).toHaveBeenCalled();
	});

	it("on headObject ENOTFOUND (non-404): falls through to live stream WITHOUT deleting the row", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		findHighestStoredMock.mockResolvedValue(s3Row);
		const err: any = new Error("ENOTFOUND");
		err.code = "ENOTFOUND";
		s3StreamMock.headObject.mockRejectedValue(err);
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
		expect(deleteStoredRowsMock).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).toHaveBeenCalled();
	});

	it("redirects to /stream when stored row is on local storage (skips headObject)", async () => {
		const { app } = makeApp();
		arrangeAuthOk(app);
		findHighestStoredMock.mockResolvedValue(localRow);

		const res = await GET(
			makeNextRequest({
				url: "http://localhost:3000/api/v1/stream-progressive/1",
			}),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/v1/stream/1");
		expect(s3StreamMock.headObject).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).not.toHaveBeenCalled();
	});

	it("opens a live stream when no stored row exists", async () => {
		const { app, acquireDownloadLock } = makeApp();
		arrangeAuthOk(app);
		findHighestStoredMock.mockResolvedValue(null);
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

	it("preview mode: skips download lock and passes persist: false", async () => {
		const { app, acquireDownloadLock } = makeApp();
		arrangeAuthOk(app);
		findHighestStoredMock.mockResolvedValue(null);
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
		findHighestStoredMock.mockResolvedValue(null);
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
		findHighestStoredMock.mockResolvedValue(null);

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
		findHighestStoredMock.mockResolvedValue(null);

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
		findHighestStoredMock.mockResolvedValue(null);
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
		findHighestStoredMock.mockResolvedValue(null);
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
});
